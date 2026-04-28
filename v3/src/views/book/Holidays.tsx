/**
 * "Celebrations & Traditions" — chapter seven. Direct port of holidays.ejs.
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type Row = Record<string, any>;

type Props = {
  celebrations: Row[];
  celebrationsByYear: { label: string; items: Row[] }[];
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const Holidays: FC<Props> = ({ celebrations, celebrationsByYear, imageUrl, photoPos }) => {
  const yearGroups =
    celebrationsByYear && celebrationsByYear.length
      ? celebrationsByYear
      : [{ label: 'Your First Year', items: celebrations || [] }];
  const visibleGroups = yearGroups.filter((y) => y.items && y.items.length > 0);
  const showHeadings = visibleGroups.length > 1;

  return (
    <section id="page-holidays" class="page-section">
      <div class="page-header">
        <div class="page-header-eyebrow">Chapter Seven</div>
        <h2 class="page-header-title"><em>Celebrations</em> &amp; Traditions</h2>
        <p class="page-header-sub">
          The holidays, cultural traditions, and family rituals that will mark every year of your
          life.
        </p>
      </div>

      {visibleGroups.map((year) => (
        <div key={year.label}>
          {showHeadings && <h3 class="celebrations-year-heading">{year.label}</h3>}
          <div class="holidays-list">
            {year.items.map((c, i) => (
              <div class={`holiday-card${i % 2 === 1 ? ' reverse' : ''}`} key={i}>
                <div class="holiday-photo">
                  {c.photo_path && (
                    <img
                      src={imageUrl(c.photo_path) || ''}
                      alt={c.title || ''}
                      loading="lazy"
                      style={photoPos(c.photo_path)}
                    />
                  )}
                </div>
                <div class="holiday-body">
                  <div class="holiday-eyebrow">{c.eyebrow || ''}</div>
                  <h3 class="holiday-title">{c.title}</h3>
                  <p class="holiday-text" dangerouslySetInnerHTML={{ __html: nl2br(c.body) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
