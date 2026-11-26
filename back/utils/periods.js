// =====================================================
// UTILS/PERIODS.JS
// The ?period= windows shared by every sales aggregation
// (GET /api/rankings and GET /api/trending/*), so "last 30 days"
// means exactly the same thing on every page that says it.
// =====================================================

const DAY_MS = 24 * 60 * 60 * 1000;

// Supported ?period= values, in days. `all` means no date filter at all.
const PERIODS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

const DEFAULT_PERIOD = '30d';

// Unknown or missing values fall back to the default rather than erroring:
// a typo in a query string shouldn't turn a leaderboard into a 400.
function parsePeriod(value) {
  return Object.prototype.hasOwnProperty.call(PERIODS, value) ? value : DEFAULT_PERIOD;
}

// Returns the Mongo filter for `soldAt` in the current window, or null for `all`.
function currentWindow(period, now = Date.now()) {
  const days = PERIODS[period];
  return days ? { $gte: new Date(now - days * DAY_MS) } : null;
}

// The window of equal length immediately before the current one — what a
// period-over-period "change" is measured against. null for `all`.
function previousWindow(period, now = Date.now()) {
  const days = PERIODS[period];
  return days
    ? { $gte: new Date(now - 2 * days * DAY_MS), $lt: new Date(now - days * DAY_MS) }
    : null;
}

// Clamps ?limit= into [1, max], falling back to `fallback` when absent/invalid.
function parseLimit(value, fallback, max) {
  return Math.min(Math.max(parseInt(value, 10) || fallback, 1), max);
}

// Float sums drift (1.63 + 1.63 + 1.63 = 4.890000000000001), which looks
// like a bug in the API response even though it's just IEEE-754. Round at
// the boundary; 4dp is far finer than the 2dp the UI ever shows.
function roundEth(value) {
  return Math.round(value * 10000) / 10000;
}

module.exports = {
  DAY_MS,
  PERIODS,
  DEFAULT_PERIOD,
  parsePeriod,
  currentWindow,
  previousWindow,
  parseLimit,
  roundEth,
};
