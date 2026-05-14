// Update legacyodyssey.com apex SPF to authorize Resend in addition to Spacemail.
// Was:    v=spf1 include:spf.spacemail.com ~all
// Now:    v=spf1 include:spf.spacemail.com include:_spf.resend.com ~all
require('dotenv').config();
// Node 18+ has global fetch built in; no node-fetch dependency needed.

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF = 'https://api.cloudflare.com/client/v4';
const NEW_SPF = 'v=spf1 include:spf.spacemail.com include:_spf.resend.com ~all';

if (!ZONE_ID || !TOKEN) {
  console.error('Missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN in .env');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

(async () => {
  // 1. Find the existing apex TXT record that contains v=spf1
  const listRes = await fetch(
    `${CF}/zones/${ZONE_ID}/dns_records?type=TXT&name=legacyodyssey.com&per_page=50`,
    { headers }
  );
  const list = await listRes.json();
  if (!list.success) {
    console.error('Cloudflare list failed:', JSON.stringify(list.errors, null, 2));
    process.exit(1);
  }
  const spfRecord = list.result.find(r => /v=spf1/i.test(r.content));
  if (!spfRecord) {
    console.error('No existing SPF record found on legacyodyssey.com apex.');
    process.exit(1);
  }

  console.log('Found SPF record:');
  console.log('  id:    ', spfRecord.id);
  console.log('  before:', spfRecord.content);
  console.log('  after: ', NEW_SPF);

  if (spfRecord.content === NEW_SPF) {
    console.log('Already correct — nothing to do.');
    return;
  }

  // 2. PATCH the record with the new SPF value
  const patchRes = await fetch(
    `${CF}/zones/${ZONE_ID}/dns_records/${spfRecord.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ content: NEW_SPF }),
    }
  );
  const patched = await patchRes.json();
  if (!patched.success) {
    console.error('Cloudflare update failed:', JSON.stringify(patched.errors, null, 2));
    process.exit(1);
  }
  console.log('SPF updated successfully. Cloudflare proxied DNS propagates in ~1 min.');
})();
