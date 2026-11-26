// =====================================================
// CONTROLLERS/STATS.CONTROLLER.JS
// Marketplace-wide totals for the homepage hero. The hero used to show
// "240k+ Total Sale / 100k+ Auctions / 240k+ Artists" — numbers from the
// Figma template, not from this app. These are counted from the database.
// =====================================================

const Sale = require('../modules/sale');
const Nft = require('../modules/nft');
const { roundEth } = require('../utils/periods');

// GET /api/stats
// Public.
async function getStats(req, res) {
  try {
    const [nfts, creatorIds, sales, volumeRows] = await Promise.all([
      Nft.countDocuments(),
      // "Artists" means people who have listed at least one NFT, not every
      // registered account — signing up doesn't make someone an artist.
      Nft.distinct('creator'),
      Sale.countDocuments(),
      Sale.aggregate([{ $group: { _id: null, volume: { $sum: '$price' } } }]),
    ]);

    res.status(200).json({
      nfts,
      creators: creatorIds.length,
      sales,
      volume: roundEth(volumeRows[0]?.volume ?? 0),
    });
  } catch (err) {
    console.error('Get stats error:', err.message);
    res.status(500).json({ message: 'Something went wrong while fetching marketplace stats' });
  }
}

module.exports = { getStats };
