// =====================================================
// LAYOUT/TOP-CREATORS.JS
// Homepage "Top Creators" section. Reads the same endpoint the
// Rankings page does (GET /api/rankings), so the homepage summary and
// the full leaderboard are physically incapable of disagreeing — this
// section used to be eight hardcoded cards showing the same "34.53
// ETH" for every artist.
//
// period=all rather than a recent window: the heading says "Total
// Sales" with no timeframe next to it, so all-time is the only reading
// that makes that label true.
//
// Cards are built as DOM nodes + .textContent, same reasoning as
// components/nft-card.js — usernames are user-submitted at registration
// and must never reach innerHTML.
// =====================================================

const TOP_CREATORS_API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with marketplace.js / rankings.js

// Matches the eight cards the Figma section was designed around.
const TOP_CREATORS_LIMIT = 8;

document.addEventListener('DOMContentLoaded', loadTopCreators);

async function loadTopCreators() {
  const grid = document.getElementById('topCreatorsGrid');
  const status = document.getElementById('topCreatorsStatus');
  if (!grid || !status) return; // section isn't on this page

  try {
    const params = new URLSearchParams({ period: 'all', limit: TOP_CREATORS_LIMIT });
    const response = await fetch(`${TOP_CREATORS_API_BASE}/rankings?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.rankings.length === 0) {
      status.textContent = 'No sales have been recorded yet.';
      return;
    }

    data.rankings.forEach((row) => grid.appendChild(buildCreatorCard(row)));
    status.hidden = true;
  } catch (err) {
    // Most likely cause during local dev: the backend isn't running.
    console.error('Could not load top creators:', err);
    status.textContent = "Couldn't load top creators — is the backend running?";
    status.classList.add('top-creators__status--error');
  }
}

function buildCreatorCard(row) {
  // An <a>, not the original <article> — these cards named a creator but
  // went nowhere, while the same names on the Rankings page are links.
  const card = document.createElement('a');
  card.className = 'creator';
  // #fragment, not ?query — see components/nft-card.js for why a query
  // string can't survive the static server's clean-URL redirect.
  card.href = `./artist.html#id=${encodeURIComponent(row.creator._id)}`;

  card.innerHTML = `
    <div class="creator__number"></div>
    <img class="creator__image" alt="">
    <div class="creator__body">
      <h4 class="creator__name"></h4>
      <div class="creator__sales">Total Sales: <span class="creator__sales-number"></span></div>
    </div>
  `;

  card.querySelector('.creator__number').textContent = row.rank;

  const image = card.querySelector('.creator__image');
  image.src =
    row.creator.avatarUrl ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.creator.username)}`;
  image.alt = '';

  card.querySelector('.creator__name').textContent = row.creator.username;
  card.querySelector('.creator__sales-number').textContent = `${row.volume.toFixed(2)} ETH`;

  return card;
}
