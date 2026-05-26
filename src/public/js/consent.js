/* ============================================================================
 * Legacy Odyssey — cookie consent (G1)
 * EU/UK visitors (window.LO_CONSENT_REQUIRED === true) see a banner and must
 * opt in before non-essential trackers load. Everyone else loads them normally.
 * The page's <head> defines window.loEnableTracking() (grants Consent Mode +
 * loads Meta Pixel / Pinterest / Hotjar) and window.LO_CONSENT_REQUIRED.
 * ==========================================================================*/
(function () {
  var KEY = 'lo_consent';

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function enable() { if (typeof window.loEnableTracking === 'function') window.loEnableTracking(); }

  // Inject the banner styles once (self-contained so it works on any page,
  // regardless of which stylesheet that page loads).
  function injectStyles() {
    if (document.getElementById('lo-consent-styles')) return;
    var css =
      '.lo-consent{position:fixed;left:0;right:0;bottom:0;z-index:1200;background:#1a1510;border-top:1px solid rgba(200,169,110,.4);padding:16px 24px;box-shadow:0 -6px 24px rgba(0,0,0,.35);font-family:"Jost",system-ui,sans-serif}' +
      '.lo-consent-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:20px;flex-wrap:wrap}' +
      '.lo-consent-text{flex:1 1 360px;color:rgba(250,247,242,.8);font-size:13px;line-height:1.6}' +
      '.lo-consent-text a{color:#c8a96e;text-decoration:underline}' +
      '.lo-consent-actions{display:flex;gap:10px;flex-shrink:0}' +
      '.lo-consent-btn{padding:10px 22px;border-radius:6px;font-size:13px;font-weight:600;letter-spacing:.5px;cursor:pointer;border:none;font-family:inherit}' +
      '.lo-consent-accept{background:#c8a96e;color:#1a1510}.lo-consent-accept:hover{background:#d4bb8a}' +
      '.lo-consent-decline{background:transparent;color:rgba(250,247,242,.7);border:1px solid rgba(200,169,110,.4)}.lo-consent-decline:hover{color:#c8a96e;border-color:#c8a96e}' +
      '@media(max-width:600px){.lo-consent-actions{width:100%}.lo-consent-btn{flex:1}}';
    var s = document.createElement('style');
    s.id = 'lo-consent-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildBanner() {
    var existing = document.getElementById('loConsent');
    if (existing) return existing;
    injectStyles();
    var wrap = document.createElement('div');
    wrap.id = 'loConsent';
    wrap.className = 'lo-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Cookie consent');
    wrap.innerHTML =
      '<div class="lo-consent-inner">' +
        '<div class="lo-consent-text">We use essential cookies to run the site. With your consent, we also use analytics and advertising cookies to improve it. See our <a href="/privacy">Privacy Policy</a>.</div>' +
        '<div class="lo-consent-actions">' +
          '<button type="button" class="lo-consent-btn lo-consent-decline">Decline</button>' +
          '<button type="button" class="lo-consent-btn lo-consent-accept">Accept</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.querySelector('.lo-consent-accept').addEventListener('click', function () {
      setChoice('granted'); enable(); wrap.remove();
    });
    wrap.querySelector('.lo-consent-decline').addEventListener('click', function () {
      setChoice('denied'); wrap.remove();
    });
    return wrap;
  }

  // Re-open from a "Cookie settings" link anywhere on the site.
  window.loOpenConsent = function (e) { if (e) e.preventDefault(); buildBanner(); };

  // Non-EU/UK visitors: no banner, load trackers right away.
  if (window.LO_CONSENT_REQUIRED !== true) { enable(); return; }

  // EU/UK visitors: honor a stored choice, otherwise show the banner.
  var choice = getChoice();
  if (choice === 'granted') { enable(); return; }
  if (choice === 'denied') { return; }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBanner);
  } else {
    buildBanner();
  }
})();
