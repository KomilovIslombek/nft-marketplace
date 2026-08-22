// =====================================================
// CONTROLLERS/RANKING.CONTROLLER.JS
// Creator leaderboard for the Rankings page, aggregated from real
// Sale documents — volume, NFTs sold, and period-over-period change.
//
// Design decision worth knowing: a sale is credited to the NFT's
// *creator*, not to whoever happened to be selling it. If Shroomie
// mints a piece, sells it to MrFox, and MrFox later flips it, both
// sales count toward Shroomie's volume. That's what makes this a
// "Top Creators" board rather than a "most active traders" board,
// and it matches how the homepage's Top Creators section is worded.
// =====================================================

const Sale = require('../modules/sale');
const User = require('../modules/user');

// Supported ?period= values, in days. `all` means no date filter at all.
const PERIODS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

const DEFAULT_PERIOD = '30d';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

// Float sums drift (1.63 + 1.63 + 1.63 = 4.890000000000001), which looks
// like a bug in the API response even though it's just IEEE-754. Round at
// the boundary; 4dp is far finer than the 2dp the UI ever shows, so no
// meaningful precision is lost.
function round(value) {
  return Math.round(value * 10000) / 10000;
}

// Percentages get one decimal — "+468.4%" is all a leaderboard cell can
// usefully show, and 4dp of a percentage reads like a rounding bug.
function roundPercent(value) {
  return Math.round(value * 10) / 10;
}

// Groups sales in a time window by the creator of the NFT sold.
// Returns a Map of creatorId(string) -> { volume, nftsSold }.
async function volumeByCreator(window) {
  const pipeline = [];

  if (window) {
    pipeline.push({ $match: { soldAt: window } });
  }

  pipeline.push(
    // Sales reference the NFT; the creator lives on the NFT, not the sale.
    { $lookup: { from: 'nfts', localField: 'nft', foreignField: '_id', as: 'nftDoc' } },
    { $unwind: '$nftDoc' },
    {
      $group: {
        _id: '$nftDoc.creator',
        volume: { $sum: '$price' },
        nftsSold: { $sum: 1 },
      },
    }
  );

  const rows = await Sale.aggregate(pipeline);

  return new Map(rows.map((r) => [String(r._id), { volume: r.volume, nftsSold: r.nftsSold }]));
}

// GET /api/rankings
// Public. Supports:
//   ?period=7d|30d|90d|all   time window for volume (default 30d)
//   ?limit=20                how many creators to return (max 50)
async function getRankings(req, res) {
  try {
    const period = Object.prototype.hasOwnProperty.call(PERIODS, req.query.period)
      ? req.query.period
      : DEFAULT_PERIOD;

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const days = PERIODS[period];
    const now = Date.now();

    // For a bounded period we also aggregate the immediately preceding
    // window of the same length, so "change" compares like with like
    // (last 30 days vs the 30 days before that). For `all` there is no
    // previous window to compare against — that's reported as null rather
    // than invented, and the UI renders it as "—".
    const currentWindow = days ? { $gte: new Date(now - days * DAY_MS) } : null;
    const previousWindow = days
      ? { $gte: new Date(now - 2 * days * DAY_MS), $lt: new Date(now - days * DAY_MS) }
      : null;

    const [current, previous] = await Promise.all([
      volumeByCreator(currentWindow),
      previousWindow ? volumeByCreator(previousWindow) : Promise.resolve(null),
    ]);

    // Sort by volume desc, then take the top N before doing the (more
    // expensive) user lookup — no point resolving usernames for creators
    // who won't appear on the board.
    const top = [...current.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, limit);

    const users = await User.find({ _id: { $in: top.map(([id]) => id) } })
      .select('username avatarUrl')
      .lean();

    const usersById = new Map(users.map((u) => [String(u._id), u]));

    const rankings = top.map(([creatorId, stats], index) => {
      const previousVolume = previous ? round(previous.get(creatorId)?.volume ?? 0) : null;

      // Percentage change is only meaningful when there's a non-zero base
      // to grow from. A creator with no sales last period isn't "+∞%" —
      // they're new to the board, and the UI says exactly that.
      const changePercent =
        previousVolume === null || previousVolume === 0
          ? null
          : roundPercent(((stats.volume - previousVolume) / previousVolume) * 100);

      const user = usersById.get(creatorId);

      return {
        rank: index + 1,
        creator: {
          _id: creatorId,
          username: user?.username ?? 'Unknown creator',
          avatarUrl: user?.avatarUrl ?? '',
        },
        volume: round(stats.volume),
        nftsSold: stats.nftsSold,
        previousVolume,
        changePercent,
      };
    });

    res.status(200).json({
      period,
      since: currentWindow ? currentWindow.$gte : null,
      rankings,
    });
  } catch (err) {
    console.error('Get rankings error:', err.message);
    res.status(500).json({ message: 'Something went wrong while building the rankings' });
  }
}

module.exports = { getRankings };
