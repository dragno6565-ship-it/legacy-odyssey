const { supabaseAdmin } = require('../config/supabase');

async function findByCustomDomain(domain) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('custom_domain', domain)
    .eq('is_active', true)
    .single();
  return data;
}

async function findBySubdomain(subdomain) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('is_active', true)
    .single();
  return data;
}

async function findById(id) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function findByAuthUserId(authUserId) {
  // Returns the first family (for backward compat with .single())
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  return data;
}

async function findAllByAuthUserId(authUserId) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true });
  return data || [];
}

async function findByEmail(email) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  return data;
}

async function findByStripeCustomerId(stripeCustomerId) {
  const { data } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  return data;
}

async function create({ email, authUserId, subdomain, displayName, stripeCustomerId, customerName, plan }) {
  const { data, error } = await supabaseAdmin
    .from('families')
    .insert({
      email,
      auth_user_id: authUserId,
      subdomain,
      display_name: displayName,
      stripe_customer_id: stripeCustomerId,
      book_password: 'legacy', // default
      subscription_status: plan === 'paid' ? 'active' : 'trialing',
      plan: plan || 'free',
      ...(customerName ? { customer_name: customerName } : {}),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function update(id, fields) {
  const { data, error } = await supabaseAdmin
    .from('families')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listAll() {
  const { data, error } = await supabaseAdmin
    .from('families')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function updateSubscriptionStatus(stripeCustomerId, status) {
  const plan = status === 'active' ? 'paid' : (status === 'canceled' ? 'free' : undefined);
  const { data, error } = await supabaseAdmin
    .from('families')
    .update({
      subscription_status: status,
      ...(plan ? { plan } : {}),
    })
    .eq('stripe_customer_id', stripeCustomerId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  findByCustomDomain,
  findBySubdomain,
  findByEmail,
  findById,
  findByAuthUserId,
  findAllByAuthUserId,
  findByStripeCustomerId,
  create,
  update,
  listAll,
  updateSubscriptionStatus,
};
