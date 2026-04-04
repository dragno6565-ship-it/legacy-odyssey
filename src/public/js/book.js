// Legacy Odyssey Book Client-Side JavaScript
// Navigation, modals, month grid, family detail, vault countdown, image lightbox
// Data (months, familyMembers, birthDate) is injected by server via <script> tags in book.ejs

document.addEventListener('DOMContentLoaded', () => {
  // ===== NAVIGATION =====
  const navItems = document.querySelectorAll('.nav-item');

  window.showPage = function(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    navItems.forEach(n => n.classList.remove('active'));
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('active');
    }

    if (window.innerWidth <= 900) closeMobileNav();

    document.getElementById('main-content').scrollTo(0, 0);
    window.scrollTo(0, 0);
  };

  window.toggleNav = function() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('navOverlay').classList.toggle('open');
  };

  function closeMobileNav() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('navOverlay').classList.remove('open');
  }

  // ===== MONTH GRID =====
  // `months` is injected as a global variable by the server in book.ejs
  if (typeof months !== 'undefined' && months.length) {
    const grid = document.getElementById('monthsGrid');
    if (grid) {
      months.forEach(m => {
        const card = document.createElement('div');
        card.className = 'month-card';
        card.innerHTML = `
          <div class="month-photo">
            <img src="${m.photo || ''}" alt="Month ${m.num}" loading="lazy">
            <div class="month-number-badge">${m.num}</div>
          </div>
          <div class="month-card-body">
            <div class="month-label">${m.label}</div>
            <div class="month-highlight">${m.highlight}</div>
            <div class="month-stats">
              <span class="month-stat-sm">⚖️ ${m.weight}</span>
              <span class="month-stat-sm">📏 ${m.length}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => openModal(m));
        grid.appendChild(card);
      });
    }
  }

  // ===== MONTH DETAIL MODAL =====
  window.openModal = function(m) {
    document.getElementById('modalPhoto').src = m.photo || '';
    document.getElementById('modalPhoto').alt = m.label;
    document.getElementById('modalEyebrow').textContent = '\u2726 Month ' + m.num;
    document.getElementById('modalTitle').textContent = m.label;
    document.getElementById('modalStats').innerHTML = `
      <div><div class="month-modal-stat-label">Weight</div><div class="month-modal-stat-value">${m.weight}</div></div>
      <div><div class="month-modal-stat-label">Length</div><div class="month-modal-stat-value">${m.length}</div></div>
    `;
    document.getElementById('modalText').textContent = m.note;
    document.getElementById('monthModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function() {
    document.getElementById('monthModal').classList.remove('open');
    document.body.style.overflow = '';
  };

  const monthModal = document.getElementById('monthModal');
  if (monthModal) {
    monthModal.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }

  // ===== FAMILY MEMBER DETAIL =====
  // `familyMembers` is injected as a global variable by the server in book.ejs
  window.openFamilyDetail = function(memberId) {
    if (typeof familyMembers === 'undefined') return;
    const m = familyMembers[memberId];
    if (!m) return;

    // Portrait photo (shown below meta, above story)
    const portraitWrap = document.getElementById('fdetail-portrait-wrap');
    if (m.photo) {
      const escapedSrc = m.photo.replace(/"/g, '&quot;');
      const escapedAlt = (m.name || '').replace(/"/g, '&quot;');
      portraitWrap.innerHTML = '<img src="' + escapedSrc + '" alt="' + escapedAlt + '" onclick="openLightbox(\'' + escapedSrc + '\',\'' + escapedAlt + '\')" title="Click to expand">';
      portraitWrap.style.display = '';
    } else {
      portraitWrap.innerHTML = '';
      portraitWrap.style.display = 'none';
    }

    document.getElementById('fdetail-relation').textContent = '\u2726 ' + m.relation;

    const nameEl = document.getElementById('fdetail-name');
    if (m.name && m.name.includes("'s Name")) {
      nameEl.innerHTML = m.name.replace("'s Name", "'s <em>Story</em>");
    } else {
      nameEl.innerHTML = '<em>' + (m.name || '') + '</em>';
    }

    // Meta
    const metaItems = m.meta || [];
    document.getElementById('fdetail-meta').innerHTML = metaItems.map(item =>
      '<div class="fdetail-meta-item">' +
        '<div class="fdetail-meta-label">' + item.label + '</div>' +
        '<div class="fdetail-meta-value">' + item.value + '</div>' +
      '</div>'
    ).join('');

    // Stories
    const storyEl = document.getElementById('fdetail-story');
    if (m.story) {
      storyEl.innerHTML = m.story.split('\n\n').map(p => '<p style="margin-bottom:1.25rem;">' + p + '</p>').join('');
    } else {
      storyEl.innerHTML = '';
    }

    const story2El = document.getElementById('fdetail-story2');
    if (m.story2) {
      story2El.innerHTML = m.story2.split('\n\n').map(p => '<p style="margin-bottom:1.25rem;">' + p + '</p>').join('');
    } else {
      story2El.innerHTML = '';
    }

    // Quote
    const quoteEl = document.getElementById('fdetail-quote');
    if (m.quote && m.quote.text) {
      quoteEl.innerHTML = '<p>\u201C' + m.quote.text + '\u201D</p><cite>\u2014 ' + m.quote.cite + '</cite>';
      quoteEl.style.display = '';
    } else {
      quoteEl.style.display = 'none';
    }

    // Photos
    const photos = m.photos || [];
    document.getElementById('fdetail-photos').innerHTML = photos.map(p =>
      '<div class="fdetail-photo-item">' +
        (p.img
          ? '<img src="' + p.img + '" alt="' + (p.caption || '') + '" loading="lazy">'
          : '<div class="fdetail-photo-placeholder">' + (p.emoji || '\uD83D\uDCF7') + '</div>'
        ) +
      '</div>'
    ).join('');

    // Show panel
    const panel = document.getElementById('family-detail');
    panel.classList.add('open');
    panel.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
  };

  window.closeFamilyDetail = function() {
    document.getElementById('family-detail').classList.remove('open');
    document.body.style.overflow = '';
  };

  // ===== PHOTO LIGHTBOX =====
  window.openLightbox = function(src, alt) {
    const lb = document.getElementById('photo-lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    img.alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function() {
    document.getElementById('photo-lightbox').classList.remove('open');
    // restore scroll only if family detail is also closed
    if (!document.getElementById('family-detail').classList.contains('open')) {
      document.body.style.overflow = '';
    }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (document.getElementById('photo-lightbox').classList.contains('open')) {
        closeLightbox();
      }
    }
  });

  // ===== VAULT COUNTDOWN =====
  // `window.birthDate` is injected by the server in book.ejs
  function startCountdown() {
    const birthDateStr = window.birthDate;
    if (!birthDateStr) return;

    const birthDate = new Date(birthDateStr);
    const unlockDate = new Date(birthDate);
    unlockDate.setFullYear(unlockDate.getFullYear() + 18);

    function update() {
      const now = new Date();
      const diff = unlockDate - now;
      if (diff <= 0) {
        document.getElementById('cdYears').textContent = '0';
        document.getElementById('cdMonths').textContent = '0';
        document.getElementById('cdDays').textContent = '0';
        return;
      }
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const years = Math.floor(totalDays / 365);
      const remainingMonths = Math.floor((totalDays % 365) / 30);
      const days = totalDays % 30;
      document.getElementById('cdYears').textContent = years;
      document.getElementById('cdMonths').textContent = remainingMonths;
      document.getElementById('cdDays').textContent = days;
    }

    update();
    setInterval(update, 60000);
  }

  startCountdown();

  // ===== IMAGE LIGHTBOX =====
  window.openLightbox = function(src, alt) {
    const lightbox = document.getElementById('bookLightbox');
    const img = document.getElementById('lightboxImg');
    if (!lightbox || !img) return;
    img.src = src;
    img.alt = alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function() {
    const lightbox = document.getElementById('bookLightbox');
    if (lightbox) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  // Close lightbox on background click
  const lightboxEl = document.getElementById('bookLightbox');
  if (lightboxEl) {
    lightboxEl.addEventListener('click', function(e) {
      if (e.target === this) closeLightbox();
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // Event delegation: click any book image to open lightbox
  // (Excludes month-photo and family-photo which have their own card click handlers)
  document.addEventListener('click', function(e) {
    const img = e.target;
    if (img.tagName !== 'IMG') return;

    const isBookImage = img.closest(
      '.before-card-photo, .perspective-photo, .month-modal-photo, ' +
      '.holiday-photo, .recipe-photo, .fdetail-photo-item'
    );

    if (isBookImage && img.src && img.src !== window.location.href) {
      e.stopPropagation();
      openLightbox(img.src, img.alt);
    }
  });

  // Show welcome page by default
  const welcomePage = document.getElementById('page-welcome');
  if (welcomePage) welcomePage.classList.add('active');
});
