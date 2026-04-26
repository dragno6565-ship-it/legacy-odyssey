require('dotenv').config();
const spaceshipService = require('../src/services/spaceshipService');
(async () => {
  for (const domain of process.argv.slice(2)) {
    try {
      await spaceshipService.setAutoRenew(domain, false);
      console.log(`✓ Auto-renew DISABLED on ${domain}`);
    } catch (err) {
      console.error(`✗ ${domain}: ${err.message}`);
    }
  }
})();
