/**
 * Repair a domain that completed checkout with only the www-side records
 * written (apex A + apex _railway-verify TXT missing). Re-runs the apex half
 * of the setup-DNS flow without touching the working www records.
 *
 * Why this exists: the apex pair gets skipped silently if
 * railwayService.addCustomDomain(apex) throws inside the catch block in
 * domainService.processDomainOrder. Discovered via lotest1.com on Apr 25 2026.
 *
 * Usage:  node scripts/repair-apex-dns.js <domain>
 *   e.g.: node scripts/repair-apex-dns.js lotest1.com
 */
require('dotenv').config();
const { spaceship } = require('../src/config/spaceship');
const railwayService = require('../src/services/railwayService');

const RAILWAY_FASTLY_IP = '151.101.2.15';

async function main() {
  const domain = process.argv[2];
  if (!domain) {
    console.error('Usage: node scripts/repair-apex-dns.js <domain>');
    process.exit(1);
  }
  if (!spaceship) {
    console.error('Spaceship API not configured (SPACESHIP_API_KEY / _SECRET)');
    process.exit(1);
  }

  console.log(`\n=== Repairing apex DNS for ${domain} ===\n`);

  // 1. Read current Spaceship records so we don't clobber the working www records.
  console.log('1) Reading current Spaceship DNS records…');
  const { data: existing } = await spaceship.get(`/dns/records/${encodeURIComponent(domain)}`, { params: { take: 100, skip: 0 } });
  const items = (existing.items || existing.records || existing || []).map((r) => ({
    type: r.type,
    name: r.name,
    ...(r.cname ? { cname: r.cname } : {}),
    ...(r.address ? { address: r.address } : {}),
    ...(r.value ? { value: r.value } : {}),
    ttl: r.ttl || 1800,
  }));
  console.log(`   Existing records: ${items.length}`);
  for (const r of items) {
    const target = r.cname || r.address || r.value || '';
    console.log(`   - ${r.type}\t${r.name}\t→ ${target}`);
  }

  const apexARecords = items.filter((r) => r.type === 'A' && (r.name === '@' || r.name === ''));
  const apexPointsToRailway = apexARecords.some((r) => r.address === RAILWAY_FASTLY_IP);
  const hasApexVerify = items.some((r) => r.type === 'TXT' && r.name === '_railway-verify');
  console.log(`   apex A records:     ${apexARecords.length} (Railway-target? ${apexPointsToRailway})`);
  console.log(`   apex verify TXT?    ${hasApexVerify}`);

  if (apexPointsToRailway && hasApexVerify) {
    console.log('\nApex already configured for Railway. Nothing to repair.');
    return;
  }

  // Strip ALL existing apex A records — they're either missing or pointing at the wrong target
  // (e.g. stale GitHub Pages IPs from a previous setup). We'll add the correct Railway/Fastly A.
  const itemsBeforeStrip = items.length;
  for (let i = items.length - 1; i >= 0; i--) {
    const r = items[i];
    if (r.type === 'A' && (r.name === '@' || r.name === '')) items.splice(i, 1);
  }
  if (itemsBeforeStrip !== items.length) {
    console.log(`   Stripped ${itemsBeforeStrip - items.length} non-Railway apex A record(s) for replacement.`);
  }

  // 2. Register the apex with Railway to get its verification token.
  console.log('\n2) Adding apex to Railway as a custom domain…');
  let apexVerifyHost, apexVerifyToken;
  try {
    const result = await railwayService.addCustomDomain(domain);
    apexVerifyHost = result.verificationHost;
    apexVerifyToken = result.verificationToken;
    console.log(`   verifyHost: ${apexVerifyHost}`);
    console.log(`   verifyToken: ${apexVerifyToken ? apexVerifyToken.slice(0, 12) + '…' : '(none)'}`);
  } catch (err) {
    // If apex was already added previously, Railway returns an error. Continue
    // with no token — the apex just needs the A record to start serving on
    // www's TLS cert (which covers the apex via SAN if Railway issues one).
    console.warn(`   Railway addCustomDomain(${domain}) failed: ${err.message}`);
    console.warn('   Proceeding with apex A record only (no new verify TXT).');
  }

  // 3. Add the correct apex records to the cleaned set and PUT.
  items.push({ type: 'A', name: '@', address: RAILWAY_FASTLY_IP, ttl: 1800 });
  if (!hasApexVerify && apexVerifyHost && apexVerifyToken) {
    items.push({ type: 'TXT', name: apexVerifyHost, value: apexVerifyToken, ttl: 1800 });
  }

  console.log('\n3) Writing updated record set to Spaceship…');
  await spaceship.put(`/dns/records/${encodeURIComponent(domain)}`, { force: true, items });
  console.log(`   Wrote ${items.length} records.`);

  console.log('\nDone. DNS propagation typically completes within 5-15 minutes.');
  console.log(`Verify with:  nslookup -type=A ${domain} 8.8.8.8`);
  console.log(`              curl -I https://${domain}\n`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  if (err.response?.data) console.error('Response:', JSON.stringify(err.response.data, null, 2));
  process.exit(1);
});
