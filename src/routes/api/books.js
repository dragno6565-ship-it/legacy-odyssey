const { Router } = require('express');
const requireAuth = require('../../middleware/requireAuth');
const bookService = require('../../services/bookService');
const { getPublicUrl } = require('../../utils/imageUrl');

// Helper: convert a stored photo value (may be relative path or full URL) to
// a full public URL the mobile app can use directly.
function resolvePhoto(val) {
  if (!val) return '';
  return getPublicUrl(val) || '';
}

const router = Router();

// All routes require auth
router.use(requireAuth);

// GET /api/books/mine — Get current family's book
router.get('/mine', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'No book found' });

    // Build a child object so the mobile app can read it as book.child
    const child = {
      first_name: book.child_first_name || '',
      middle_name: book.child_middle_name || '',
      last_name: book.child_last_name || '',
      birth_date: book.birth_date || '',
      birth_time: book.birth_time || '',
      weight_lbs: book.birth_weight_lbs || '',
      weight_oz: book.birth_weight_oz || '',
      length_inches: book.birth_length_inches || '',
      city: book.birth_city || '',
      state: book.birth_state || '',
      hospital: book.birth_hospital || '',
      name_meaning: book.name_meaning || '',
    };

    // Include months so MonthsScreen can display them
    // (MonthsScreen checks m.month and m.number, so alias month_number)
    const { supabaseAdmin } = require('../../config/supabase');
    const { data: monthsData } = await supabaseAdmin
      .from('months').select('*').eq('book_id', book.id).order('month_number');
    const months = (monthsData || []).map(m => ({
      ...m, month: m.month_number, number: m.month_number,
    }));

    // Include family data for SettingsScreen (password, slug)
    const { data: family } = await supabaseAdmin
      .from('families').select('book_password, subdomain, custom_domain')
      .eq('id', req.family.id).single();

    res.json({
      ...book,
      // Resolve hero photo to full URL so the mobile app can display it
      hero_image_path: resolvePhoto(book.hero_image_path),
      child,
      months,
      // Aliases for SettingsScreen which reads book.password / book.slug
      password: family?.book_password || '',
      book_password: family?.book_password || '',
      slug: family?.subdomain || '',
      family_slug: family?.subdomain || '',
      subdomain: family?.subdomain || '',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/books/mine/full — Get complete book with all sections
router.get('/mine/full', async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).json({ error: 'No book found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/mine/sections — Get which sections are visible on the website
router.get('/mine/sections', async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).json({ error: 'No book found' });
    res.json(data.visibleSections);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/mine/sections — Override section visibility
router.put('/mine/sections', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'No book found' });

    const VALID_KEYS = ['before', 'birth', 'home', 'months', 'family', 'firsts', 'holidays', 'letters', 'recipes', 'keepsakes', 'vault'];
    const current = book.visible_sections || {};

    for (const [key, value] of Object.entries(req.body)) {
      if (VALID_KEYS.includes(key) && typeof value === 'boolean') {
        current[key] = value;
      }
    }

    // Persist the override. As of migration 018 the visible_sections column
    // exists; a failure here is a real error and should surface to the
    // client (the route-level catch returns it) rather than being swallowed.
    await bookService.updateBook(book.id, { visible_sections: current });

    // Return the computed sections (which now includes the saved overrides)
    const data = await bookService.getFullBook(req.family.id);
    res.json(data.visibleSections);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/mine — Update child info
router.put('/mine', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'No book found' });

    const updates = {};

    // Support the mobile app's { child: { first_name, ... } } format
    const child = req.body.child;
    if (child && typeof child === 'object') {
      // Map mobile field names → database column names
      const childMap = {
        first_name: 'child_first_name',
        middle_name: 'child_middle_name',
        last_name: 'child_last_name',
        birth_date: 'birth_date',
        birth_time: 'birth_time',
        weight_lbs: 'birth_weight_lbs',
        weight_oz: 'birth_weight_oz',
        length_inches: 'birth_length_inches',
        city: 'birth_city',
        state: 'birth_state',
        hospital: 'birth_hospital',
        name_meaning: 'name_meaning',
      };
      for (const [mobileKey, dbKey] of Object.entries(childMap)) {
        if (child[mobileKey] !== undefined) updates[dbKey] = child[mobileKey];
      }
    }

    // Also support direct DB column names (for future web dashboard, etc.)
    const allowed = [
      'child_first_name', 'child_middle_name', 'child_last_name', 'birth_date', 'birth_time',
      'birth_weight_lbs', 'birth_weight_oz', 'birth_length_inches',
      'birth_city', 'birth_state', 'birth_hospital', 'name_meaning',
      'hero_image_path', 'name_quote', 'parent_quote', 'parent_quote_attribution',
      'vault_unlock_date',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Sanitize: convert empty strings to null for typed DB columns
    // (Postgres rejects "" for DATE, TIME, INTEGER, NUMERIC columns)
    const typedColumns = [
      'birth_date', 'birth_time', 'birth_weight_lbs', 'birth_weight_oz',
      'birth_length_inches', 'vault_unlock_date',
    ];
    for (const col of typedColumns) {
      if (col in updates && (updates[col] === '' || updates[col] === undefined)) {
        updates[col] = null;
      }
    }

    // Handle password field from SettingsScreen
    // (SettingsScreen sends { password } to this endpoint instead of /mine/settings)
    const passwordValue = req.body.password || req.body.book_password;
    if (passwordValue !== undefined) {
      const { supabaseAdmin } = require('../../config/supabase');
      await supabaseAdmin.from('families')
        .update({ book_password: passwordValue })
        .eq('id', req.family.id);
    }

    if (Object.keys(updates).length === 0 && passwordValue === undefined) {
      return res.json(book); // Nothing to update, return existing book
    }

    let updated = book;
    if (Object.keys(updates).length > 0) {
      updated = await bookService.updateBook(book.id, updates);
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// --- Section endpoints ---

// GET/PUT /api/books/mine/before
router.get('/mine/before', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data: cards } = await supabaseAdmin.from('before_arrived_cards').select('*').eq('book_id', book.id).order('sort_order');
    const { data: checklist } = await supabaseAdmin.from('before_arrived_checklist').select('*').eq('book_id', book.id).order('sort_order');
    res.json({ cards: cards || [], checklist: checklist || [] });
  } catch (err) {
    next(err);
  }
});

router.put('/mine/before', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { cards, checklist } = req.body;
    if (cards) await bookService.updateSectionCards('before_arrived_cards', book.id, cards);
    if (checklist) await bookService.updateSectionCards('before_arrived_checklist', book.id, checklist);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET/PUT /api/books/mine/birth
router.get('/mine/birth', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('birth_stories').select('*').eq('book_id', book.id).maybeSingle();
    if (!data) return res.json({});
    res.json({
      ...data,
      mom_photo_1: resolvePhoto(data.mom_photo_1),
      mom_photo_2: resolvePhoto(data.mom_photo_2),
      dad_photo_1: resolvePhoto(data.dad_photo_1),
      dad_photo_2: resolvePhoto(data.dad_photo_2),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/mine/birth', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const data = await bookService.upsertBirthStory(book.id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET/PUT /api/books/mine/coming-home
router.get('/mine/coming-home', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('coming_home_cards').select('*').eq('book_id', book.id).order('sort_order');
    const cards = (data || []).map(c => ({ ...c, photo_path: resolvePhoto(c.photo_path) }));
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

router.put('/mine/coming-home', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    await bookService.updateSectionCards('coming_home_cards', book.id, req.body.cards || req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET/PUT /api/books/mine/months
router.get('/mine/months', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('months').select('*').eq('book_id', book.id).order('month_number');
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/mine/months/:num — Get a single month
router.get('/mine/months/:num', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const num = parseInt(req.params.num);
    if (num < 1 || num > 12) return res.status(400).json({ error: 'Month must be 1-12' });
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('months').select('*').eq('book_id', book.id).eq('month_number', num).maybeSingle();
    if (!data) return res.status(404).json({ error: 'Month not found' });
    res.json({ ...data, photo_path: resolvePhoto(data.photo_path) });
  } catch (err) {
    next(err);
  }
});

router.put('/mine/months/:num', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const num = parseInt(req.params.num);
    if (num < 1 || num > 12) return res.status(400).json({ error: 'Month must be 1-12' });
    const data = await bookService.upsertMonth(book.id, num, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET/PUT /api/books/mine/family/:key
router.get('/mine/family', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('family_members').select('*').eq('book_id', book.id).order('sort_order');
    const members = (data || []).map(m => ({
      ...m,
      photo_path:    resolvePhoto(m.photo_path),
      album_1_path:  resolvePhoto(m.album_1_path),
      album_2_path:  resolvePhoto(m.album_2_path),
      album_3_path:  resolvePhoto(m.album_3_path),
    }));
    res.json(members);
  } catch (err) {
    next(err);
  }
});

router.put('/mine/family/:key', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const data = await bookService.upsertFamilyMember(book.id, req.params.key, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Generic section endpoints (firsts, letters, recipes)
const sectionTables = {
  firsts: 'firsts',
  letters: 'letters',
  recipes: 'recipes',
};

for (const [route, table] of Object.entries(sectionTables)) {
  router.get(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      const { supabaseAdmin } = require('../../config/supabase');
      const { data } = await supabaseAdmin.from(table).select('*').eq('book_id', book.id).order('sort_order');

      // For recipes (post-migration-015), surface a cover photo from
      // recipe_photos so list views can render a thumbnail even when the
      // legacy single photo_path is empty. Silent fallback if the photos
      // table doesn't exist yet.
      if (table === 'recipes' && data && data.length > 0) {
        const ids = data.map((r) => r.id);
        let coverByRecipeId = {};
        try {
          const { data: photos } = await supabaseAdmin
            .from('recipe_photos')
            .select('recipe_id, photo_path, sort_order')
            .in('recipe_id', ids)
            .order('sort_order');
          for (const p of (photos || [])) {
            if (!coverByRecipeId[p.recipe_id]) coverByRecipeId[p.recipe_id] = p.photo_path;
          }
        } catch (_) { /* silent */ }
        return res.json(
          data.map((r) => {
            const cover = coverByRecipeId[r.id] || r.photo_path || null;
            return { ...r, photo_path: cover, cover_photo: cover };
          })
        );
      }

      res.json(data || []);
    } catch (err) {
      next(err);
    }
  });

  router.put(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      // Special-case `recipes`: post-migration-015 it has rich fields
      // (story, prep_time, cook_time, servings, difficulty, notes, directions,
      // slug) plus a recipe_photos gallery. The legacy bulk endpoint here is
      // still hit by mobile v1.0.9 — using updateSectionCards (delete-all,
      // reinsert) would wipe all that. Switch to non-destructive merge.
      if (table === 'recipes') {
        const { supabaseAdmin } = require('../../config/supabase');
        const items = req.body.items || req.body || [];
        if (!Array.isArray(items)) return res.json({ success: true });

        const { data: existing } = await supabaseAdmin
          .from('recipes').select('id, sort_order')
          .eq('book_id', book.id).order('sort_order');
        const existingBySort = {};
        for (const row of (existing || [])) existingBySort[row.sort_order] = row;

        for (let i = 0; i < items.length; i++) {
          const r = items[i] || {};
          const isEmpty = !r.title && !r.description && !r.photo_path && !r.origin_label
                       && (!Array.isArray(r.ingredients) || r.ingredients.length === 0);

          const patch = {};
          if (r.photo_path !== undefined)   patch.photo_path = r.photo_path || null;
          if (r.origin_label !== undefined) patch.origin_label = r.origin_label || null;
          if (r.title !== undefined)        patch.title = r.title || '(untitled)';
          if (r.description !== undefined)  patch.description = r.description || null;
          if (r.ingredients !== undefined)  patch.ingredients = Array.isArray(r.ingredients)
            ? r.ingredients.filter((it) => it != null && it !== '') : [];
          // Newer (v1.0.10+) clients might also send these; pass through if so
          if (r.story !== undefined)        patch.story = r.story || null;
          if (r.prep_time !== undefined)    patch.prep_time = r.prep_time || null;
          if (r.cook_time !== undefined)    patch.cook_time = r.cook_time || null;
          if (r.servings !== undefined)     patch.servings = r.servings || null;
          if (r.difficulty !== undefined)   patch.difficulty = r.difficulty || null;
          if (r.notes !== undefined)        patch.notes = r.notes || null;
          if (r.directions !== undefined)   patch.directions = Array.isArray(r.directions)
            ? r.directions : [];
          if (r.slug !== undefined)         patch.slug = r.slug || null;

          if (existingBySort[i]) {
            if (!isEmpty && Object.keys(patch).length > 0) {
              patch.updated_at = new Date().toISOString();
              await supabaseAdmin.from('recipes').update(patch).eq('id', existingBySort[i].id);
            }
          } else if (!isEmpty) {
            await supabaseAdmin.from('recipes').insert({
              book_id: book.id,
              sort_order: i,
              title: r.title || '(untitled)',
              ...patch,
            });
          }
        }
        // NOTE: do NOT delete recipes beyond items.length — preserves web-added recipes.
        return res.json({ success: true });
      }
      await bookService.updateSectionCards(table, book.id, req.body.items || req.body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });
}

// Celebrations — year-scoped endpoints
router.get('/mine/celebration-years', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    res.json(book.celebration_years || ['Your First Year']);
  } catch (err) { next(err); }
});

router.post('/mine/celebration-years', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const years = book.celebration_years || ['Your First Year'];
    const { label } = req.body;
    if (!label || years.includes(label)) return res.status(400).json({ error: 'Invalid or duplicate label' });
    const updated = [...years, label];
    await bookService.updateBook(book.id, { celebration_years: updated });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/mine/celebration-years', async (req, res, next) => {
  try {
    const { label } = req.body;
    if (!label || label === 'Your First Year') return res.status(400).json({ error: 'Cannot delete first year' });
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const years = (book.celebration_years || ['Your First Year']).filter((y) => y !== label);
    await supabaseAdmin.from('celebrations').delete().eq('book_id', book.id).eq('year_label', label);
    await bookService.updateBook(book.id, { celebration_years: years });
    res.json(years);
  } catch (err) { next(err); }
});

router.get('/mine/celebrations', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const yearLabel = req.query.year_label || 'Your First Year';
    const { data } = await supabaseAdmin
      .from('celebrations')
      .select('*')
      .eq('book_id', book.id)
      .eq('year_label', yearLabel)
      .order('sort_order');

    // Batch-load celebration_photos to surface a cover photo per celebration.
    // Falls back to legacy photo_path if no gallery photos. Table may not
    // exist pre-migration-014 — silent fallback.
    let coverByCelebrationId = {};
    if (data && data.length > 0) {
      const ids = data.map((c) => c.id);
      try {
        const { data: photos } = await supabaseAdmin
          .from('celebration_photos')
          .select('celebration_id, photo_path, sort_order')
          .in('celebration_id', ids)
          .order('sort_order');
        for (const p of (photos || [])) {
          if (!coverByCelebrationId[p.celebration_id]) {
            coverByCelebrationId[p.celebration_id] = p.photo_path;
          }
        }
      } catch (_) { /* pre-migration silent fallback */ }
    }

    const items = (data || []).map((c) => {
      const cover = coverByCelebrationId[c.id] || c.photo_path || null;
      return {
        ...c,
        photo_path: resolvePhoto(cover),
        // Also surface as cover_photo so newer clients can be explicit
        cover_photo: resolvePhoto(cover),
      };
    });
    res.json(items);
  } catch (err) { next(err); }
});

router.put('/mine/celebrations', async (req, res, next) => {
  // Legacy bulk-save endpoint used by mobile v1.0.9 and earlier. Originally
  // this was destructive (delete-all-in-year, reinsert) which was safe when
  // the schema only had {title, body, eyebrow, photo_path}.
  //
  // Post-migration-014 the schema has rich extra fields (location, attendees,
  // gifts, multi-photo galleries via celebration_photos, slug, celebration_date).
  // Old mobile clients don't know about those fields, so the destructive
  // path would wipe rich data customers had added on the web.
  //
  // NEW (non-destructive merge) behavior:
  //   • For each incoming item at index i: update the existing celebration
  //     at (book_id, year_label, sort_order=i) if one exists, otherwise insert.
  //   • Only the fields the client explicitly sent (or that map to legacy
  //     v1.0.9 fields) are written. Unspecified rich fields are left alone.
  //   • Celebrations beyond the items array (sort_order >= items.length) are
  //     NOT touched. Their photos in celebration_photos stay intact.
  //
  // This means v1.0.9 stays functional, AND any rich web-edited data is safe.
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const yearLabel = req.body.year_label || 'Your First Year';
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // Load any existing rows in this year so we can target updates by sort_order
    const { data: existing } = await supabaseAdmin
      .from('celebrations').select('id, sort_order')
      .eq('book_id', book.id).eq('year_label', yearLabel)
      .order('sort_order');
    const existingBySort = {};
    for (const row of (existing || [])) existingBySort[row.sort_order] = row;

    for (let i = 0; i < items.length; i++) {
      const c = items[i] || {};
      // Build the patch with only fields the legacy client actually sends.
      // Old clients send photo_path/eyebrow/title/body. Newer ones may add
      // location/attendees/gifts/celebration_date/slug.
      const patch = {};
      if (c.photo_path !== undefined) patch.photo_path = c.photo_path || null;
      if (c.eyebrow !== undefined)    patch.eyebrow    = c.eyebrow    || null;
      if (c.title !== undefined)      patch.title      = c.title      || '(untitled)';
      if (c.body !== undefined)       patch.body       = c.body       || null;
      if (c.location !== undefined)   patch.location   = c.location   || null;
      if (c.attendees !== undefined)  patch.attendees  = c.attendees  || null;
      if (c.gifts !== undefined)      patch.gifts      = c.gifts      || null;
      if (c.celebration_date !== undefined) patch.celebration_date = c.celebration_date || null;
      if (c.slug !== undefined)       patch.slug       = c.slug       || null;

      const hasAny = Object.keys(patch).length > 0;
      const isEmptyCard = !c.title && !c.body && !c.photo_path && !c.eyebrow &&
                          !c.location && !c.attendees && !c.gifts;

      if (existingBySort[i]) {
        // Update in place — but skip writing if the legacy client sent an
        // entirely-empty card (likely a placeholder row that the v1.0.9 UI
        // always renders). This prevents a "Save All" tap on an unfilled
        // mobile slot from blanking out a web-populated celebration.
        if (hasAny && !isEmptyCard) {
          patch.updated_at = new Date().toISOString();
          await supabaseAdmin.from('celebrations').update(patch)
            .eq('id', existingBySort[i].id);
        }
      } else if (!isEmptyCard) {
        // Insert new row at this sort_order
        const insertRow = {
          book_id: book.id,
          year_label: yearLabel,
          sort_order: i,
          title: c.title || '(untitled)',
          ...patch,
        };
        await supabaseAdmin.from('celebrations').insert(insertRow);
      }
      // else: no existing row + empty card → do nothing
    }

    // NOTE: We do NOT delete celebrations beyond items.length. Anything the
    // web user added past slot 3 stays put.
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Single-celebration CRUD (used by the new web editor + future mobile) ───
// All routes assume req.family is set by the auth middleware further up.

const { supabaseAdmin: _sb } = require('../../config/supabase');

function celebrationSlug(title, sortOrder) {
  const base = (title || ('celebration-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('celebration-' + (sortOrder || 0));
}

// GET single celebration by id (includes its photos)
router.get('/mine/celebrations/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: c } = await _sb.from('celebrations').select('*').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.status(404).json({ error: 'Celebration not found' });
    const { data: photos } = await _sb.from('celebration_photos').select('*').eq('celebration_id', c.id).order('sort_order');
    res.json({ ...c, photos: photos || [] });
  } catch (err) { next(err); }
});

// POST a new single celebration (returns the created row with photos:[])
router.post('/mine/celebrations', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const yearLabel = req.body.year_label || 'Your First Year';

    // Find the next sort_order within the year
    const { data: existing } = await _sb.from('celebrations').select('sort_order').eq('book_id', book.id).eq('year_label', yearLabel).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const title = (req.body.title || '').toString().trim() || 'New Celebration';
    const row = {
      book_id: book.id,
      year_label: yearLabel,
      sort_order: nextSort,
      title,
      eyebrow: req.body.eyebrow || null,
      body: req.body.body || null,
      location: req.body.location || null,
      attendees: req.body.attendees || null,
      gifts: req.body.gifts || null,
      celebration_date: req.body.celebration_date || null,
      slug: req.body.slug || celebrationSlug(title, nextSort),
    };
    const { data, error } = await _sb.from('celebrations').insert(row).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, photos: [] });
  } catch (err) { next(err); }
});

