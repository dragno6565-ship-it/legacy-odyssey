const axios = require('axios');

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';
const RAILWAY_TOKEN = process.env.RAILWAY_API_TOKEN;
const PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const SERVICE_ID = process.env.RAILWAY_SERVICE_ID;
const ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

/**
 * Add a custom domain to the Railway service.
 * Returns { id, cnameTarget } on success.
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

  console.log(`Railway custom domain added: ${result.domain} (id: ${result.id}, cname: ${cnameTarget})`);
  return { id: result.id, cnameTarget };
}

module.exports = {
  addCustomDomain,
};
