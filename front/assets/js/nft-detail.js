// =====================================================
// NFT-DETAIL.JS
// Reads ?id= from the URL, fetches that NFT from GET /api/nfts/:id,
// and fills in the page. Also loads a "more from this artist" grid
// via GET /api/nfts?creator=<id>, reusing buildNftCard() from
// components/nft-card.js.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with marketplace.js / auth-form.js

document.addEventListener('DOMContentLoaded', loadNftDetail);

async function loadNftDetail() {
  const status = document.getElementById('nftDetailStatus');
  const content = document.getElementById('nftDetailContent');

  // Read from the URL fragment (#id=...), not a query string — see the
  // comment in components/nft-card.js for why: it has to survive a
  // possible server-side redirect that would otherwise drop a query string.
  const id = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('id');
  if (!id) {
    showError(status, 'No NFT specified. Go back to the Marketplace and pick one.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/nfts/${encodeURIComponent(id)}`);

    if (!response.ok) {
      // Covers both a genuinely missing NFT and a malformed id — the API
      // already collapses both to 404, and from here they look the same.
      showError(status, "This NFT couldn't be found. It may have been removed.");
      return;
    }

    const { nft } = await response.json();

    renderNft(nft);
    status.hidden = true;
    content.hidden = false;

    loadMoreFromArtist(nft);
  } catch (err) {
    console.error('Could not load NFT:', err);
    showError(status, "Couldn't load this NFT — is the backend running?");
  }
}

function showError(status, message) {
  status.hidden = false;
  status.textContent = message;
  status.classList.add('nft-detail__status--error');
}

function renderNft(nft) {
  const heroImg = document.getElementById('nftHeroImg');
  heroImg.src = nft.imageUrl;
  heroImg.alt = nft.title;

  document.getElementById('nftTitle').textContent = nft.title;

  const mintedDate = new Date(nft.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  document.getElementById('nftMinted').textContent = `Minted on ${mintedDate}`;

  const creatorName = nft.creator?.username || 'Unknown artist';
  const avatarUrl = nft.creator?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(creatorName)}`;
  document.getElementById('nftCreatorAvatar').src = avatarUrl;
  document.getElementById('nftCreatorName').textContent = creatorName;

  const descriptionSection = document.getElementById('nftDescriptionSection');
  if (nft.description) {
    document.getElementById('nftDescription').textContent = nft.description;
    descriptionSection.hidden = false;
  } else {
    descriptionSection.hidden = true;
  }

  document.getElementById('nftCategory').textContent = nft.category;
  document.getElementById('nftPrice').textContent = `${nft.price} ETH`;
  document.getElementById('nftBid').textContent = `${nft.highestBid} wETH`;
}

async function loadMoreFromArtist(nft) {
  const grid = document.getElementById('nftMoreGrid');
  const status = document.getElementById('nftMoreStatus');
  const creatorId = nft.creator?._id;
  if (!creatorId) return;

  try {
    const response = await fetch(`${API_BASE}/nfts?creator=${encodeURIComponent(creatorId)}&limit=9`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

    const data = await response.json();
    // The current NFT itself usually shows up in its own creator's list —
    // exclude it so "more from this artist" doesn't include the piece
    // you're already looking at.
    const others = data.nfts.filter((other) => other._id !== nft._id);

    if (others.length === 0) {
      status.hidden = false;
      status.textContent = 'No other NFTs from this artist yet.';
      return;
    }

    others.forEach((other) => grid.appendChild(buildNftCard(other)));
  } catch (err) {
    console.error('Could not load more NFTs from this artist:', err);
    status.hidden = false;
    status.textContent = "Couldn't load more NFTs from this artist.";
    status.classList.add('marketplace-grid__status--error');
  }
}
