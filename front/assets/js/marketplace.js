// =====================================================
// MARKETPLACE.JS
// Fetches real NFT listings from the backend and renders them into
// the grid — search, category filter, and "Load more" pagination all
// hit GET /api/nfts with different query params against the same
// piece of state, rather than being three separate code paths.
// =====================================================

// Single source of truth for "what should the grid currently show."
// Every control (search, category chips, load more) mutates this and
// then calls loadNfts() — nothing reads from the DOM to decide what
// to fetch next, which is what keeps three separate controls from
// drifting out of sync with each other.
const state = {
  search: '',
  category: '',
  page: 1,
  totalPages: 1,
};

const LIMIT = 12;

document.addEventListener('DOMContentLoaded', () => {
  applyCategoryFromHash(); // before the first load, so it fetches the right page
  loadNfts({ reset: true });
  setupSearch();
  setupCategoryFilters();
  setupLoadMore();
});

async function loadNfts({ reset }) {
  const grid = document.getElementById('marketplaceGrid');
  const status = document.getElementById('marketplaceStatus');
  const countEl = document.getElementById('marketplaceNftCount');
  const loadMoreBtn = document.getElementById('marketplaceLoadMore');

  if (reset) {
    grid.innerHTML = '';
    status.hidden = false;
    status.classList.remove('marketplace-grid__status--error');
    status.textContent = 'Loading NFTs…';
    loadMoreBtn.hidden = true;
  } else {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
  }

  try {
    const params = new URLSearchParams({ page: state.page, limit: LIMIT });
    if (state.search) params.set('search', state.search);
    if (state.category) params.set('category', state.category);

    const response = await apiFetch(`/nfts?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    state.totalPages = data.pagination.totalPages;

    if (countEl) countEl.textContent = data.pagination.total;

    if (reset && data.nfts.length === 0) {
      status.hidden = false;
      status.textContent = state.search || state.category
        ? 'No NFTs match your search/filter.'
        : 'No NFTs listed yet.';
      return;
    }

    status.hidden = true;
    data.nfts.forEach((nft) => grid.appendChild(buildNftCard(nft)));

    loadMoreBtn.hidden = state.page >= state.totalPages;
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'Load more';
  } catch (err) {
    // Most likely cause during local dev: the backend isn't running.
    console.error('Could not load NFTs:', err);
    status.hidden = false;
    status.textContent = "Couldn't load NFTs right now — please try again in a moment.";
    status.classList.add('marketplace-grid__status--error');
    loadMoreBtn.hidden = true;
  }
}

// buildNftCard() now lives in components/nft-card.js, shared with
// nft-detail.js's "More from this artist" grid — load order in
// marketplace.html puts that script before this one.

// Links from the homepage (Browse Categories tiles, Top Categories cards)
// arrive as marketplace.html#category=Art. A #fragment rather than
// ?category= for the same reason as NFT links: the static server's
// clean-URL redirect drops query strings (see components/nft-card.js).
function applyCategoryFromHash() {
  const category = new URLSearchParams(window.location.hash.slice(1)).get('category');
  if (!category) return;

  const chips = document.querySelectorAll('.marketplace-filters__chip');
  const match = [...chips].find((chip) => chip.dataset.category === category);
  if (!match) return; // unknown category in the link — just show everything

  chips.forEach((chip) => chip.classList.remove('is-active'));
  match.classList.add('is-active');
  state.category = category;
}

// Search — fires on submit (Enter / clicking the icon) immediately, and
// on typing after a short pause, so results update without forcing a
// submit but without re-fetching on every single keystroke either.
function setupSearch() {
  const form = document.getElementById('marketplaceSearchForm');
  const input = document.getElementById('marketplaceSearchInput');
  if (!form || !input) return;

  let debounceTimer;

  function runSearch() {
    state.search = input.value.trim();
    state.page = 1;
    loadNfts({ reset: true });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault(); // no backend page to submit a plain GET to — handle it ourselves
    clearTimeout(debounceTimer);
    runSearch();
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 350);
  });
}

// Category filter chips — clicking one sets state.category and reloads
// page 1; "All" clears it back to no filter.
function setupCategoryFilters() {
  const filters = document.getElementById('marketplaceFilters');
  if (!filters) return;

  filters.addEventListener('click', (e) => {
    const chip = e.target.closest('.marketplace-filters__chip');
    if (!chip) return;

    filters.querySelectorAll('.marketplace-filters__chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');

    state.category = chip.dataset.category;
    state.page = 1;
    loadNfts({ reset: true });
  });
}

// "Load more" — appends the next page instead of replacing the grid.
function setupLoadMore() {
  const btn = document.getElementById('marketplaceLoadMore');
  if (!btn) return;

  btn.addEventListener('click', () => {
    state.page += 1;
    loadNfts({ reset: false });
  });
}
