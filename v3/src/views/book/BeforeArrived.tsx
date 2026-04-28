/**
 * "Before You Arrived" — chapter one. Direct port of before.ejs.
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type Card = Record<string, any>;
type ChecklistItem = Record<string, any>;

type Props = {
  beforeCards: Card[];
  checklist: ChecklistItem[];
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const BeforeArrived: FC<Props> = ({ beforeCards, checklist, imageUrl, photoPos }) => (
  <section id="page-before" class="page-section">
    <div class="page-header">
      <div class="page-header-eyebrow">Chapter One</div>
      <h2 class="page-header-title"><em>Before</em> You Arrived</h2>
      <p class="page-header-sub">
        The months of anticipation, preparation, and love that came before your first breath.
      </p>
    </div>
    <div class="page-body">
      <div class="before-grid">
        {(beforeCards || []).map((card, i) => (
          <div class="before-card" key={i}>
            <div class="before-card-photo">
              {card.photo_path && (
                <img
                  src={imageUrl(card.photo_path) || ''}
                  alt={card.title || ''}
                  loading="lazy"
                  style={photoPos(card.photo_path)}
                />
              )}
              {card.subtitle && <span class="photo-label">{card.subtitle}</span>}
            </div>
            <div class="before-card-body">
              <div class="before-card-title">{card.title}</div>
              <p class="before-card-text" dangerouslySetInnerHTML={{ __html: nl2br(card.body) }} />
            </div>
          </div>
        ))}
      </div>

      {checklist && checklist.length > 0 && (
        <div class="checklist">
          <div class="checklist-title">Getting Ready For You ✓</div>
          <div class="checklist-grid">
            {checklist.map((item, i) => (
              <div class="check-item" key={i}>
                <div class="check-icon">{item.is_checked ? '✓' : ''}</div>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </section>
);
