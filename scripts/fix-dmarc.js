// Add rua= aggregate reporting to the DMARC policy.
// Was: v=DMARC1; p=none;
// Now: v=DMARC1; p=none; rua=mailto:dmarc@legacyodyssey.com; ruf=mailto:dmarc@legacyodyssey.com; fo=1;
//
// rua = daily aggregate reports (compressed XML) from major receivers (Gmail, Yahoo, Outlook, etc.)
// ruf = per-failure forensic reports (most receivers don't send these)
// fo=1 = ask for forensic reports on any SPF or DKIM failure (not just both failing)
//
// The dmarc@ address routes to dan@legacyodyssey.com via the catch-all set on Spacemail.
require('dotenv').config();

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF = 'https://api.cloudflare.com/client/v4';
const NEW_DMARC = 'v=DMARC1; p=none; rua=mailto:dmarc@legacyodyssey.com; ruf=mailto:dmarc@legacyodyssey.com; fo=1;';

const headers = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

(async () => {
  const listRes = await fetch(
    `${CF}/zones/${ZONE_ID}/dns_records?type=TXT&name=_dmarc.legacyodyssey.com&per_page=10`,
    { headers }
  );
  const list = await listRes.json();
  if (!list.success) { console.error('list failed:', list.errors); process.exit(1); }
  const dmarc = list.result.find(r => /v=DMARC1/i.test(r.content));
  if (!dmarc) { console.error('no DMARC record found'); process.exit(1); }

  console.log('Found DMARC record:');
  console.log('  id:    ', dmarc.id);
  console.log('  before:', dmarc.content);
  console.log('  after: ', NEW_DMARC);

  if (dmarc.content === NEW_DMARC) { console.log('Already correct.'); return; }

  const patchRes = await fetch(`${CF}/zones/${ZONE_ID}/dns_records/${dmarc.id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ content: NEW_DMARC }),
  });
  const patched = await patchRes.json();
  if (!patched.success) { console.error('patch failed:', patched.errors); process.exit(1); }
  console.log('DMARC updated. Aggregate reports will start flowing within ~24h.');
})();