// PUT update a single celebration (excludes photos — use the photo endpoints below)
router.put('/mine/celebrations/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const patch = {};
    const editable = ['title', 'eyebrow', 'body', 'location', 'attendees', 'gifts', 'celebration_date', 'year_label', 'sort_order', 'slug'];
    for (const f of editable) if (req.body[f] !== undefined) patch[f] = req.body[f];
    // Regenerate slug if title changed and no explicit slug given
    if (req.body.title !== undefined && req.body.slug === undefined) {
      patch.slug = celebrationSlug(req.body.title, req.body.sort_order || 0);
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await _sb.from('celebrations').update(patch).eq('id', req.params.id).eq('book_id', book.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a single celebration (cascades to celebration_photos via FK)
router.delete('/mine/celebrations/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { error } = await _sb.from('celebrations').delete().eq('id', req.params.id).eq('book_id', book.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST add a photo to a celebration's gallery
router.post('/mine/celebrations/:id/photos', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    // Verify ownership
    const { data: c } = await _sb.from('celebrations').select('id').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.status(404).json({ error: 'Celebration not found' });

    const { photo_path, caption } = req.body;
    if (!photo_path) return res.status(400).json({ error: 'photo_path is required' });

    // Find next sort_order
    const { data: existing } = await _sb.from('celebration_photos').select('sort_order').eq('celebration_id', c.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { data, error } = await _sb.from('celebration_photos').insert({
      celebration_id: c.id,
      photo_path,
      caption: caption || null,
      sort_order: nextSort,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT update a celebration photo (caption, sort_order, photo_path)
router.put('/mine/celebration-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    // Verify ownership via the celebration's book_id
    const { data: photo } = await _sb.from('celebration_photos').select('id, celebration_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: c } = await _sb.from('celebrations').select('id').eq('id', photo.celebration_id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.status(403).json({ error: 'Not authorized for this photo' });

    const patch = { updated_at: new Date().toISOString() };
    if (req.body.caption !== undefined) patch.caption = req.body.caption;
    if (req.body.sort_order !== undefined) patch.sort_order = req.body.sort_order;
    if (req.body.photo_path !== undefined) patch.photo_path = req.body.photo_path;

    const { data, error } = await _sb.from('celebration_photos').update(patch).eq('id', req.params.photoId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a celebration photo
router.delete('/mine/celebration-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    // Verify ownership
    const { data: photo } = await _sb.from('celebration_photos').select('id, celebration_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: c } = await _sb.from('celebrations').select('id').eq('id', photo.celebration_id).eq('book_id', book.id).maybeSingle();
    if (!c) return res.status(403).json({ error: 'Not authorized' });

    const { error } = await _sb.from('celebration_photos').delete().eq('id', req.params.photoId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Recipes (full CRUD + photo gallery) ───────────────────────────────────

function recipeSlug(title, sortOrder) {
  const base = (title || ('recipe-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('recipe-' + (sortOrder || 0));
}

// GET a single recipe with its photos array
router.get('/mine/recipes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: r } = await _sb.from('recipes').select('*').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.status(404).json({ error: 'Recipe not found' });
    const { data: photos } = await _sb.from('recipe_photos').select('*').eq('recipe_id', r.id).order('sort_order');
    res.json({ ...r, photos: photos || [] });
  } catch (err) { next(err); }
});

// POST a new recipe
router.post('/mine/recipes', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: existing } = await _sb.from('recipes').select('sort_order').eq('book_id', book.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const title = (req.body.title || '').toString().trim() || 'New Recipe';
    const row = {
      book_id: book.id,
      sort_order: nextSort,
      title,
      origin_label: req.body.origin_label || null,
      description: req.body.description || null,
      story: req.body.story || null,
      prep_time: req.body.prep_time || null,
      cook_time: req.body.cook_time || null,
      servings: req.body.servings || null,
      difficulty: req.body.difficulty || null,
      notes: req.body.notes || null,
      ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : [],
      directions: Array.isArray(req.body.directions) ? req.body.directions : [],
      slug: req.body.slug || recipeSlug(title, nextSort),
    };
    const { data, error } = await _sb.from('recipes').insert(row).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, photos: [] });
  } catch (err) { next(err); }
});

// PUT update a recipe (excludes photos — use the photo endpoints)
router.put('/mine/recipes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const patch = {};
    const editable = ['title', 'origin_label', 'description', 'story', 'prep_time', 'cook_time', 'servings', 'difficulty', 'notes', 'ingredients', 'directions', 'sort_order', 'slug'];
    for (const f of editable) if (req.body[f] !== undefined) patch[f] = req.body[f];
    if (req.body.title !== undefined && req.body.slug === undefined) {
      patch.slug = recipeSlug(req.body.title, req.body.sort_order || 0);
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await _sb.from('recipes').update(patch).eq('id', req.params.id).eq('book_id', book.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a recipe (cascades to recipe_photos via FK)
router.delete('/mine/recipes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { error } = await _sb.from('recipes').delete().eq('id', req.params.id).eq('book_id', book.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST add a photo to a recipe gallery
router.post('/mine/recipes/:id/photos', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: r } = await _sb.from('recipes').select('id').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.status(404).json({ error: 'Recipe not found' });

    const { photo_path, caption } = req.body;
    if (!photo_path) return res.status(400).json({ error: 'photo_path is required' });

    const { data: existing } = await _sb.from('recipe_photos').select('sort_order').eq('recipe_id', r.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { data, error } = await _sb.from('recipe_photos').insert({
      recipe_id: r.id,
      photo_path,
      caption: caption || null,
      sort_order: nextSort,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT update a recipe photo
router.put('/mine/recipe-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: photo } = await _sb.from('recipe_photos').select('id, recipe_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: r } = await _sb.from('recipes').select('id').eq('id', photo.recipe_id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.status(403).json({ error: 'Not authorized for this photo' });

    const patch = {};
    if (req.body.caption !== undefined) patch.caption = req.body.caption;
    if (req.body.sort_order !== undefined) patch.sort_order = req.body.sort_order;
    if (req.body.photo_path !== undefined) patch.photo_path = req.body.photo_path;
    if (req.body.focal_x !== undefined) patch.focal_x = req.body.focal_x;
    if (req.body.focal_y !== undefined) patch.focal_y = req.body.focal_y;

    const { data, error } = await _sb.from('recipe_photos').update(patch).eq('id', req.params.photoId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a recipe photo
router.delete('/mine/recipe-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: photo } = await _sb.from('recipe_photos').select('id, recipe_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: r } = await _sb.from('recipes').select('id').eq('id', photo.recipe_id).eq('book_id', book.id).maybeSingle();
    if (!r) return res.status(403).json({ error: 'Not authorized' });

    const { error } = await _sb.from('recipe_photos').delete().eq('id', req.params.photoId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── Keepsakes (full CRUD + photo gallery) ─────────────────────────────────

function keepsakeSlug(title, sortOrder) {
  const base = (title || ('keepsake-' + (sortOrder || 0))).toString();
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('keepsake-' + (sortOrder || 0));
}

// GET — list all keepsakes for the book (used by mobile + list views).
// Returns rows with a `cover_photo` field synthesized from keepsake_photos.
router.get('/mine/keepsakes', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data } = await _sb.from('keepsakes').select('*').eq('book_id', book.id).order('sort_order');

    let coverByKeepsakeId = {};
    if (data && data.length > 0) {
      const ids = data.map((k) => k.id);
      try {
        const { data: photos } = await _sb.from('keepsake_photos')
          .select('keepsake_id, photo_path, sort_order')
          .in('keepsake_id', ids)
          .order('sort_order');
        for (const p of (photos || [])) {
          if (!coverByKeepsakeId[p.keepsake_id]) coverByKeepsakeId[p.keepsake_id] = p.photo_path;
        }
      } catch (_) { /* silent */ }
    }
    res.json((data || []).map((k) => ({ ...k, cover_photo: coverByKeepsakeId[k.id] || null })));
  } catch (err) { next(err); }
});

// GET single keepsake (includes its photos)
router.get('/mine/keepsakes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: k } = await _sb.from('keepsakes').select('*').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.status(404).json({ error: 'Keepsake not found' });
    const { data: photos } = await _sb.from('keepsake_photos').select('*').eq('keepsake_id', k.id).order('sort_order');
    res.json({ ...k, photos: photos || [] });
  } catch (err) { next(err); }
});

// POST a new keepsake (returns the created row with photos:[])
router.post('/mine/keepsakes', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: existing } = await _sb.from('keepsakes').select('sort_order').eq('book_id', book.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const title = (req.body.title || '').toString().trim() || 'New Keepsake';
    const row = {
      book_id: book.id,
      sort_order: nextSort,
      title,
      category: req.body.category || null,
      age_text: req.body.age_text || null,
      date_made: req.body.date_made || null,
      attribution: req.body.attribution || null,
      description: req.body.description || null,
      story: req.body.story || null,
      slug: req.body.slug || keepsakeSlug(title, nextSort),
    };
    const { data, error } = await _sb.from('keepsakes').insert(row).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, photos: [] });
  } catch (err) { next(err); }
});

// PUT update a keepsake (excludes photos — use photo endpoints)
router.put('/mine/keepsakes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const patch = {};
    const editable = ['title', 'category', 'age_text', 'date_made', 'attribution', 'description', 'story', 'sort_order', 'slug'];
    for (const f of editable) if (req.body[f] !== undefined) patch[f] = req.body[f];
    if (req.body.title !== undefined && req.body.slug === undefined) {
      patch.slug = keepsakeSlug(req.body.title, req.body.sort_order || 0);
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await _sb.from('keepsakes').update(patch).eq('id', req.params.id).eq('book_id', book.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a keepsake (cascades to keepsake_photos via FK)
router.delete('/mine/keepsakes/:id', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { error } = await _sb.from('keepsakes').delete().eq('id', req.params.id).eq('book_id', book.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST add a photo to a keepsake gallery
router.post('/mine/keepsakes/:id/photos', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: k } = await _sb.from('keepsakes').select('id').eq('id', req.params.id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.status(404).json({ error: 'Keepsake not found' });

    const { photo_path, caption } = req.body;
    if (!photo_path) return res.status(400).json({ error: 'photo_path is required' });

    const { data: existing } = await _sb.from('keepsake_photos').select('sort_order').eq('keepsake_id', k.id).order('sort_order', { ascending: false }).limit(1);
    const nextSort = ((existing && existing[0] && existing[0].sort_order) || 0) + (existing && existing.length ? 1 : 0);

    const { data, error } = await _sb.from('keepsake_photos').insert({
      keepsake_id: k.id,
      photo_path,
      caption: caption || null,
      sort_order: nextSort,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PUT update a keepsake photo
router.put('/mine/keepsake-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: photo } = await _sb.from('keepsake_photos').select('id, keepsake_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: k } = await _sb.from('keepsakes').select('id').eq('id', photo.keepsake_id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.status(403).json({ error: 'Not authorized for this photo' });

    const patch = {};
    if (req.body.caption !== undefined) patch.caption = req.body.caption;
    if (req.body.sort_order !== undefined) patch.sort_order = req.body.sort_order;
    if (req.body.photo_path !== undefined) patch.photo_path = req.body.photo_path;
    if (req.body.focal_x !== undefined) patch.focal_x = req.body.focal_x;
    if (req.body.focal_y !== undefined) patch.focal_y = req.body.focal_y;

    const { data, error } = await _sb.from('keepsake_photos').update(patch).eq('id', req.params.photoId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// DELETE a keepsake photo
router.delete('/mine/keepsake-photos/:photoId', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const { data: photo } = await _sb.from('keepsake_photos').select('id, keepsake_id').eq('id', req.params.photoId).maybeSingle();
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    const { data: k } = await _sb.from('keepsakes').select('id').eq('id', photo.keepsake_id).eq('book_id', book.id).maybeSingle();
    if (!k) return res.status(403).json({ error: 'Not authorized' });

    const { error } = await _sb.from('keepsake_photos').delete().eq('id', req.params.photoId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Vault items
router.get('/mine/vault', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data } = await supabaseAdmin.from('vault_items').select('*').eq('book_id', book.id).order('created_at');
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

router.post('/mine/vault', async (req, res, next) => {
  try {
    const book = await bookService.getBookByFamilyId(req.family.id);
    const { supabaseAdmin } = require('../../config/supabase');
    const { data, error } = await supabaseAdmin.from('vault_items').insert({ book_id: book.id, ...req.body }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/mine/photo-position — Save focal point for a photo
router.put('/mine/photo-position', async (req, res, next) => {
  try {
    const { storagePath, x, y } = req.body;
    if (!storagePath || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'storagePath, x, and y are required' });
    }
    // Clamp to 0-100
    const cx = Math.max(0, Math.min(100, Number(x)));
    const cy = Math.max(0, Math.min(100, Number(y)));

    const book = await bookService.getBookByFamilyId(req.family.id);
    // If this family has no book record (e.g. Family Album type), silently succeed
    if (!book) return res.json({ success: true, storagePath, x: cx, y: cy });

    const { supabaseAdmin } = require('../../config/supabase');
    // Use JSONB merge: update only this key in photo_positions
    const current = book.photo_positions || {};
    current[storagePath] = { x: cx, y: cy };

    const { error } = await supabaseAdmin
      .from('books')
      .update({ photo_positions: current })
      .eq('id', book.id);

    if (error) throw error;
    res.json({ success: true, storagePath, x: cx, y: cy });
  } catch (err) {
    next(err);
  }
});

// Settings (book password, etc.)
router.put('/mine/settings', async (req, res, next) => {
  try {
    const { book_password, custom_domain } = req.body;
    const updates = {};
    if (book_password) updates.book_password = book_password;
    if (custom_domain !== undefined) updates.custom_domain = custom_domain;

    const familyService = require('../../services/familyService');
    const family = await familyService.update(req.family.id, updates);
    res.json(family);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
