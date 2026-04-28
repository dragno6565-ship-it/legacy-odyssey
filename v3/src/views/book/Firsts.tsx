/**
 * "Your Firsts" — chapter six. Direct port of firsts.ejs.
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type First = Record<string, any>;

type Props = { firsts: First[] };

export const Firsts: FC<Props> = ({ firsts }) => (
  <section id="page-firsts" class="page-section">
    <div class="page-header">
      <div class="page-header-eyebrow">Chapter Six</div>
      <h2 class="page-header-title">Your <em>Firsts</em></h2>
      <p class="page-header-sub">
        Every milestone is a door opening. Here are the ones we never want to forget.
      </p>
    </div>
    <div class="firsts-grid">
      {(firsts || []).map((f, i) => (
        <div class="first-card" key={i}>
          <div class="first-emoji">{f.emoji}</div>
          <div class="first-title">{f.title}</div>
          <div class="first-date">{f.date_text || ''}</div>
          <p class="first-note" dangerouslySetInnerHTML={{ __html: nl2br(f.note) }} />
        </div>
      ))}
    </div>
  </section>
);
