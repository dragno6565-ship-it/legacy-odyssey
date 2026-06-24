-- Cache for machine-translated book content (Phase 2 i18n / DeepL).
-- Keyed by a hash of the source English text + target language, so an edit to
-- the source naturally produces a new row and re-translates. Display-only data;
-- safe to truncate (it just re-fills from DeepL on next view).
create table if not exists content_translations (
  source_hash text not null,
  target_lang text not null,
  source_text text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  primary key (source_hash, target_lang)
);
