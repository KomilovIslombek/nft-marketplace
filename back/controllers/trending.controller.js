// =====================================================
// CONTROLLERS/TRENDING.CONTROLLER.JS
// "What's selling" views, aggregated from real Sale documents — the
// same source the creator rankings use, grouped by NFT and by category.
//
// These replace two homepage sections that used to be hardcoded:
//   - "Trending Collection" (three made-up collections with a fake
//     "1025+" badge). There is no Collection model, so instead of
//     inventing one, the section ranks the one grouping the data really
//     has: an NFT's category.
//   - "Auction" (a countdown to a date that had already passed, for an
//     auction that never existed). The banner now spotlights the most
//     traded NFT, with its real sale count and volume.
// =====================================================

const Sale = require('../modules/sale');
const Nft = require('../modules/nft');
const { parsePeriod, currentWindow, parseLimit, roundEth } = require('../utils/periods');

const PUBLIC_USER_FIELDS = 'username avatarUrl';

// How many NFT thumbnails each category card shows (one large, two small).
const PREVIEW_SIZE = 3;

// Per-NFT sale totals inside a window, joined to the NFT itself.
// The $unwind after the $lookup drops sales whose NFT no longer exists,
// the same way the rankings aggregation does, so the two can't disagree.
function salesByNftStages(period) {
  const window = currentWindow(period);
  const stages = [];
  if (window) stages.push({ $match: { soldAt: window } });

  stages.push(
    {
      $group: {
        _id: '$nft',
        volume: { $sum: '$price' },
        sales: { $sum: 1 },
        lastSoldAt: { $max: '$soldAt' },
      },
    },
    { $lookup: { from: 'nfts', localField: '_id', foreignField: '_id', as: 'nft' } },
    { $unwind: '$nft' }
  );

  return stages;
}

// GET /api/trending/nfts
// Public. NFTs ranked by sales volume.
//   ?period=7d|30d|90d|all   (default 30d)
//   ?limit=5                 (max 20)
async function getTrendingNfts(req, res) {
  try {
    const period = parsePeriod(req.query.period);
    const limit = parseLimit(req.query.limit, 5, 20);

    const rows = await Sale.aggregate([
      ...salesByNftStages(period),
      // _id as a tie-breaker keeps the order stable between requests.
      { $sort: { volume: -1, _id: 1 } },
      { $limit: limit },
    ]);

    // Re-read through the model so creator/owner are populated the same
    // way GET /api/nfts returns them (public fields only).
    const nfts = await Nft.find({ _id: { $in: rows.map((r) => r._id) } })
      .populate('creator', PUBLIC_USER_FIELDS)
      .populate('owner', PUBLIC_USER_FIELDS);
    const nftsById = new Map(nfts.map((n) => [String(n._id), n]));

    const trending = rows
      .filter((row) => nftsById.has(String(row._id)))
      .map((row, index) => ({
        rank: index + 1,
        nft: nftsById.get(String(row._id)),
        volume: roundEth(row.volume),
        sales: row.sales,
        lastSoldAt: row.lastSoldAt,
      }));

    res.status(200).json({ period, trending });
  } catch (err) {
    console.error('Get trending NFTs error:', err.message);
    res.status(500).json({ message: 'Something went wrong while fetching trending NFTs' });
  }
}

// GET /api/trending/categories
// Public. Categories ranked by sales volume, each with a few preview NFTs.
//   ?period=7d|30d|90d|all   (default 30d)
//   ?limit=3                 (max 8 — there are only 8 categories)
async function getTrendingCategories(req, res) {
  try {
    const period = parsePeriod(req.query.period);
    const limit = parseLimit(req.query.limit, 3, Nft.CATEGORIES.length);

    const rows = await Sale.aggregate([
      ...salesByNftStages(period),
      {
        $group: {
          _id: '$nft.category',
          volume: { $sum: '$volume' },
          sales: { $sum: '$sales' },
          // $topN (MongoDB 5.2+) picks the best-selling NFTs per category
          // with a guaranteed order — $push after a $sort doesn't promise one.
          topNfts: {
            $topN: {
              n: PREVIEW_SIZE,
              sortBy: { volume: -1, _id: 1 },
              output: { _id: '$nft._id', title: '$nft.title', imageUrl: '$nft.imageUrl' },
            },
          },
        },
      },
      { $sort: { volume: -1, _id: 1 } },
      { $limit: limit },
    ]);

    // Total listings per category, sold or not — that's the number on
    // each card's badge.
    const counts = await Nft.aggregate([
      { $match: { category: { $in: rows.map((r) => r._id) } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countByCategory = new Map(counts.map((c) => [c._id, c.count]));

    const categories = await Promise.all(
      rows.map(async (row) => {
        let previews = row.topNfts;

        // A category with fewer than 3 *sold* NFTs still has a full card:
        // top up the previews with its newest unsold listings.
        if (previews.length < PREVIEW_SIZE) {
          const extra = await Nft.find({
            category: row._id,
            _id: { $nin: previews.map((p) => p._id) },
          })
            .sort({ createdAt: -1 })
            .limit(PREVIEW_SIZE - previews.length)
            .select('title imageUrl')
            .lean();
          previews = previews.concat(extra);
        }

        return {
          category: row._id,
          volume: roundEth(row.volume),
          sales: row.sales,
          nftCount: countByCategory.get(row._id) ?? 0,
          previews: previews.map((p) => ({ _id: p._id, title: p.title, imageUrl: p.imageUrl })),
        };
      })
    );

    res.status(200).json({ period, categories });
  } catch (err) {
    console.error('Get trending categories error:', err.message);
    res.status(500).json({ message: 'Something went wrong while fetching trending categories' });
  }
}

module.exports = { getTrendingNfts, getTrendingCategories };
