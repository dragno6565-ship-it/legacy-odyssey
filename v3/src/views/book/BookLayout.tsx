/**
 * Master layout for a customer's book.
 *
 * Phase 1: full sidebar + every visible section ported. Free-tier and demo
 * banners come in Phase 3 alongside the marketing/free flow.
 *
 * CSS + book.js are still loaded cross-origin from legacyodyssey.com:
 *   - book.css is 1682 lines and still authored on Express; bundling it into
 *     the Worker waits for Workers Static Assets in Phase 4.
 *   - book.js is ~600 lines (showPage, modals, family-detail, vault countdown)
 *     and is byte-identical between v2 and v3 today, so we cross-load instead
 *     of duplicating it.
 *
 * The data-injection script populates window.months / window.familyMembers /
 * window.birthDate exactly the way the existing book.js expects.
 */
import type { FC } from 'hono/jsx';
import { raw } from 'hono/html';
import type { FullBook } from '../../lib/bookService';
import { Sidebar } from './Sidebar';
import { Welcome } from './Welcome';
import { BeforeArrived } from './BeforeArrived';
import { BirthStory } from './BirthStory';
import { ComingHome } from './ComingHome';
import { Months } from './Months';
import { Family } from './Family';
import { Firsts } from './Firsts';
import { Holidays } from './Holidays';
import { Letters } from './Letters';
import { Recipes } from './Recipes';
import { Vault } from './Vault';

type Props = {
  data: FullBook;
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
  isDemoDomain?: boolean;
};

export const BookLayout: FC<Props> = ({ data, imageUrl, photoPos, isDemoDomain }) => {
  const {
    book,
    beforeCards,
    checklist,
    birthStory,
    comingHomeCards,
    months,
    familyMembers,
    firsts,
    celebrations,
    celebrationsByYear,
    letters,
    recipes,
    visibleSections,
  } = data;

  const fullName = [book.child_first_name, book.child_middle_name, book.child_last_name]
    .filter(Boolean)
    .join(' ');
  const title = `${fullName} — A Legacy Odyssey`;

  // Data the existing book.js expects on window. Same keys/shapes as the
  // <script> block in src/views/layouts/book.ejs.
  const monthsData = visibleSections.months
    ? (months || []).map((m) => ({
        num: m.month_number,
        label: m.label,
        highlight: m.highlight,
        weight: m.weight,
        length: m.length,
        photo: m.photo_path ? imageUrl(m.photo_path) : null,
        pos: m.photo_path ? photoPos(m.photo_path) : '',
        note: m.note,
      }))
    : [];

  const familyMembersData = visibleSections.family
    ? Object.fromEntries(
        (familyMembers || []).map((fm) => [
          fm.member_key,
          {
            name: fm.name,
            relation: fm.relation,
            emoji: fm.emoji,
            photo: fm.photo_path ? imageUrl(fm.photo_path) : null,
            meta: [
              { label: fm.meta_1_label, value: fm.meta_1_value },
              { label: fm.meta_2_label, value: fm.meta_2_value },
              { label: fm.meta_3_label, value: fm.meta_3_value },
              { label: fm.meta_4_label, value: fm.meta_4_value },
            ].filter((m) => m.label),
            story: fm.story,
            story2: fm.story2,
            quote: { text: fm.quote_text, cite: fm.quote_cite },
            photos: [
              { img: fm.album_1_path ? imageUrl(fm.album_1_path) : null, caption: fm.album_1_caption },
              { img: fm.album_2_path ? imageUrl(fm.album_2_path) : null, caption: fm.album_2_caption },
              { img: fm.album_3_path ? imageUrl(fm.album_3_path) : null, caption: fm.album_3_caption },
            ].filter((p) => p.img || p.caption),
          },
        ])
      )
    : {};

  const dataScript = `
    const months = ${JSON.stringify(monthsData)};
    const familyMembers = ${JSON.stringify(familyMembersData)};
    window.birthDate = ${JSON.stringify(book.birth_date || '')};
  `;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <title>{title}</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Production CSS + JS — temporarily cross-loaded until v3 has its own bundle. */}
        {/* Served same-origin via the /css/book.css proxy in src/index.tsx */}
        <link rel="stylesheet" href="/css/book.css" />
        <style>{`
          .v3-banner {
            position: fixed; top: 0; left: 0; right: 0;
            background: #c8a96e; color: #1a1510;
            font: 500 0.7rem/1 'Jost', sans-serif; letter-spacing: 0.15em;
            text-transform: uppercase; text-align: center;
            padding: 6px 12px; z-index: 9999;
          }
          /* push the sidebar/main below the v3 banner so it doesn't overlap */
          body.v3-stack #sidebar { top: 28px; height: calc(100vh - 28px); }
          body.v3-stack #main-content { padding-top: 28px; }
          body.v3-stack .mobile-header { top: 28px; }
        `}</style>
      </head>
      <body class="v3-stack">
        <div class="v3-banner">v3 worker · phase 1 · all sections</div>

        <div id="app">
          <Sidebar book={book} visibleSections={visibleSections} isDemoDomain={isDemoDomain} />

          <div id="main-content">
            <Welcome book={book} imageUrl={imageUrl} photoPos={photoPos} />

            {visibleSections.before && (
              <BeforeArrived
                beforeCards={beforeCards}
                checklist={checklist}
                imageUrl={imageUrl}
                photoPos={photoPos}
              />
            )}
            {visibleSections.birth && (
              <BirthStory
                book={book}
                birthStory={birthStory}
                imageUrl={imageUrl}
                photoPos={photoPos}
              />
            )}
            {visibleSections.home && (
              <ComingHome
                comingHomeCards={comingHomeCards}
                imageUrl={imageUrl}
                photoPos={photoPos}
              />
            )}
            {visibleSections.months && <Months />}
            {visibleSections.family && (
              <Family familyMembers={familyMembers} imageUrl={imageUrl} photoPos={photoPos} />
            )}
            {visibleSections.firsts && <Firsts firsts={firsts} />}
            {visibleSections.holidays && (
              <Holidays
                celebrations={celebrations}
                celebrationsByYear={celebrationsByYear}
                imageUrl={imageUrl}
                photoPos={photoPos}
              />
            )}
            {visibleSections.letters && <Letters letters={letters} />}
            {visibleSections.recipes && (
              <Recipes recipes={recipes} imageUrl={imageUrl} photoPos={photoPos} />
            )}
            {visibleSections.vault && <Vault book={book} imageUrl={imageUrl} />}
          </div>
        </div>

        <div class="book-lightbox" id="bookLightbox">
          <button class="book-lightbox-close" onclick="closeLightbox()">×</button>
          <img id="lightboxImg" src="" alt="Full size image" />
        </div>

        {/* Raw injection — Hono JSX would HTML-escape & inside the JSON, breaking the script.
            raw() marks the string as already-escaped so the inline JSON survives unmangled. */}
        <script>{raw(dataScript)}</script>
        {/* Served same-origin via the /js/book.js proxy in src/index.tsx */}
        <script src="/js/book.js"></script>
      </body>
    </html>
  );
};
