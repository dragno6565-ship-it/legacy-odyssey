/**
 * "Coming Home" — chapter three. Direct port of home.ejs.
 * Reuses .before-grid / .before-card classes (same shape as BeforeArrived).
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type Card = Record<string, any>;

type Props = {
  comingHomeCards: Card[];
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const ComingHome: FC<Props> = ({ comingHomeCards, imageUrl, photoPos }) => (
  <section id="page-home" class="page-section">
    <div class="page-header">
      <div class="page-header-eyebrow">Chapter Three</div>
      <h2 class="page-header-title"><em>Coming</em> Home</h2>
      <p class="page-header-sub">
        The first time you crossed the threshold and made our house a home in a whole new way.
      </p>
    </div>
    <div class="page-body">
      <div class="before-grid">
        {(comingHomeCards || []).map((card, i) => (
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
    </div>
  </section>
);
