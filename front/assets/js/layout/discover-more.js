// =====================================================
// LAYOUT/DISCOVER-MORE.JS
// Homepage "Discover More NFTs" section. Previously three hardcoded
// cards for NFTs that don't exist in the database — one of them
// credited to "Spaceone", who isn't even one of the demo creators.
//
// Reuses buildNftCard() from components/nft-card.js, the same builder
// the Marketplace grid and the NFT detail page's "more from this
// artist" row use, so these cards link somewhere real and can't drift
// from how cards look everywhere else. index.html loads that script
// immediately before this one.
// =====================================================

const DISCOVER_MORE_API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with marketplace.js / rankings.js

// Three fills the grid at desktop; the section is a teaser for the
// Marketplace, not a second listing page.
const DISCOVER_MORE_LIMIT = 3;

document.addEventListener('DOMContentLoaded', loadDiscoverMore);

async function loadDiscoverMore() {
  const grid = document.getElementById('discoverMoreGrid');
  const status = document.getElementById('discoverMoreStatus');
  if (!grid || !status) return; // section isn't on this page

  try {
    // No sort param: the API already returns newest-first by default,
    // which is what "Explore new trending NFTs" claims to show.
    const params = new URLSearchParams({ page: 1, limit: DISCOVER_MORE_LIMIT });
    const response = await fetch(`${DISCOVER_MORE_API_BASE}/nfts?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.nfts.length === 0) {
      status.textContent = 'No NFTs listed yet.';
      return;
    }

    data.nfts.forEach((nft) => grid.appendChild(buildNftCard(nft)));
    status.hidden = true;
  } catch (err) {
    // Most likely cause during local dev: the backend isn't running.
    console.error('Could not load NFTs:', err);
    status.textContent = "Couldn't load NFTs — is the backend running?";
    status.classList.add('discover-more__status--error');
  }
}
