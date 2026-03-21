const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://377f7fca7b35115222baed2f710e0318@o4511084567396352.ingest.us.sentry.io/4511084592758784",
  environment: process.env.NODE_ENV || 'development',
  // Only send errors in production to avoid noise during development
  enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
});
