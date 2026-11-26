// =====================================================
// LAYOUT/HERO.JS
// The homepage's two "featured" spots, both from real data:
//
//   1. Hero stats  — GET /api/stats (sales, NFTs, artists). Previously
//      "240k+ / 100k+ / 240k+" copied from the Figma template.
//   2. Hero card   — the runner-up of GET /api/trending/nfts.
//      Spotlight   — the #1 of the same request: the banner that used to
//      be a fake auction countdown now shows the most traded NFT with its
//      real sale count and volume.
//
// One trending request feeds both spots, so they can never show the same
// NFT twice or disagree about which is on top.
//
// Same XSS rule as components/nft-card.js: titles and usernames are
// user-submitted, so they only ever go into .textContent / attributes.
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  loadHeroStats();
  loadFeaturedNfts();
});

function avatarFor(user) {
  const name = user?.username || 'unknown';
  return user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
}

function nftHref(nft) {
  // #fragment, not ?query — see components/nft-card.js for why.
  return `./nft.html#id=${encodeURIComponent(nft._id)}`;
}

function artistHref(user) {
  return `./artist.html#id=${encodeURIComponent(user._id)}`;
}

async function loadHeroStats() {
  const stats = document.getElementById('heroStats');
  if (!stats) return;

  try {
    const response = await apiFetch('/stats');
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();

    stats.querySelectorAll('[data-stat]').forEach((el) => {
      const value = data[el.dataset.stat];
      if (typeof value !== 'number') return;
      // Reuses the count-up from abstracts/counter.js. The target is only
      // known once the API answers, so it's started here rather than by the
      // scroll observer, which would have animated towards an empty value.
      el.dataset.target = value;
      el.dataset.duration = 1200;
      animateCounter(el);
    });
  } catch (err) {
    // Leave the em-dashes in place: "unknown" is the honest fallback, a
    // made-up number is not.
    console.error('Could not load marketplace stats:', err);
  }
}

async function loadFeaturedNfts() {
  const card = document.getElementById('heroFeatured');
  const spotlight = document.getElementById('spotlight');

  try {
    const params = new URLSearchParams({ period: 'all', limit: 2 });
    const response = await apiFetch(`/trending/nfts?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const { trending } = await response.json();

    if (trending.length === 0) {
      // No sales recorded yet: nothing is "most traded", so say nothing.
      card?.remove();
      return;
    }

    if (spotlight) renderSpotlight(spotlight, trending[0]);
    // With a single traded NFT there is no runner-up; showing the same
    // piece in both places is better than an empty hero.
    if (card) renderHeroCard(card, (trending[1] || trending[0]).nft);
  } catch (err) {
    console.error('Could not load featured NFTs:', err);
    card?.remove();
  }
}

function renderHeroCard(card, nft) {
  card.href = nftHref(nft);
  card.setAttribute('aria-label', `${nft.title} by ${nft.creator?.username ?? 'unknown artist'}`);

  const image = card.querySelector('.hero__image');
  image.src = nft.imageUrl;
  image.alt = nft.title;

  card.querySelector('.hero__image-title').textContent = nft.title;

  const avatar = card.querySelector('.hero__image-author img');
  avatar.src = avatarFor(nft.creator);
  avatar.hidden = false;
  card.querySelector('.hero__image-author-name').textContent = nft.creator?.username ?? 'Unknown artist';

  card.classList.remove('is-loading');
}

function renderSpotlight(section, entry) {
  const { nft } = entry;

  const image = document.getElementById('spotlightImage');
  image.src = nft.imageUrl;
  image.alt = nft.title;

  const creator = document.getElementById('spotlightCreator');
  if (nft.creator?._id) creator.href = artistHref(nft.creator);
  creator.querySelector('.spotlight__creator-image').src = avatarFor(nft.creator);
  creator.querySelector('.spotlight__creator-name').textContent = nft.creator?.username ?? 'Unknown artist';

  document.getElementById('spotlightTitle').textContent = nft.title;
  document.getElementById('spotlightLink').href = nftHref(nft);

  section.querySelector('[data-spotlight="sales"]').textContent = String(entry.sales);
  section.querySelector('[data-spotlight="volume"]').textContent = `${entry.volume.toFixed(2)} ETH`;
  section.querySelector('[data-spotlight="price"]').textContent = `${nft.price} ETH`;

  section.hidden = false;
}
