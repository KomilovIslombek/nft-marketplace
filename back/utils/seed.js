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

const DEMO_PASSWORD = 'DemoPass123!'; // hashed by the User pre-save hook — not meant for real login

const DEMO_CREATORS = [
  { username: 'Shroomie', email: 'shroomie@demo.nftmarketplace.local' },
  { username: 'BeKind2Robots', email: 'bekind2robots@demo.nftmarketplace.local' },
  { username: 'MrFox', email: 'mrfox@demo.nftmarketplace.local' },
  { username: 'Keepitreal', email: 'keepitreal@demo.nftmarketplace.local' },
  { username: 'Robotica', email: 'robotica@demo.nftmarketplace.local' },
  { username: 'MoonDancer', email: 'moondancer@demo.nftmarketplace.local' },
  { username: 'NebulaKid', email: 'nebulakid@demo.nftmarketplace.local' },
  { username: 'Animakid', email: 'animakid@demo.nftmarketplace.local' },
  { username: 'Catch22', email: 'catch22@demo.nftmarketplace.local' },
  { username: 'IceApeClub', email: 'iceapeclub@demo.nftmarketplace.local' },
  { username: 'PuppyPower', email: 'puppypower@demo.nftmarketplace.local' },
];

// imageUrl values are paths as served by the frontend (front/assets/images/…),
// not backend-hosted files — the backend just stores where the picture lives.
const DEMO_NFTS = [
  { title: 'Magic Mushroom 0325', creator: 'Shroomie', category: 'Art', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/mushroom.png' },
  { title: 'Happy Robot 032', creator: 'BeKind2Robots', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/robot.png' },
  { title: 'Happy Robot 024', creator: 'BeKind2Robots', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/robot.png' },
  { title: 'Designer Bear', creator: 'MrFox', category: 'Art', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-bear.png' },
  { title: 'Colorful Dog 0356', creator: 'Keepitreal', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-dog.png' },
  { title: 'Dancing Robot 0312', creator: 'Robotica', category: 'Music', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/music.png' },
  { title: 'Cherry Blossom Girl 035', creator: 'MoonDancer', category: 'Photography', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut.png' },
  { title: 'Space Travel', creator: 'NebulaKid', category: 'Virtual Worlds', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/space-walking.png' },
  { title: 'Sunset Dimension', creator: 'Animakid', category: 'Virtual Worlds', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut-spaceship.jpg' },
  { title: 'Desert Walk', creator: 'Catch22', category: 'Photography', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/astronaut-spaceship-2.jpg' },
  { title: 'IceCream Ape 0324', creator: 'IceApeClub', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-cat.png' },
  { title: 'Colorful Dog 0344', creator: 'PuppyPower', category: 'Collectibles', price: 1.63, highestBid: 0.33, imageUrl: '/assets/images/nft-dog.png' },
];

async function seed() {
  await connectDB();

  console.log('Seeding demo creators...');
  const creatorsByUsername = {};
  for (const { username, email } of DEMO_CREATORS) {
    // findOneAndUpdate + upsert: creates the user if missing, leaves it
    // alone (no field changes) if it already exists — running this
    // script twice never duplicates or resets demo accounts.
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ username, email, password: DEMO_PASSWORD });
      console.log(`  created ${username}`);
    } else {
      console.log(`  ${username} already exists, skipping`);
    }
    creatorsByUsername[username] = user;
  }

  const seedCreatorIds = Object.values(creatorsByUsername).map((u) => u._id);

  console.log('Clearing previously seeded NFTs (owned by demo creators only)...');
  const { deletedCount } = await Nft.deleteMany({ creator: { $in: seedCreatorIds } });
  console.log(`  removed ${deletedCount} existing demo NFT(s)`);

  console.log('Seeding NFTs...');
  const docs = DEMO_NFTS.map((nft) => {
    const creator = creatorsByUsername[nft.creator];
    return {
      title: nft.title,
      category: nft.category,
      price: nft.price,
      highestBid: nft.highestBid,
      imageUrl: nft.imageUrl,
      creator: creator._id,
      owner: creator._id,
    };
  });
  await Nft.insertMany(docs);
  console.log(`  inserted ${docs.length} NFT(s)`);

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
