/**
 * "The Legacy Vault" — sealed-until-18 closing chapter. Port of vault.ejs.
 * Countdown filled in client-side by /js/book.js (uses window.birthDate).
 */
import type { FC } from 'hono/jsx';

type Props = {
  book: Record<string, any>;
  imageUrl: (path: string | null | undefined) => string | null;
};

export const Vault: FC<Props> = ({ book, imageUrl }) => {
  const heroSrc = book.hero_image_path ? imageUrl(book.hero_image_path) : '';
  return (
    <section id="page-vault" class="page-section">
      <div class="vault-page">
        <div class="vault-bg" style={`background-image: url('${heroSrc || ''}');`}></div>
        <div class="vault-content">
          <div class="vault-icon">🔒</div>
          <div class="vault-eyebrow">✦ The Legacy Vault</div>
          <h2 class="vault-title">
            Sealed Until Your<br />
            <em>18th Birthday</em>
          </h2>
          <p class="vault-text">
            Behind this lock are letters, memories, photos, and words written specifically for the
            adult you will become — not the child you are now. They were placed here with love and
            intention, and they will wait as long as they need to.
            <br />
            <br />
            On your 18th birthday, this vault will open. Everything inside was written for you —
            and only for you.
          </p>
          <div class="vault-countdown">
            <div class="vault-countdown-label">Unlocks In</div>
            <div class="countdown-digits" id="countdownDigits">
              <div class="countdown-unit">
                <span class="countdown-num" id="cdYears">--</span>
                <div class="countdown-unit-label">Years</div>
              </div>
              <div class="countdown-unit">
                <span class="countdown-num" id="cdMonths">--</span>
                <div class="countdown-unit-label">Months</div>
              </div>
              <div class="countdown-unit">
                <span class="countdown-num" id="cdDays">--</span>
                <div class="countdown-unit-label">Days</div>
              </div>
            </div>
          </div>
          <div class="vault-seal">
            <span>🔒</span>
            <span>Sealed by Legacy Odyssey · Protected Forever</span>
          </div>
        </div>
      </div>
    </section>
  );
};
