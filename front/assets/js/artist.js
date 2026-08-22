// =====================================================
// ARTIST.JS
// Reads #id= from the URL (a fragment, not a query string — see
// components/nft-card.js for why), fetches the public profile plus
// their Created and Owned NFTs, and renders the page. Both NFT lists
// are fetched once up front (capped at 50 — plenty for this project's
// scale) so switching tabs is instant, no re-fetch.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with marketplace.js / nft-detail.js

document.addEventListener('DOMContentLoaded', loadArtist);

async function loadArtist() {
  const status = document.getElementById('artistStatus');
  const content = document.getElementById('artistContent');

  const artistId = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('id');
  if (!artistId) {
    showError(status, 'No artist specified. Go back to an NFT and click its creator.');
    return;
  }

  try {
    const [userRes, createdRes, ownedRes] = await Promise.all([
      fetch(`${API_BASE}/users/${encodeURIComponent(artistId)}`),
      fetch(`${API_BASE}/nfts?creator=${encodeURIComponent(artistId)}&limit=50`),
      fetch(`${API_BASE}/nfts?owner=${encodeURIComponent(artistId)}&limit=50`),
    ]);

    if (!userRes.ok) {
      showError(status, "This artist couldn't be found. They may not exist.");
      return;
    }

    const { user } = await userRes.json();
    const created = createdRes.ok ? await createdRes.json() : { nfts: [], pagination: { total: 0 } };
    const owned = ownedRes.ok ? await ownedRes.json() : { nfts: [], pagination: { total: 0 } };

    renderProfile(user, created, owned);
    setupTabs({ created: created.nfts, owned: owned.nfts });
    renderGrid(created.nfts, 'created');

    status.hidden = true;
    content.hidden = false;
  } catch (err) {
    console.error('Could not load artist:', err);
    showError(status, "Couldn't load this artist — is the backend running?");
  }
}

function showError(status, message) {
  status.hidden = false;
  status.textContent = message;
  status.classList.add('artist-header__status--error');
}

function renderProfile(user, created, owned) {
  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`;
  document.getElementById('artistAvatar').src = avatarUrl;
  document.getElementById('artistName').textContent = user.username;

  document.getElementById('artistCreatedCount').textContent = created.pagination.total;
  document.getElementById('artistOwnedCount').textContent = owned.pagination.total;
  document.getElementById('artistCreatedTabCount').textContent = created.pagination.total;
  document.getElementById('artistOwnedTabCount').textContent = owned.pagination.total;

  // Sum of the fetched batch's prices — accurate as long as an artist has
  // 50 or fewer listings, which comfortably covers this project's scale.
  const totalValue = created.nfts.reduce((sum, nft) => sum + nft.price, 0);
  document.getElementById('artistTotalValue').textContent = totalValue.toFixed(2);

  const bioSection = document.getElementById('artistBioSection');
  if (user.bio) {
    document.getElementById('artistBio').textContent = user.bio;
    bioSection.hidden = false;
  } else {
    bioSection.hidden = true;
  }
}

function setupTabs(tabs) {
  document.querySelectorAll('.marketplace-tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.marketplace-tabs__tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      renderGrid(tabs[tab.dataset.tab], tab.dataset.tab);
    });
  });
}

function renderGrid(nfts, tabName) {
  const grid = document.getElementById('artistGrid');
  const status = document.getElementById('artistGridStatus');

  grid.innerHTML = '';

  if (nfts.length === 0) {
    status.hidden = false;
    status.textContent = tabName === 'created'
      ? "This artist hasn't created any NFTs yet."
      : "This artist doesn't own any NFTs yet.";
    return;
  }

  status.hidden = true;
  nfts.forEach((nft) => grid.appendChild(buildNftCard(nft)));
}
