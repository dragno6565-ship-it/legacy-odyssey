// Tiny helpers for health-check return values. Lifted into their own file
// to avoid the circular dependency (index.js imports blocks, blocks import
// helpers, helpers don't import anything).
exports.pass = (detail, meta) => ({ status: 'pass', detail, meta });
exports.warn = (detail, meta) => ({ status: 'warn', detail, meta });
exports.fail = (detail, meta) => ({ status: 'fail', detail, meta });
