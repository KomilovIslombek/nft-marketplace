// =====================================================
// TESTS/HELPERS.JS
// Shared setup for the integration tests.
//
// Each test file gets its own throwaway MongoDB (mongodb-memory-server
// starts a real mongod in memory), so tests exercise the real Mongoose
// models, indexes and aggregation pipelines — and can never touch the
// development or production database.
// =====================================================

// Must be set before app.js (and anything that reads them) is required.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret';

const { before, after, beforeEach } = require('node:test');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const User = require('../modules/user');
const Nft = require('../modules/nft');
const Sale = require('../modules/sale');

const DAY_MS = 24 * 60 * 60 * 1000;

let mongod;

// Registers the database lifecycle hooks for the calling test file.
function useTestDatabase() {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    // Unique indexes (username, email) must exist before the duplicate
    // tests run, or the "409 on duplicate" checks would pass for the wrong reason.
    await Promise.all([User.syncIndexes(), Nft.syncIndexes(), Sale.syncIndexes()]);
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Nft.deleteMany({}), Sale.deleteMany({})]);
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}

let userCounter = 0;

async function createUser(overrides = {}) {
  userCounter += 1;
  return User.create({
    username: `user${userCounter}`,
    email: `user${userCounter}@test.local`,
    password: 'Password123!',
    ...overrides,
  });
}

async function createNft(creator, overrides = {}) {
  return Nft.create({
    title: 'Untitled',
    imageUrl: '/assets/images/robot.png',
    category: 'Art',
    price: 1,
    creator: creator._id,
    owner: creator._id,
    ...overrides,
  });
}

async function createSale(nft, { seller, buyer, price, daysAgo = 1 }) {
  return Sale.create({
    nft: nft._id,
    seller: seller._id,
    buyer: buyer._id,
    price,
    soldAt: new Date(Date.now() - daysAgo * DAY_MS),
  });
}

// The auth cookie as the browser would store it, for asserting its flags.
function getAuthCookie(response) {
  const cookies = response.headers['set-cookie'] || [];
  return cookies.find((c) => c.startsWith('token='));
}

module.exports = { app, useTestDatabase, createUser, createNft, createSale, getAuthCookie };
