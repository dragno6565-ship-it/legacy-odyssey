require('dotenv').config();
require('./instrument'); // Sentry must be initialized before everything else

const Sentry = require('@sentry/node');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { validateEnv } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Railway's reverse proxy (needed for req.hostname with custom domains)
app.set('trust proxy', true);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles/scripts from the book template
}));

// CORS for mobile app
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [`https://${process.env.APP_DOMAIN}`, /\.legacyodyssey\.com$/]
    : true,
  credentials: true,
}));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe webhooks need raw body — must be before express.json()
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/', require('./routes/webhooks'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many attempts, please try again later' },
});
app.use('/api/auth/', authLimiter);

// Rate limiting on domain search
const domainSearchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many domain searches, please wait a moment' },
});
app.use('/api/domains/search', domainSearchLimiter);

// --- Routes ---

// Health check (includes hostname debug info)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    hostname: req.hostname,
    hostHeader: req.headers.host,
    xForwardedHost: req.headers['x-forwarded-host'] || null,
  });
});

// API routes (JSON — consumed by mobile app)
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/books', require('./routes/api/books'));
app.use('/api', require('./routes/api/upload'));
app.use('/api/stripe', require('./routes/api/stripe'));
app.use('/api/domains', require('./routes/api/domains'));
app.use('/api/families', require('./routes/api/families'));

// Web routes (SSR — book viewing)
app.use('/', require('./routes/book'));

// Admin routes
app.use('/admin', require('./routes/admin'));

// Sentry error handler (must be before app error handler)
Sentry.setupExpressErrorHandler(app);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Legacy Odyssey server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
