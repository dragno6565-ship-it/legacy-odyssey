/**
 * Domain Search — Landing Page
 * Handles domain availability search, result display, selection, and checkout wiring.
 */
(function () {
  'use strict';

  // DOM elements
  const searchInput = document.getElementById('domainSearchInput');
  const searchBtn = document.getElementById('domainSearchBtn');
  const loadingEl = document.getElementById('domainSearchLoading');
  const resultsEl = document.getElementById('domainResults');
  const alternativesEl = document.getElementById('domainAlternatives');
  const alternativesListEl = document.getElementById('domainAlternativesList');
  const selectedEl = document.getElementById('domainSelected');
  const selectedNameEl = document.getElementById('selectedDomainName');
  const changeBtn = document.getElementById('domainChangeBtn');
  const examplesEl = document.getElementById('domainExamples');

  if (!searchInput || !searchBtn) return;

  // State
  let selectedDomain = null;

  // --- Search ---

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doSearch();
  });

  // Example chips
  document.querySelectorAll('.domain-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      searchInput.value = chip.getAttribute('data-name');
      doSearch();
    });
  });

  // Change button
  if (changeBtn) {
    changeBtn.addEventListener('click', function () {
      selectedDomain = null;
      selectedEl.style.display = 'none';
      resultsEl.style.display = 'none';
      alternativesEl.style.display = 'none';
      examplesEl.style.display = '';
      searchInput.value = '';
      searchInput.focus();
    });
  }

  async function doSearch() {
    var name = searchInput.value.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (!name || name.length < 2) {
      searchInput.focus();
      return;
    }

    // Show loading
    loadingEl.style.display = 'flex';
    resultsEl.style.display = 'none';
    alternativesEl.style.display = 'none';
    selectedEl.style.display = 'none';
    examplesEl.style.display = 'none';

    try {
      var res = await fetch('/api/domains/search?name=' + encodeURIComponent(name));
      var data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Search failed. Please try again.');
        return;
      }

      renderResults(data.results || []);

      if (data.alternatives && data.alternatives.length > 0) {
        renderAlternatives(data.alternatives);
      } else {
        alternativesEl.style.display = 'none';
      }
    } catch (err) {
      showError('Connection error. Please try again.');
    } finally {
      loadingEl.style.display = 'none';
    }
  }

  // --- Render Results ---

  function renderResults(results) {
    resultsEl.innerHTML = '';

    results.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'domain-result-card';

      var available = r.available && r.underBudget;

      card.innerHTML =
        '<div class="domain-result-name">www.' + escapeHtml(r.domain) + '</div>' +
        '<div class="domain-result-status ' + (available ? 'available' : 'taken') + '">' +
          (available ? 'Available' : 'Taken') +
        '</div>' +
        (available
          ? '<button type="button" class="domain-select-btn">Select</button>'
          : '');

      if (available) {
        card.querySelector('.domain-select-btn').addEventListener('click', function () {
          selectDomain(r.domain);
        });
      }

      resultsEl.appendChild(card);
    });

    resultsEl.style.display = '';
  }

  function renderAlternatives(alts) {
    alternativesListEl.innerHTML = '';

    alts.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'domain-result-card';
      card.innerHTML =
        '<div class="domain-result-name">www.' + escapeHtml(r.domain) + '</div>' +
        '<div class="domain-result-status available">Available</div>' +
        '<button type="button" class="domain-select-btn">Select</button>';

      card.querySelector('.domain-select-btn').addEventListener('click', function () {
        selectDomain(r.domain);
      });

      alternativesListEl.appendChild(card);
    });

    alternativesEl.style.display = '';
  }

  function showError(msg) {
    resultsEl.innerHTML = '<div class="domain-search-error">' + escapeHtml(msg) + '</div>';
    resultsEl.style.display = '';
  }

  // --- Selection ---

  function selectDomain(domain) {
    selectedDomain = domain;
    selectedNameEl.textContent = 'www.' + domain;
    selectedEl.style.display = 'flex';
    resultsEl.style.display = 'none';
    alternativesEl.style.display = 'none';

    // Open the checkout modal with this domain pre-filled
    if (typeof openFounderModal === 'function') {
      setTimeout(function() {
        openFounderModal('annual', domain);
      }, 300);
    }
  }

  // --- Helpers ---

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
