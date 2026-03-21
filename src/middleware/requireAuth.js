const { supabaseAdmin } = require('../config/supabase');

/**
 * Get the list of family IDs a user has access to.
 * This includes families where auth_user_id matches directly,
 * plus any families linked via user_metadata.linked_family_ids.
 */
async function getUserFamilyIds(user) {
  const linkedIds = user.user_metadata?.linked_family_ids || [];

  // Get families owned directly (auth_user_id match)
  const { data: ownedFamilies } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('auth_user_id', user.id);

  const ownedIds = (ownedFamilies || []).map(f => f.id);

  // Combine and deduplicate
  return [...new Set([...ownedIds, ...linkedIds])];
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check email verification (allow unverified users to access limited endpoints)
  if (!user.email_confirmed_at) {
    return res.status(403).json({
      error: 'Email not verified',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please check your email and click the verification link to continue.',
    });
  }

  // Get all family IDs this user has access to
  const accessibleFamilyIds = await getUserFamilyIds(user);

  // Check if client requested a specific family (multi-book support)
  const requestedFamilyId = req.headers['x-family-id'];

  let family = null;

  if (requestedFamilyId && accessibleFamilyIds.includes(requestedFamilyId)) {
    // Verify the requested family is in the user's accessible list
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', requestedFamilyId)
      .single();
    family = data;
  }

  if (!family) {
    // Fall back to first family for this user (by auth_user_id)
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    family = data;
  }

  if (!family && accessibleFamilyIds.length > 0) {
    // Fall back to first linked family
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', accessibleFamilyIds[0])
      .single();
    family = data;
  }

  if (!family) {
    return res.status(403).json({ error: 'No family account found for this user' });
  }

  req.user = user;
  req.family = family;
  req.accessibleFamilyIds = accessibleFamilyIds;
  next();
}

module.exports = requireAuth;
