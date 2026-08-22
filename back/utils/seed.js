// =====================================================
// UTILS/SEED.JS
// Populates demo creators + NFT listings so the API (and eventually
// the Marketplace page, once it fetches instead of using hardcoded
// HTML) has real data to work with.
//
// Reuses the exact artist names, titles, and prices already hardcoded
// into front/marketplace.html, so seeded data matches what's on
// screen today — swapping the frontend from hardcoded cards to a
// fetch() call later should be a visual no-op.
//
// Safe to re-run: upserts demo users by email, and only replaces NFTs
// owned by those specific demo users (never touches real user data).
//
// Usage: npm run seed   (from back/)
// =====================================================

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../modules/user');
const Nft = require('../modules/nft');
const Sale = require('../modules/sale');

const DAY_MS = 24 * 60 * 60 * 1000;

// How far back demo listings are spread. Sales are then generated between
// a listing's own date and today, so no NFT can ever sell before it existed.
const MIN_LISTING_AGE_DAYS = 25;
const MAX_LISTING_AGE_DAYS = 150;

// The demo history below is generated rather than hand-written, but it has
// to be the SAME history on every run — otherwise `npm run seed` reshuffles
// the leaderboard, and any screenshot or doc referring to it goes stale.
// mulberry32 seeded with a fixed constant gives repeatable "random" numbers.
const RANDOM_SEED = 20260822;

// Exponent applied to the sale-date random draw. 1 = evenly spread across
// the listing's lifetime; higher = more of the history clustered near today.
const RECENCY_BIAS = 1.8;

function makeRandom(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rand, min, max) {
  return min + rand() * (max - min);
}

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS);
}

// Weighted so a few pieces never sell, most trade once or twice, and a
// handful change hands repeatedly — that spread is what makes a leaderboard
// have a shape instead of every creator sitting on the same number.
function pickSaleCount(rand) {
  const roll = rand();
  if (roll < 0.1) return 0;
  if (roll < 0.3) return 1;
  if (roll < 0.6) return 2;
  if (roll < 0.85) return 3;
  return 4;
}

const DEMO_PASSWORD = 'DemoPass123!'; // hashed by the User pre-save hook — not meant for real login

const DEMO_CREATORS = [
  { username: 'Shroomie', email: 'shroomie@demo.nftmarketplace.local', bio: 'Illustrator obsessed with things that glow in the dark. Magic Mushroom collection creator.' },
  { username: 'BeKind2Robots', email: 'bekind2robots@demo.nftmarketplace.local', bio: 'Building a world where every discarded appliance gets a second life as a friendly robot.' },
  { username: 'MrFox', email: 'mrfox@demo.nftmarketplace.local', bio: 'Designer animals with impeccable taste in eyewear. One drop at a time.' },
  { username: 'Keepitreal', email: 'keepitreal@demo.nftmarketplace.local', bio: 'Generative color-seed art. No two pieces ever look the same.' },
  { username: 'Robotica', email: 'robotica@demo.nftmarketplace.local', bio: 'Sound-reactive robot art, tuned to frequencies most people can’t hear.' },
  { username: 'MoonDancer', email: 'moondancer@demo.nftmarketplace.local', bio: 'Photography from the last clear nights before the dust storms.' },
  { username: 'NebulaKid', email: 'nebulakid@demo.nftmarketplace.local', bio: 'In-engine renders of wanderers drifting between dying stars.' },
  { username: 'Animakid', email: 'animakid@demo.nftmarketplace.local', bio: 'The internet’s friendliest designer kid. Pocket dimensions where the sun never fully sets.' },
  { username: 'Catch22', email: 'catch22@demo.nftmarketplace.local', bio: 'Dune seas, two moons, one lone figure. First solo series after years of collabs.' },
  { username: 'IceApeClub', email: 'iceapeclub@demo.nftmarketplace.local', bio: 'A club of apes that melt slower than they should. Rarity is the whole point.' },
  { username: 'PuppyPower', email: 'puppypower@demo.nftmarketplace.local', bio: 'Brighter, louder, slightly chaotic takes on the Colorful Dog format.' },
];

