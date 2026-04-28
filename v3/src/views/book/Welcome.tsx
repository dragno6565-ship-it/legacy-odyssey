/**
 * Welcome / hero section of the book.
 *
 * Direct port of src/views/book/welcome.ejs.
 *
 * Shape exactly mirrors the EJS — same class names, same structure — so
 * the existing book.css from production styles it identically.
 */
import type { FC } from 'hono/jsx';

type Props = {
  book: Record<string, any>;
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const Welcome: FC<Props> = ({ book, imageUrl, photoPos }) => {
  const heroSrc = book.hero_image_path ? imageUrl(book.hero_image_path) : null;
  const middle = book.child_middle_name ? ` ${book.child_middle_name}` : '';
  const birthDate = book.birth_date
    ? new Date(book.birth_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const weight = book.birth_weight_lbs
    ? `${book.birth_weight_lbs} lbs ${book.birth_weight_oz || 0} oz`
    : '';
  const length = book.birth_length_inches ? `${book.birth_length_inches} inches` : '';
  const bornIn = [book.birth_city, book.birth_state].filter(Boolean).join(', ');

  return (
    <section id="page-welcome" class="page-section active">
      <div class="welcome-hero">
        <div class="welcome-photo-half">
          {heroSrc && (
            <img
              src={heroSrc}
              alt={book.child_first_name || ''}
              loading="lazy"
              style={photoPos(book.hero_image_path)}
            />
          )}
          <div class="welcome-photo-overlay"></div>
        </div>
        <div class="welcome-text-half">
          <div class="welcome-eyebrow">✦ Welcome to the Book of</div>
          <h1 class="welcome-name">
            <em>{book.child_first_name}</em>
            {book.child_middle_name && (
              <>
                {' '}
                <em>{book.child_middle_name}</em>
              </>
            )}
            <br />
            {book.child_last_name}
          </h1>
          <p class="welcome-meaning">
            "{book.name_quote || 'A name chosen with love, meaning, and intention'}"
          </p>
          <div class="welcome-divider"></div>
          <div class="vital-stats">
            <div class="stat-item">
              <div class="stat-label">Born</div>
              <div class="stat-value">{birthDate}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Time</div>
              <div class="stat-value">{book.birth_time || ''}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Weight</div>
              <div class="stat-value">{weight}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Length</div>
              <div class="stat-value">{length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Born In</div>
              <div class="stat-value">{bornIn}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Hospital</div>
              <div class="stat-value">{book.birth_hospital || ''}</div>
            </div>
          </div>
          <blockquote class="welcome-quote">
            "
            {book.parent_quote ||
              'From the moment we first saw your face, our world was never the same. This is your story — every moment, every milestone, every memory — written just for you.'}
            "
            <cite>— {book.parent_quote_attribution || 'Mom & Dad'}</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
};
