const { supabaseAdmin } = require('../config/supabase');

async function resolveFamily(req, res, next) {
  const host = req.hostname;
  const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';

  let family = null;

  // 1. Check custom domain (not our app domain or its subdomains)
  if (!host.endsWith(`.${appDomain}`) && host !== appDomain && host !== `www.${appDomain}`) {
    // Strip www. prefix for custom domain lookup (DB stores bare domain)
    const customDomainHost = host.startsWith('www.') ? host.slice(4) : host;
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('custom_domain', customDomainHost)
      .eq('is_active', true)
      .single();
    family = data;
  }

  // 2. Check subdomain
  if (!family && host.endsWith(`.${appDomain}`)) {
    const subdomain = host.replace(`.${appDomain}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'admin') {
      const { data } = await supabaseAdmin
        .from('families')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();
      family = data;
    }
  }

  // 3. Path-based fallback for development: /book/:slug
  if (!family && req.path.startsWith('/book/')) {
    const slug = req.path.split('/')[2];
    if (slug) {
      const { data } = await supabaseAdmin
        .from('families')
        .select('*')
        .eq('subdomain', slug)
        .eq('is_active', true)
        .single();
      family = data;
      if (family) {
        // Rewrite the path so downstream routes see /
        req.bookSlug = slug;
      }
    }
  }

  // 4. Local dev fallback: use demo family when no match on localhost
  if (!family && (host === 'localhost' || host === '127.0.0.1') && process.env.NODE_ENV !== 'production') {
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('subdomain', 'demo')
      .eq('is_active', true)
      .single();
    family = data;
  }

  if (!family) {
    req.isMarketingSite = true;
    return next();
  }

  // Check subscription status
  const status = family.subscription_status;

  // Immediately blocked statuses
  if (status === 'canceled' || status === 'unpaid') {
    return res.status(403).render('book/expired', { family });
  }

  // Past due: allow a 7-day grace period before blocking
  if (status === 'past_due') {
    const updatedAt = new Date(family.updated_at || family.created_at);
    const daysSincePastDue = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePastDue > 7) {
      return res.status(403).render('book/expired', { family });
    }
  }

  req.family = family;
  next();
}

module.exports = resolveFamily;
