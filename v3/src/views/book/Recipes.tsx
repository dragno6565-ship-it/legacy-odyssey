/**
 * "Family Recipes & Traditions" — chapter nine. Direct port of recipes.ejs.
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type Recipe = Record<string, any>;

type Props = {
  recipes: Recipe[];
  imageUrl: (path: string | null | undefined) => string | null;
  photoPos: (path: string | null | undefined) => string;
};

export const Recipes: FC<Props> = ({ recipes, imageUrl, photoPos }) => (
  <section id="page-recipes" class="page-section">
    <div class="page-header">
      <div class="page-header-eyebrow">Chapter Nine</div>
      <h2 class="page-header-title">Family <em>Recipes</em> &amp; Traditions</h2>
      <p class="page-header-sub">
        The flavors of home. The dishes that mark every celebration, every Sunday, every season.
      </p>
    </div>
    <div class="recipes-intro">
      <p class="recipes-intro-text">
        Food is memory. These are the recipes that will always mean home — the ones that fill a
        kitchen with a particular smell and a particular feeling, the ones that get passed down on
        index cards with smudges and handwritten notes in the margins.
      </p>
    </div>
    <div class="recipe-cards">
      {(recipes || []).map((r, i) => (
        <div class="recipe-card" key={i}>
          <div class="recipe-photo">
            {r.photo_path && (
              <img
                src={imageUrl(r.photo_path) || ''}
                alt={r.title || ''}
                loading="lazy"
                style={photoPos(r.photo_path)}
              />
            )}
          </div>
          <div class="recipe-body">
            <div class="recipe-from">✦ {r.origin_label}</div>
            <div class="recipe-title">{r.title}</div>
            <p class="recipe-desc" dangerouslySetInnerHTML={{ __html: nl2br(r.description) }} />
            {r.ingredients && r.ingredients.length > 0 && (
              <div class="recipe-ingredients">
                <div class="recipe-ing-title">Key Ingredients</div>
                <ul class="recipe-ing-list">
                  {r.ingredients.map((ing: string, j: number) => (
                    <li key={j}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
);
