// =====================================================
// MODULES/SALE.JS
// One completed sale of one NFT — the transaction history the
// marketplace previously had no concept of at all.
//
// Why this exists: before it, an NFT only ever had `creator` and
// `owner`, and nothing in the app could ever change `owner`. That
// meant no volume, no "NFTs sold", no price history, and a Rankings
// page with nothing real to rank. A Sale is the missing event that
// makes ownership move.
//
// A Sale is an immutable historical fact — it is never edited or
// deleted once written. Reversing a sale means recording a new sale
// in the other direction, the same way a ledger works.
// =====================================================

const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    nft: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nft',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The price this sale actually closed at (ETH) — deliberately stored
    // here rather than read back off the NFT. The NFT's own `price` is its
    // *current* asking price and changes over time; what a piece sold for
    // in March is a fact about that moment and must not move with it.
    // Every volume figure on the Rankings page sums this field.
    price: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: 0,
    },
    // When the sale closed. Separate from createdAt because seeded demo
    // history is backdated — createdAt would say "all of it happened the
    // moment we ran the seed script", which is exactly the flaw that made
    // period filtering meaningless before this model existed.
    soldAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// The Rankings aggregation always filters by a soldAt window and then
// groups — this index serves that leading $match. The seller-scoped one
// supports per-artist history (e.g. a future "sales" tab on artist.html).
saleSchema.index({ soldAt: -1 });
saleSchema.index({ seller: 1, soldAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
