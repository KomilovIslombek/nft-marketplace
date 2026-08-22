// =====================================================
// COMPONENTS/NFT-CARD.JS
// Builds one .nft-card DOM node from an NFT API object. Shared by
// marketplace.js and nft-detail.js so there's exactly one place that
// knows how to safely render a card, instead of two copies drifting
// apart. Load this before any script that calls buildNftCard().
//
// Built as real DOM nodes + .textContent (not an innerHTML template
// string) — NFT titles/creator usernames are user-submitted content
// via POST /api/nfts with no sanitization, so this is what keeps a
// listing titled "<img onerror=...>" from being able to run anything.
// =====================================================

function buildNftCard(nft) {
  const card = document.createElement('a');
  card.className = 'nft-card';
  // A hash fragment, not a query string, on purpose: front/ is served by
  // whatever's running locally (our own `serve`, or VS Code Live Server),
  // and `serve`'s "clean URLs" feature 301-redirects `nft.html` -> `nft`
  // and silently drops query strings on that redirect. A #fragment is
  // never sent to the server at all, so the browser preserves it across
  // that redirect regardless — the id survives either way.
  card.href = `./nft.html#id=${encodeURIComponent(nft._id)}`;

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
