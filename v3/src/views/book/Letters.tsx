/**
 * "Letters To You" — chapter eight. Direct port of letters.ejs.
 */
import type { FC } from 'hono/jsx';
import { nl2br } from './nl2br';

type Letter = Record<string, any>;

type Props = { letters: Letter[] };

export const Letters: FC<Props> = ({ letters }) => (
  <section id="page-letters" class="page-section">
    <div class="page-header">
      <div class="page-header-eyebrow">Chapter Eight</div>
      <h2 class="page-header-title">Letters <em>To You</em></h2>
      <p class="page-header-sub">
        Words written across time, sealed with love, waiting for the day you're ready to read them.
      </p>
    </div>
    <div class="letters-container">
      {(letters || []).map((l, i) => (
        <div class="letter-card" key={i}>
          <div class="letter-from">✦ {l.from_label}</div>
          <div class="letter-salutation">{l.salutation}</div>
          <p class="letter-body" dangerouslySetInnerHTML={{ __html: nl2br(l.body) }} />
          <div class="letter-signature" dangerouslySetInnerHTML={{ __html: nl2br(l.signature) }} />
        </div>
      ))}
    </div>
  </section>
);
