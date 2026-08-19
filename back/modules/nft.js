// =====================================================
// MODULES/NFT.JS
// Mongoose schema for a single NFT listing.
//
// Both `creator` and `owner` are stored (not just one) on purpose:
// they start out the same person, but diverge the moment an NFT is
// sold/transferred. This is what lets the Profile page's "Created"
// vs "Owned" tabs (already scaffolded in profile.html, currently
// empty) query real, different data instead of needing a rewrite
// later — Created: { creator: userId }, Owned: { owner: userId }.
// =====================================================

const mongoose = require('mongoose');

// Matches the categories used on the "Browse Categories" section of the
// homepage — kept as an enum (not a free-text field) so the eventual
// category filter/browse page can't be broken by typos in listing data.
const CATEGORIES = [
  'Art',
  'Collectibles',
  'Music',
  'Photography',
  'Video',
  'Utility',
  'Sport',
  'Virtual Worlds',
];

const nftSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Image is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    // Price the NFT is currently listed for (ETH), and the highest bid
    // placed against it so far (wETH) — matches the two figures shown
    // on every NFT card in the Figma mock. No live bidding logic yet;
    // this is just the current snapshot value.
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    highestBid: {
      type: Number,
      min: 0,
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Newest-first is the default sort everywhere this gets listed
// (Marketplace, Profile grids) — index supports that sort efficiently.
nftSchema.index({ createdAt: -1 });

nftSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Nft', nftSchema);
