const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SESSION_SECRET',
];

const optional = [
  'SPACESHIP_API_KEY',
  'SPACESHIP_API_SECRET',
  'SPACESHIP_CONTACT_ID',
  'RAILWAY_API_TOKEN',
  'RAILWAY_SERVICE_ID',
  'RAILWAY_ENVIRONMENT_ID',
  'RESEND_API_KEY',
];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const missingOptional = optional.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`Optional env vars not set: ${missingOptional.join(', ')}`);
  }
}

module.exports = { validateEnv };
