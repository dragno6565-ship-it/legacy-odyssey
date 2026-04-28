/**
 * Sidebar nav + mobile header. Direct port of sidebar.ejs.
 *
 * Phase 1 ports the paid-customer (`!isFree`) version only — free-tier
 * locked-section UI lands when we port the marketing/free flow in Phase 3.
 */
import type { FC } from 'hono/jsx';
import type { VisibleSections } from '../../lib/bookService';

type Row = Record<string, any>;

type Props = {
  book: Row;
  visibleSections: VisibleSections;
  isDemoDomain?: boolean;
};

export const Sidebar: FC<Props> = ({ book, visibleSections, isDemoDomain }) => {
  const fullName = [book.child_first_name, book.child_middle_name, book.child_last_name]
    .filter(Boolean)
    .join(' ');
  const born = book.birth_date
    ? new Date(book.birth_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const familyMemoriesShown =
    visibleSections.family ||
    visibleSections.firsts ||
    visibleSections.holidays ||
    visibleSections.letters ||
    visibleSections.recipes;

  return (
    <>
      <header class="mobile-header">
        <span class="mobile-logo">{book.child_first_name}'s Book</span>
        <button class="hamburger" onclick="toggleNav()" aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="nav-overlay" id="navOverlay" onclick="toggleNav()"></div>

      <nav id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">✦ Legacy Odyssey</div>
          <div class="sidebar-child-name">{fullName}</div>
          <div class="sidebar-tagline">
            Born · {born} · {book.city || ''}
          </div>
        </div>
        <div class="sidebar-nav">
          <div class="nav-section-label">The Book</div>
          <a class="nav-item active" onclick="showPage('welcome')">
            <span class="nav-icon">🌟</span>
            <span class="nav-label">Welcome</span>
          </a>
          {visibleSections.before && (
            <a class="nav-item" onclick="showPage('before')">
              <span class="nav-icon">🤰</span>
              <span class="nav-label">Before You Arrived</span>
            </a>
          )}
          {visibleSections.birth && (
            <a class="nav-item" onclick="showPage('birth')">
              <span class="nav-icon">🌸</span>
              <span class="nav-label">Birth Story</span>
            </a>
          )}
          {visibleSections.home && (
            <a class="nav-item" onclick="showPage('home')">
              <span class="nav-icon">🏠</span>
              <span class="nav-label">Coming Home</span>
            </a>
          )}
          {visibleSections.months && (
            <a class="nav-item" onclick="showPage('months')">
              <span class="nav-icon">📅</span>
              <span class="nav-label">Month by Month</span>
            </a>
          )}
          {familyMemoriesShown && <div class="nav-section-label">Family &amp; Memories</div>}
          {visibleSections.family && (
            <a class="nav-item" onclick="showPage('family')">
              <span class="nav-icon">👪</span>
              <span class="nav-label">Our Family</span>
            </a>
          )}
          {visibleSections.firsts && (
            <a class="nav-item" onclick="showPage('firsts')">
              <span class="nav-icon">⭐</span>
              <span class="nav-label">Your Firsts</span>
            </a>
          )}
          {visibleSections.holidays && (
            <a class="nav-item" onclick="showPage('holidays')">
              <span class="nav-icon">🎉</span>
              <span class="nav-label">Celebrations</span>
            </a>
          )}
          {visibleSections.letters && (
            <a class="nav-item" onclick="showPage('letters')">
              <span class="nav-icon">💌</span>
              <span class="nav-label">Letters To You</span>
            </a>
          )}
          {visibleSections.recipes && (
            <a class="nav-item" onclick="showPage('recipes')">
              <span class="nav-icon">🍲</span>
              <span class="nav-label">Family Recipes</span>
            </a>
          )}
          {visibleSections.vault && (
            <>
              <div class="nav-section-label">The Vault</div>
              <a class="nav-item locked" onclick="showPage('vault')">
                <span class="nav-icon">🔒</span>
                <span class="nav-label">Locked Until 18</span>
              </a>
            </>
          )}
        </div>
        <div class="sidebar-footer">
          {isDemoDomain ? (
            <>
              <p style="color:#d4bb8a;font-size:0.78rem;line-height:1.5;">
                You're viewing a demo.
                <br />
                Create your own family book.
              </p>
              <a
                href="https://www.legacyodyssey.com"
                target="_blank"
                class="sidebar-edit-link"
                style="background:#c8a96e;color:#1a1510;padding:0.4rem 0.75rem;border-radius:2px;font-weight:600;text-align:center;display:block;"
              >
                Get Your Own Book →
              </a>
            </>
          ) : (
            <>
              <p>
                Crafted with love by
                <br />
                <span>Legacy Odyssey</span>
                <br />
                legacyodyssey.com
              </p>
              <a
                href="https://legacyodyssey.com/account"
                class="sidebar-edit-link"
                target="_blank"
                rel="noopener"
              >
                Edit My Book →
              </a>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
