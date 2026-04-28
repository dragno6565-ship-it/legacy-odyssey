/**
 * Auth middleware for the mobile API. Direct port of src/middleware/requireAuth.js.
 *
 * Pulls Bearer token off the Authorization header, verifies it via the Supabase
 * service-role client (Auth admin call), then resolves the family the request
 * is operating on:
 *   1. If `x-family-id` header is present and the user has access → that family
 *   2. Else fallback to first auth_user_id-owned family
 *   3. Else fallback to first user_metadata.linked_family_ids family
 *
 * On success: c.var.user, c.var.family, c.var.accessibleFamilyIds.
 * On failure: 401 (no/invalid token), 403 (unverified email or no family).
 *
 * Phase 2 introduces this — Phase 1 only needed the public book viewer auth
 * (cookie-based, requireBookPassword).
 */
import type { MiddlewareHandler } from 'hono';
import { adminClient, type Env } from '../lib/supabase';
import type { Family } from '../lib/types';

type Variables = {
  user: any;
  family: Family;
  accessibleFamilyIds: string[];
};

async function getUserFamilyIds(supabase: ReturnType<typeof adminClient>, user: any): Promise<string[]> {
  const linkedIds: string[] = user.user_metadata?.linked_family_ids || [];
  const { data: ownedFamilies } = await supabase
    .from('families')
    .select('id')
    .eq('auth_user_id', user.id);
  const ownedIds = (ownedFamilies || []).map((f: any) => f.id);
  return Array.from(new Set([...ownedIds, ...linkedIds]));
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  const token = authHeader.slice(7);

  const supabase = adminClient(c.env);
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  const user = userData.user;

  if (!user.email_confirmed_at) {
    return c.json(
      {
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please check your email and click the verification link to continue.',
      },
      403
    );
  }

  const accessibleFamilyIds = await getUserFamilyIds(supabase, user);

  const requestedFamilyId = c.req.header('x-family-id');
  let family: Family | null = null;

  if (requestedFamilyId && accessibleFamilyIds.includes(requestedFamilyId)) {
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('id', requestedFamilyId)
      .single();
    family = data as Family | null;
  }

  if (!family) {
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    family = data as Family | null;
  }

  if (!family && accessibleFamilyIds.length > 0) {
    const { data } = await supabase
      .from('families')
      .select('*')
      .eq('id', accessibleFamilyIds[0])
      .single();
    family = data as Family | null;
  }

  if (!family) {
    return c.json({ error: 'No family account found for this user' }, 403);
  }

  c.set('user', user);
  c.set('family', family);
  c.set('accessibleFamilyIds', accessibleFamilyIds);
  await next();
};
