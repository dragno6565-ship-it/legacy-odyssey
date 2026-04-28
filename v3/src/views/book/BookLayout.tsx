/**
 * Master layout for a customer's book.
 *
 * Phase 1 status: minimal layout — title, fonts, prod CSS via cross-origin link,
 * Welcome section only. The 11 other sections (Before, Birth, Months, Family,
 * Firsts, Holidays, Letters, Recipes, Vault) come in subsequent commits.
 *
 * Why we link to https://legacyodyssey.com/css/book.css instead of bundling:
 *   - 1682 lines of CSS — not a fit for inline <style>
 *   - Workers Static Assets requires a build pipeline we'd rather defer
 *   - The CSS is identical to production, so cross-origin <link> is fine
 *     (no CORS needed for stylesheets, only for fetch/CSSOM access)
 *   - Will switch to Workers Static Assets when we add other static files
 *     (the JS for sidebar nav, etc.)
 */
import type { FC } from 'hono/jsx';
import type { FullBook } from '../../lib/bookService';
import { Welcome } from './Welcome';

type Props = {
  data: FullBook;
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const BookLayout: FC<Props> = ({ data, imageUrl, photoPos }) => {
  const { book } = data;
  const fullName = [book.child_first_name, book.child_middle_name, book.child_last_name]
    .filter(Boolean)
    .join(' ');
  const title = `${fullName} — A Legacy Odyssey`;

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
        {/* Production CSS — temporarily cross-loaded until v3 has its own bundle. */}
        <link rel="stylesheet" href="https://legacyodyssey.com/css/book.css" />
        <style>{`
          /* v3 phase-1 banner — visual marker so we know we're on the new stack */
          .v3-banner {
            position: fixed; top: 0; left: 0; right: 0;
            background: #c8a96e; color: #1a1510;
            font: 500 0.7rem/1 'Jost', sans-serif; letter-spacing: 0.15em;
            text-transform: uppercase; text-align: center;
            padding: 6px 12px; z-index: 9999;
          }
        `}</style>
      </head>
      <body>
        <div class="v3-banner">v3 worker · phase 1 · only Welcome section ported</div>

        {/* Sidebar, full nav, all other sections — coming in later commits */}

        <div class="page-content" style="padding-top: 30px;">
          <Welcome book={book} imageUrl={imageUrl} photoPos={photoPos} />

          <section style="max-width: 720px; margin: 4rem auto; padding: 2rem; text-align: center; color: #8a7e6b; font-family: 'Jost', sans-serif;">
            <p style="font-style: italic; line-height: 1.7;">
              The remaining sections (Before You Arrived, Birth Story, Coming Home, Months,
              Family, Firsts, Holidays, Letters, Recipes, The Vault) are still on Railway/Express.
              Phase 1 next-step ports them to v3.
            </p>
          </section>
        </div>
      </body>
    </html>
  );
};
