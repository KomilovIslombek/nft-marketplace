// =====================================================
// RANKINGS.JS
// Top Creators leaderboard. Each period tab is a separate request to
// GET /api/rankings with a different ?period= — the server aggregates
// a different soldAt window each time, so the tabs are real queries
// rather than a client-side re-sort of one cached list.
//
// Rows are built as DOM nodes + .textContent (same reasoning as
// components/nft-card.js): usernames are user-submitted via register,
// so nothing from the API is ever interpolated into innerHTML.
// =====================================================

const API_BASE = 'http://127.0.0.1:5000/api'; // keep in sync with marketplace.js / artist.js

const DEFAULT_PERIOD = '30d';

// Wording for the footnote under the table. The period label doubles as
// the "compared against" explanation, so the change column is never left
// ambiguous about what it's a change *from*.
const PERIOD_LABELS = {
  '7d': 'the 7 days before that',
  '30d': 'the 30 days before that',
  '90d': 'the 90 days before that',
};

const state = { period: DEFAULT_PERIOD };

document.addEventListener('DOMContentLoaded', () => {
  setupPeriodTabs();
  loadRankings();
});

async function loadRankings() {
  const status = document.getElementById('rankingsStatus');
  const table = document.getElementById('rankingsTable');
  const body = document.getElementById('rankingsBody');
  const note = document.getElementById('rankingsNote');

  status.hidden = false;
  status.classList.remove('rankings__status--error');
  status.textContent = 'Loading rankings…';
  table.hidden = true;
  note.hidden = true;
  body.innerHTML = '';

  try {
    const params = new URLSearchParams({ period: state.period, limit: 50 });
    const response = await fetch(`${API_BASE}/rankings?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.rankings.length === 0) {
      status.textContent =
        state.period === 'all'
          ? 'No sales have been recorded yet.'
          : 'No sales in this period — try a longer one.';
      return;
    }

    data.rankings.forEach((row) => body.appendChild(buildRow(row)));

    status.hidden = true;
    table.hidden = false;
    renderNote(note, data);
  } catch (err) {
    // Most likely cause during local dev: the backend isn't running.
    console.error('Could not load rankings:', err);
    status.textContent = "Couldn't load rankings — is the backend running?";
    status.classList.add('rankings__status--error');
  }
}

function buildRow(row) {
  const tr = document.createElement('tr');

  tr.appendChild(cell('#', 'rankings-table__rank', String(row.rank)));

  // --- Artist cell: avatar + name, linking to their page ---
  const artistCell = document.createElement('td');
  artistCell.dataset.label = 'Artist';

  const link = document.createElement('a');
  link.className = 'rankings-table__artist';
  // #fragment, not ?query — see components/nft-card.js for why the
  // query string can't survive the static server's redirect.
  link.href = `./artist.html#id=${encodeURIComponent(row.creator._id)}`;

  const avatar = document.createElement('img');
  avatar.className = 'rankings-table__avatar';
  avatar.alt = '';
  avatar.src =
    row.creator.avatarUrl ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.creator.username)}`;

  const name = document.createElement('span');
  name.className = 'rankings-table__name';
  name.textContent = row.creator.username;

  link.append(avatar, name);
  artistCell.appendChild(link);
  tr.appendChild(artistCell);

  // --- Change cell ---
  tr.appendChild(buildChangeCell(row));

  tr.appendChild(cell('NFTs Sold', 'rankings-table__num', String(row.nftsSold)));
  tr.appendChild(cell('Volume', 'rankings-table__num', `${row.volume.toFixed(2)} ETH`));

  return tr;
}

// The API returns changePercent: null for two genuinely different
// reasons, and they must not look the same on screen:
//   previousVolume === null -> period is "all time", no previous window
//   previousVolume === 0    -> creator had no sales last period
function buildChangeCell(row) {
  const td = document.createElement('td');
  td.dataset.label = 'Change';

  const span = document.createElement('span');
  span.className = 'rankings-table__change';

  if (row.changePercent === null && row.previousVolume === null) {
    span.classList.add('rankings-table__change--none');
    span.textContent = '—';
    span.title = 'All-time totals have no previous period to compare against';
  } else if (row.changePercent === null) {
    span.classList.add('rankings-table__change--new');
    span.textContent = 'New';
    span.title = 'No sales in the previous period';
  } else {
    const up = row.changePercent >= 0;
    span.classList.add(up ? 'rankings-table__change--up' : 'rankings-table__change--down');
    span.textContent = `${up ? '+' : ''}${row.changePercent}%`;
    span.title = `Previous period: ${row.previousVolume.toFixed(2)} ETH`;
  }

  td.appendChild(span);
  return td;
}

function cell(label, className, text) {
  const td = document.createElement('td');
  td.dataset.label = label;

  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;

  td.appendChild(span);
  return td;
}

// Spells out what the numbers actually mean, rather than leaving the
// reader to guess what a leaderboard with no sales feature is measuring.
function renderNote(note, data) {
  const comparison = PERIOD_LABELS[data.period];

  note.textContent = comparison
    ? `Volume is the total value of every sale of an NFT this creator made, within the selected period. Change compares it against ${comparison}. "New" means the creator had no sales in that earlier window.`
    : 'Volume is the total value of every sale of an NFT this creator made, across all time. There is no earlier window to compare against, so Change shows "—".';

  note.hidden = false;
}

function setupPeriodTabs() {
  const tabs = document.getElementById('rankingsPeriods');
  if (!tabs) return;

  tabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.rankings-tabs__tab');
    if (!tab || tab.dataset.period === state.period) return;

    tabs.querySelectorAll('.rankings-tabs__tab').forEach((t) => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    state.period = tab.dataset.period;
    loadRankings();
  });
}
