const { Router } = require('express');
const requireAuth = require('../../middleware/requireAuth');
const bookService = require('../../services/bookService');

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

    const VALID_KEYS = ['before', 'birth', 'home', 'months', 'family', 'firsts', 'holidays', 'letters', 'recipes', 'vault'];
    const current = book.visible_sections || {};

    for (const [key, value] of Object.entries(req.body)) {
      if (VALID_KEYS.includes(key) && typeof value === 'boolean') {
        current[key] = value;
      }
    }

    try {
      await bookService.updateBook(book.id, { visible_sections: current });
    } catch (dbErr) {
      // If visible_sections column doesn't exist yet, ignore gracefully
      if (dbErr.message && dbErr.message.includes('visible_sections')) {
        console.warn('visible_sections column not yet added to books table');
      } else {
        throw dbErr;
      }
    }

    // Return the computed sections (which includes overrides if column exists)
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
    res.json(data || {});
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
    res.json(data || []);
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
    res.json(data);
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
    res.json(data || []);
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

// Generic section endpoints (firsts, celebrations, letters, recipes)
const sectionTables = {
  firsts: 'firsts',
  celebrations: 'celebrations',
  letters: 'letters',
  recipes: 'recipes',
};

for (const [route, table] of Object.entries(sectionTables)) {
  router.get(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      const { supabaseAdmin } = require('../../config/supabase');
      const { data } = await supabaseAdmin.from(table).select('*').eq('book_id', book.id).order('sort_order');
      res.json(data || []);
    } catch (err) {
      next(err);
    }
  });

  router.put(`/mine/${route}`, async (req, res, next) => {
    try {
      const book = await bookService.getBookByFamilyId(req.family.id);
      await bookService.updateSectionCards(table, book.id, req.body.items || req.body);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });
}

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
    if (!book) return res.status(404).json({ error: 'No book found' });

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
