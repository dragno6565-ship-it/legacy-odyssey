/**
 * "Month by Month" — chapter four. Direct port of months.ejs.
 *
 * The grid itself is built client-side by /js/book.js (loaded cross-origin
 * from legacyodyssey.com); this just renders the section shell + modal slots
 * the existing JS expects.
 */
import type { FC } from 'hono/jsx';

export const Months: FC = () => (
  <>
    <section id="page-months" class="page-section">
      <div class="page-header">
        <div class="page-header-eyebrow">Chapter Four · The First Year</div>
        <h2 class="page-header-title">Month <em>by</em> Month</h2>
        <p class="page-header-sub">
          Twelve months. Every milestone, every measurement, every moment that made up the most
          important year of your life so far. Click any month to open the full entry.
        </p>
      </div>
      <div
        style="background:var(--ink); border-bottom:1px solid rgba(184,147,90,0.2); padding:1rem 4rem; display:flex; gap:2rem; align-items:center;"
      >
        <span style="font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--gold);">
          Year One
        </span>
        <div style="flex:1; height:3px; background:rgba(184,147,90,0.15); border-radius:2px; position:relative;">
          <div style="position:absolute; left:0; top:0; height:100%; width:100%; background:linear-gradient(to right, var(--gold), rgba(184,147,90,0.3)); border-radius:2px;"></div>
        </div>
        <span style="font-size:0.65rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-light);">
          Birth → First Birthday
        </span>
      </div>
      <div class="months-grid" id="monthsGrid"></div>
    </section>

    <div class="month-modal" id="monthModal">
      <button class="month-modal-close" onclick="closeModal()">✕</button>
      <div class="month-modal-inner">
        <div class="month-modal-photo">
          <img id="modalPhoto" src="" alt="" />
        </div>
        <div class="month-modal-body">
          <div class="month-label" id="modalEyebrow"></div>
          <div class="month-modal-title" id="modalTitle"></div>
          <div class="month-modal-stats" id="modalStats"></div>
          <p class="month-modal-text" id="modalText"></p>
        </div>
      </div>
    </div>
  </>
);