// imageUrl values are paths as served by the frontend (front/assets/images/…),
// not backend-hosted files — the backend just stores where the picture lives.
const DEMO_NFTS = [
  { title: 'Magic Mushroom 0325', creator: 'Shroomie', category: 'Art', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/mushroom.png', description: 'Part of the Magic Mushroom collection — hand-illustrated fungi from a forest that only exists after dark.' },
  { title: 'Happy Robot 032', creator: 'BeKind2Robots', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/robot.png', description: 'One of 1,000 friendly robots, each built from a different decommissioned appliance and given a new personality.' },
  { title: 'Happy Robot 024', creator: 'BeKind2Robots', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/robot.png', description: 'One of 1,000 friendly robots, each built from a different decommissioned appliance and given a new personality.' },
  { title: 'Designer Bear', creator: 'MrFox', category: 'Art', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-bear.png', description: 'A bear with impeccable taste in eyewear. Limited drop from the Designer Animals series.' },
  { title: 'Colorful Dog 0356', creator: 'Keepitreal', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-dog.png', description: 'Every Colorful Dog is generated from a unique palette seed — no two coats are the same.' },
  { title: 'Dancing Robot 0312', creator: 'Robotica', category: 'Music', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/music.png', description: 'This one only dances to frequencies humans can\'t hear. Part of the Robotica sound-reactive series.' },
  { title: 'Cherry Blossom Girl 035', creator: 'MoonDancer', category: 'Photography', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut.png', description: 'Shot on the last clear night before the dust storms — one of MoonDancer\'s Cherry Blossom series.' },
  { title: 'Space Travel', creator: 'NebulaKid', category: 'Virtual Worlds', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/space-walking.png', description: 'A wanderer drifting between two dying stars, rendered entirely in-engine — no photo reference used.' },
  { title: 'Sunset Dimension', creator: 'Animakid', category: 'Virtual Worlds', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut-spaceship.jpg', description: 'A pocket dimension where the sun never fully sets. Third piece in the Dimension Drift series.' },
  { title: 'Desert Walk', creator: 'Catch22', category: 'Photography', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut-spaceship-2.jpg', description: 'A lone figure crossing a dune sea under two moons. Catch 22\'s first fully solo release.' },
  { title: 'IceCream Ape 0324', creator: 'IceApeClub', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-cat.png', description: 'Melting slower than the rest of the club — considered a rare trait among Ice Ape collectors.' },
  { title: 'Colorful Dog 0344', creator: 'PuppyPower', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-dog.png', description: 'PuppyPower\'s take on the Colorful Dog format — brighter, louder, and a little chaotic.' },
  // A few extra so the grid has more than one page to actually exercise
  // "Load more" and category filtering against real, varied data.
  { title: 'Magic Mushroom 0402', creator: 'Shroomie', category: 'Art', price: 2.1, highestBid: 0.5, imageUrl: '/assets/images/auction-mushroom.png', description: 'A rarer variant from the Magic Mushroom collection, auctioned rather than fixed-price.' },
  { title: 'Wallet Wanderer', creator: 'MrFox', category: 'Utility', price: 0.9, highestBid: 0.12, imageUrl: '/assets/images/wallet.png', description: 'Grants no real utility whatsoever — it is, appropriately, a picture of a wallet.' },
  { title: 'Corner Shop', creator: 'Keepitreal', category: 'Collectibles', price: 1.2, highestBid: 0.21, imageUrl: '/assets/images/shop.png', description: 'A tiny shopfront from a neighborhood that only exists in Keepitreal\'s sketchbooks.' },
  { title: 'Night Frequency', creator: 'Robotica', category: 'Music', price: 3.4, highestBid: 0.88, imageUrl: '/assets/images/music.png', description: 'Highest-priced piece in the Robotica sound-reactive series — allegedly tuned to a real frequency.' },
  { title: 'Nebula Drift', creator: 'NebulaKid', category: 'Virtual Worlds', price: 2.75, highestBid: 0.6, imageUrl: '/assets/images/astronaut-spaceship.jpg', description: 'A companion piece to Space Travel, drifting the opposite direction through the same nebula.' },
  { title: 'Robo Companion', creator: 'BeKind2Robots', category: 'Sport', price: 1.05, highestBid: 0.19, imageUrl: '/assets/images/robot.png', description: 'BeKind2Robots\' first crossover piece — a robot built for a sport that hasn\'t been invented yet.' },
];

async function seed() {
  await connectDB();

  console.log('Seeding demo creators...');
  const creatorsByUsername = {};
  for (const { username, email, bio } of DEMO_CREATORS) {
    // Creates the user if missing, leaves it alone if it already exists —
    // running this script twice never duplicates demo accounts. The one
    // exception: if bio is empty (e.g. a demo account created before bios
    // were added here), backfill it — never overwrites a non-empty bio.
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ username, email, bio, password: DEMO_PASSWORD });
      console.log(`  created ${username}`);
    } else if (!user.bio && bio) {
      user.bio = bio;
      await user.save();
      console.log(`  ${username} already exists, backfilled bio`);
    } else {
      console.log(`  ${username} already exists, skipping`);
    }
    creatorsByUsername[username] = user;
  }

  const seedCreatorIds = Object.values(creatorsByUsername).map((u) => u._id);

  console.log('Clearing previously seeded sales + NFTs (demo creators only)...');
  // Sales reference NFTs, so they have to go first — otherwise re-running
  // the seed leaves Sale documents pointing at NFT ids that no longer
  // exist, and the rankings aggregation silently drops them at $unwind.
  const existingDemoNfts = await Nft.find({ creator: { $in: seedCreatorIds } }).select('_id');
  const existingDemoNftIds = existingDemoNfts.map((n) => n._id);

  const { deletedCount: salesRemoved } = await Sale.deleteMany({ nft: { $in: existingDemoNftIds } });
  const { deletedCount } = await Nft.deleteMany({ creator: { $in: seedCreatorIds } });
  console.log(`  removed ${salesRemoved} existing demo sale(s) and ${deletedCount} demo NFT(s)`);

  console.log('Seeding NFTs...');
  // Listings are backdated across the last few months rather than all
  // stamped with "now". Without this every NFT shares one createdAt to
  // the millisecond, and any date-windowed query — including the
  // Rankings period tabs — returns an identical result for every window.
  const rand = makeRandom(RANDOM_SEED);

  const docs = DEMO_NFTS.map((nft) => {
    const creator = creatorsByUsername[nft.creator];
    const listedAt = daysAgo(randBetween(rand, MIN_LISTING_AGE_DAYS, MAX_LISTING_AGE_DAYS));

    return {
      title: nft.title,
      description: nft.description,
      category: nft.category,
      price: nft.price,
      highestBid: nft.highestBid,
      imageUrl: nft.imageUrl,
      creator: creator._id,
      owner: creator._id, // may be reassigned below once sales are generated
      createdAt: listedAt,
      updatedAt: listedAt,
    };
  });

  // `timestamps: false` is required here: Mongoose's timestamp plugin would
  // otherwise overwrite the backdated createdAt above with the current time,
  // undoing the whole point of it.
  const insertedNfts = await Nft.insertMany(docs, { timestamps: false });
  console.log(`  inserted ${insertedNfts.length} NFT(s), listed between ${MIN_LISTING_AGE_DAYS} and ${MAX_LISTING_AGE_DAYS} days ago`);

  console.log('Generating sale history...');
  // Each NFT gets a chain of 0-3 sales. Ownership walks along that chain,
  // so `owner` genuinely diverges from `creator` for anything that sold —
  // which is what makes the Profile/Artist "Created" vs "Owned" tabs show
  // different things, and what gives Rankings a real volume to sum.
  const allDemoUsers = Object.values(creatorsByUsername);
  const saleDocs = [];

  insertedNfts.forEach((nft) => {
    const listedDaysAgo = (Date.now() - nft.createdAt.getTime()) / DAY_MS;
    const saleCount = pickSaleCount(rand);
    if (saleCount === 0) return;

    // Sale dates: random points between the listing date and today, put
    // back into chronological order so a chain reads oldest -> newest.
    // Sale dates are weighted toward the recent end rather than spread
    // evenly. Two reasons: a marketplace that is growing genuinely does
    // more volume lately than it did five months ago, and a flat spread
    // leaves the 7-day board with almost nothing on it. Raising a 0-1
    // random to a power > 1 pulls results toward 0 (= today).
    const points = Array.from({ length: saleCount }, () => {
      const maxDays = Math.max(listedDaysAgo - 1, 0.5);
      return Math.pow(rand(), RECENCY_BIAS) * maxDays;
    }).sort((a, b) => b - a);

    let seller = nft.creator;

    points.forEach((point) => {
      // Buyer is any demo user who isn't the current holder.
      const candidates = allDemoUsers.filter((u) => String(u._id) !== String(seller));
      const buyer = candidates[Math.floor(rand() * candidates.length)];

      // Sale prices drift around the NFT's listing price rather than
      // matching it exactly — a piece rarely changes hands at its sticker
      // price twice in a row.
      const price = Math.max(0.05, Math.round(nft.price * randBetween(rand, 0.6, 1.6) * 100) / 100);

      saleDocs.push({
        nft: nft._id,
        seller,
        buyer: buyer._id,
        price,
        soldAt: daysAgo(point),
      });

      seller = buyer._id; // whoever just bought it is the next seller
    });

    // Final buyer in the chain is the NFT's current owner.
    nft.owner = seller;
  });

  await Sale.insertMany(saleDocs);
  console.log(`  inserted ${saleDocs.length} sale(s)`);

  // Push the transferred ownership back onto the NFT documents in one
  // round trip instead of one save() per NFT.
  const transferred = insertedNfts.filter((n) => String(n.owner) !== String(n.creator));
  if (transferred.length > 0) {
    await Nft.bulkWrite(
      transferred.map((n) => ({
        updateOne: { filter: { _id: n._id }, update: { $set: { owner: n.owner } } },
      })),
      { timestamps: false }
    );
  }
  console.log(`  ${transferred.length} NFT(s) now owned by someone other than their creator`);

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
