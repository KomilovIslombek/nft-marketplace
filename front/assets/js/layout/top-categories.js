// =====================================================
// LAYOUT/TOP-CATEGORIES.JS
// Homepage "Top Categories" — the section the Figma calls "Trending
// Collection". The app has no collections, so rather than keep three
// invented ones, each card is a real category ranked by real sales
// volume (GET /api/trending/categories?period=all). The card layout is
// the Figma one: a large image, two thumbnails, and a count badge — here
// the badge is the number of NFTs actually listed in that category.
//
// period=all for the same reason as top-creators.js: the demo sale
// history is generated once by `npm run seed`, so a "this week" window
// would quietly empty out a week after seeding.
//
// DOM nodes + .textContent only — NFT titles are user-submitted.
// =====================================================

const TOP_CATEGORIES_LIMIT = 3; // the Figma grid is three cards wide

document.addEventListener('DOMContentLoaded', loadTopCategories);

async function loadTopCategories() {
  const grid = document.getElementById('topCategoriesGrid');
  const status = document.getElementById('topCategoriesStatus');
  if (!grid || !status) return;

  try {
    const params = new URLSearchParams({ period: 'all', limit: TOP_CATEGORIES_LIMIT });
    const response = await apiFetch(`/trending/categories?${params.toString()}`);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

    const { categories } = await response.json();

    if (categories.length === 0) {
      status.textContent = 'No sales have been recorded yet.';
      return;
    }

    categories.forEach((row) => grid.appendChild(buildCategoryCard(row)));
    status.hidden = true;
  } catch (err) {
    console.error('Could not load top categories:', err);
    status.textContent = "Couldn't load categories right now.";
    status.classList.add('top-categories__status--error');
  }
}

function buildCategoryCard(row) {
  const card = document.createElement('a');
  card.className = 'category-card';
  // The Marketplace reads #category= and pre-selects that filter chip.
  card.href = `./marketplace.html#category=${encodeURIComponent(row.category)}`;

  card.innerHTML = `
    <img class="category-card__image" alt="">
    <div class="category-card__meta-row">
      <img class="category-card__thumb" alt="">
      <img class="category-card__thumb" alt="">
      <span class="category-card__badge">
        <span class="category-card__badge-number"></span>
        <span class="category-card__badge-label"></span>
      </span>
    </div>
    <div class="category-card__body">
      <h3 class="category-card__title"></h3>
      <p class="category-card__stats"></p>
    </div>
  `;

  const [main, ...thumbs] = row.previews;

  const image = card.querySelector('.category-card__image');
  if (main) {
    image.src = main.imageUrl;
    image.alt = main.title;
  }

  card.querySelectorAll('.category-card__thumb').forEach((thumb, index) => {
    const preview = thumbs[index];
    if (preview) {
      thumb.src = preview.imageUrl;
      thumb.alt = preview.title;
    } else {
      thumb.remove(); // fewer than 3 NFTs in this category — no filler image
    }
  });

  card.querySelector('.category-card__badge-number').textContent = String(row.nftCount);
  card.querySelector('.category-card__badge-label').textContent = row.nftCount === 1 ? 'NFT' : 'NFTs';
  card.querySelector('.category-card__title').textContent = row.category;

  const salesWord = row.sales === 1 ? 'sale' : 'sales';
  card.querySelector('.category-card__stats').textContent =
    `${row.volume.toFixed(2)} ETH volume · ${row.sales} ${salesWord}`;

  return card;
}
