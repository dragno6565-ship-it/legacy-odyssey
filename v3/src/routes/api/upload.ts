/**
 * /api/upload + DELETE /api/photos/:storagePath — photo upload to Supabase Storage.
 *
 * Direct port of src/routes/api/upload.js + src/services/photoService.js.
 *
 * Mounted at app root (not under /api) because Express has the upload routes
 * at /api/upload and /api/photos respectively. We mirror that exactly.
 *
 * Hono replaces multer with c.req.parseBody() which returns a File for the
 * 'file' field. We feed File.arrayBuffer() into supabase.storage.upload().
 *
 * Path layout: <family_id>/<section>/<identifier>.<ext>
 *   section is one of: hero, before-arrived, birth, coming-home, months,
 *   family, firsts, celebrations, recipes, vault, general
 *   identifier is sent by the mobile client (e.g. month-3, family/mom)
 */
import { Hono } from 'hono';
import { adminClient, type Env } from '../../lib/supabase';
import { requireAuth } from '../../middleware/requireAuth';
import type { Family } from '../../lib/types';

type Variables = {
  user: any;
  family: Family;
  accessibleFamilyIds: string[];
};

const BUCKET = 'photos';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — same as multer config

const upload = new Hono<{ Bindings: Env; Variables: Variables }>();

// Note: requireAuth is attached per-route below rather than via
// `upload.use('*', requireAuth)`. The `use('*')` form runs the middleware
// for EVERY request that reaches this sub-router instance — and because
// the sub-router is mounted at `/api`, that includes other sibling routers
// like /api/domains/search that should be public. Per-route registration
// keeps the auth requirement tight to the two routes that actually need it.

// POST /api/upload — single-photo upload from the mobile PhotoPicker.
upload.post('/upload', requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'] as File | undefined;
  if (!file || typeof file === 'string') {
    return c.json({ error: 'No photo file provided' }, 400);
  }
  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'Only image files are allowed' }, 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return c.json({ error: 'File too large (max 10MB)' }, 413);
  }

  const section = (body['section'] as string) || 'general';
  const identifier =
    (body['identifier'] as string) ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = file.type === 'image/png' ? '.png' : '.jpg';
  const storagePath = `${c.var.family.id}/${section}/${identifier}${ext}`;

  const supabase = adminClient(c.env);
  const buffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return c.json({ error: error.message }, 500);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return c.json({ path: storagePath, url: urlData.publicUrl });
});

// DELETE /api/photos/:storagePath — encoded family/section/file.jpg
upload.delete('/photos/:storagePath', requireAuth, async (c) => {
  const storagePath = decodeURIComponent(c.req.param('storagePath'));
  // Defense-in-depth: only allow deleting paths that start with this family's id.
  if (!storagePath.startsWith(c.var.family.id)) {
    return c.json({ error: 'Access denied' }, 403);
  }
  const supabase = adminClient(c.env);
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

export default upload;
