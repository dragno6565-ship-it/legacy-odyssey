const axios = require('axios');

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';
const RAILWAY_TOKEN = process.env.RAILWAY_API_TOKEN;
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;
const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

/**
 * Add a custom domain to the Railway service.
 * Returns { id, cnameTarget, verificationHost, verificationToken } on success.
 *
 * Railway requires TWO DNS records for verification + cert provisioning:
 *   1. CNAME at hostlabel (e.g. "www") → cnameTarget
 *   2. TXT at verificationHost (e.g. "_railway-verify.www") = verificationToken
 * Without the TXT record, Railway never validates ownership and TLS is never issued.
 */
async function addCustomDomain(domain) {
  if (!RAILWAY_TOKEN || !SERVICE_ID || !ENVIRONMENT_ID) {
    throw new Error('Railway API not configured (missing RAILWAY_API_TOKEN, RAILWAY_SERVICE_ID, or RAILWAY_ENVIRONMENT_ID)');
  }

  const mutation = `
    mutation CustomDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status {
          verificationDnsHost
          verificationToken
          dnsRecords {
            requiredValue
            hostlabel
          }
        }
      }
    }
  `;

  const { data } = await axios.post(RAILWAY_API_URL, {
    query: mutation,
    variables: {
      input: {
        domain,
        projectId: PROJECT_ID,
        serviceId: SERVICE_ID,
        environmentId: ENVIRONMENT_ID,
      },
    },
  }, {
    headers: {
      Authorization: `Bearer ${RAILWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  if (data.errors && data.errors.length > 0) {
    throw new Error(`Railway API error: ${data.errors[0].message}`);
  }

  const result = data.data?.customDomainCreate;
  if (!result) {
    throw new Error('Railway returned no domain data');
  }

  // Extract the CNAME target Railway assigned for this domain
  const cnameRecord = result.status?.dnsRecords?.find(r => r.requiredValue);
  const cnameTarget = cnameRecord?.requiredValue || null;
  const verificationHost = result.status?.verificationDnsHost || null;
  const verificationToken = result.status?.verificationToken || null;

  console.log(`Railway custom domain added: ${result.domain} (id: ${result.id}, cname: ${cnameTarget}, verifyHost: ${verificationHost})`);
  return { id: result.id, cnameTarget, verificationHost, verificationToken };
}

module.exports = {
  addCustomDomain,
};
