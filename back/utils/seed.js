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
      description: nft.description,
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
