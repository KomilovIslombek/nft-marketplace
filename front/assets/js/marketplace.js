// =====================================================
// MARKETPLACE.JS
// Fetches real NFT listings from the backend and renders them into
// the grid, replacing what used to be 12 hardcoded .nft-card blocks
// in marketplace.html. Also handles the NFTs / Collections tab toggle.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with auth-form.js / auth-state.js

document.addEventListener('DOMContentLoaded', () => {
  loadNfts();
  setupTabs();
});

async function loadNfts() {
  const grid = document.getElementById('marketplaceGrid');
  const status = document.getElementById('marketplaceStatus');
  const countEl = document.getElementById('marketplaceNftCount');

  try {
    const response = await fetch(`${API_BASE}/nfts?limit=12`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (countEl) countEl.textContent = data.pagination.total;

    if (data.nfts.length === 0) {
      status.textContent = 'No NFTs listed yet.';
      return;
    }

    status.remove();
    data.nfts.forEach((nft) => grid.appendChild(buildNftCard(nft)));
  } catch (err) {
    // Most likely cause during local dev: the backend isn't running.
    console.error('Could not load NFTs:', err);
    status.textContent = "Couldn't load NFTs — is the backend running?";
    status.classList.add('marketplace-grid__status--error');
  }
}

// Builds one .nft-card as a real DOM node rather than an interpolated
// HTML string. NFT titles/creator usernames are user-submitted content
// (via POST /api/nfts) — assigning them through .textContent instead of
// innerHTML means they're always rendered as plain text, never parsed
// as markup, so a listing titled "<img onerror=...>" can't run anything.
function buildNftCard(nft) {
  const card = document.createElement('a');
  card.className = 'nft-card';
  card.href = '#'; // no NFT detail page yet — see roadmap

  card.innerHTML = `
    <img class="nft-card__image" alt="">
    <div class="nft-card__body">
      <h4 class="nft-card__title"></h4>
      <div class="nft-card__avatar-row">
        <img class="nft-card__avatar-img" alt="">
        <h6 class="nft-card__avatar-name"></h6>
      </div>
      <div class="nft-card__details">
        <div>
          <h6 class="nft-card__price-title">Price</h6>
          <h5 class="nft-card__price"></h5>
        </div>
        <div>
          <h6 class="nft-card__bid-title">Highest Bid</h6>
          <h5 class="nft-card__bid"></h5>
        </div>
      </div>
    </div>
  `;

  const creatorName = nft.creator?.username || 'Unknown artist';
  const avatarUrl = nft.creator?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(creatorName)}`;

  const image = card.querySelector('.nft-card__image');
  image.src = nft.imageUrl;
  image.alt = nft.title;

  card.querySelector('.nft-card__title').textContent = nft.title;

  const avatarImg = card.querySelector('.nft-card__avatar-img');
  avatarImg.src = avatarUrl;
  avatarImg.alt = '';

  card.querySelector('.nft-card__avatar-name').textContent = creatorName;
  card.querySelector('.nft-card__price').textContent = `${nft.price} ETH`;
  card.querySelector('.nft-card__bid').textContent = `${nft.highestBid} wETH`;

  return card;
}

// NFTs / Collections tab toggle. "Collections" has no backend data yet
// (see README roadmap) — this just switches the active tab visually
// until a real collections endpoint/grid exists.
function setupTabs() {
  document.querySelectorAll('.marketplace-tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.marketplace-tabs__tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
    });
  });
}
