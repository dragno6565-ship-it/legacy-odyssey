/**
 * Legacy Odyssey health-check framework.
 *
 * Each block is a self-contained module that exports:
 *   { blockName, blockLabel, checks: [{ id, name, fn }] }
 *
 * Each check `fn` returns an object: { status, detail, meta? }
 *   status = 'pass' | 'warn' | 'fail'
 *
 * The framework wraps every check in a 10s timeout and a try/catch so a
 * single bad check never breaks a run. Output is a flat array of results
 * the admin page renders, plus a summary the daily cron uses to decide
 * whether to email.
 *
 * To add a new block:
 *   1. Create src/services/healthChecks/blockNFoo.js
 *   2. Add `require('./blockNFoo')` to BLOCKS below
 *   3. (Optional) document it in BLOCKS.md
 */
const BLOCKS = [
  require('./block1Infra'),
  require('./block2Domains'),
  require('./block3Email'),
  require('./block4Checkout'),
  require('./block5MobileApi'),
  require('./block6Backups'),
  require('./block8Customers'),
  // Block 7 (cron health) is intentionally added later — needs a separate
  // cron_runs tracking table that doesn't exist yet.
];

const CHECK_TIMEOUT_MS = 10000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ]);
}

async function runCheck(block, check) {
  const start = Date.now();
  try {
    const result = await withTimeout(check.fn(), CHECK_TIMEOUT_MS, check.id);
    if (!result || !['pass', 'warn', 'fail'].includes(result.status)) {
      return {
        block: block.blockName, blockLabel: block.blockLabel, id: check.id, name: check.name,
        status: 'fail', detail: 'Check returned invalid result', ms: Date.now() - start,
      };
    }
    return {
      block: block.blockName, blockLabel: block.blockLabel, id: check.id, name: check.name,
      status: result.status, detail: result.detail || '', meta: result.meta || null,
      ms: Date.now() - start,
    };
  } catch (err) {
    return {
      block: block.blockName, blockLabel: block.blockLabel, id: check.id, name: check.name,
      status: 'fail', detail: `Threw: ${err.message}`, ms: Date.now() - start,
    };
  }
}

/**
 * Run all (or a filtered subset of) health checks.
 *
 * @param opts.blockFilter - if set, only run checks for this blockName
 * @returns { results, summary, totalMs, ranAt }
 */
async function runAll({ blockFilter } = {}) {
  const start = Date.now();
  const results = [];
  for (const block of BLOCKS) {
    if (blockFilter && block.blockName !== blockFilter) continue;
    const blockResults = await Promise.all(block.checks.map((c) => runCheck(block, c)));
    results.push(...blockResults);
  }
  const summary = {
    total: results.length,
    pass: results.filter((r) => r.status === 'pass').length,
    warn: results.filter((r) => r.status === 'warn').length,
    fail: results.filter((r) => r.status === 'fail').length,
  };
  return { results, summary, totalMs: Date.now() - start, ranAt: new Date().toISOString() };
}

function listBlocks() {
  return BLOCKS.map((b) => ({ blockName: b.blockName, blockLabel: b.blockLabel, count: b.checks.length }));
}

module.exports = { runAll, listBlocks, BLOCKS };

// ── Helpers used by individual block files ─────────────────────────────────
module.exports.pass = (detail, meta) => ({ status: 'pass', detail, meta });
module.exports.warn = (detail, meta) => ({ status: 'warn', detail, meta });
module.exports.fail = (detail, meta) => ({ status: 'fail', detail, meta });
