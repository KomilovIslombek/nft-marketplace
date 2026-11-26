const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app, useTestDatabase, createUser, createNft, createSale } = require('./helpers');

useTestDatabase();

// Two artists, four NFTs across two categories, and a known sale history.
async function seedMarket() {
  const alice = await createUser({ username: 'alice' });
  const bob = await createUser({ username: 'bob' });
  await createUser({ username: 'collector-only' }); // registered, never listed anything

  const mushroom = await createNft(alice, { title: 'Mushroom', category: 'Art', price: 2 });
  const bear = await createNft(alice, { title: 'Bear', category: 'Art' });
  const robot = await createNft(bob, { title: 'Robot', category: 'Collectibles' });
  await createNft(bob, { title: 'Unsold Dog', category: 'Collectibles' });

  await createSale(mushroom, { seller: alice, buyer: bob, price: 3, daysAgo: 2 });
  await createSale(mushroom, { seller: bob, buyer: alice, price: 4, daysAgo: 40 });
  await createSale(robot, { seller: bob, buyer: alice, price: 5, daysAgo: 1 });
  await createSale(bear, { seller: alice, buyer: bob, price: 0.5, daysAgo: 3 });

  return { alice, bob, mushroom, robot };
}

describe('GET /api/trending/nfts', () => {
  it('ranks NFTs by total sales volume in the period', async () => {
    await seedMarket();

    const all = await request(app).get('/api/trending/nfts?period=all');
    assert.equal(all.status, 200);
    assert.deepEqual(
      all.body.trending.map((t) => [t.nft.title, t.volume, t.sales]),
      [
        ['Mushroom', 7, 2],
        ['Robot', 5, 1],
        ['Bear', 0.5, 1],
      ]
    );
    assert.equal(all.body.trending[0].rank, 1);
    assert.equal(all.body.trending[0].nft.creator.username, 'alice');
    assert.equal(all.body.trending[0].nft.creator.email, undefined);

    // The 40-day-old Mushroom sale drops out of a 30-day window.
    const month = await request(app).get('/api/trending/nfts?period=30d');
    assert.deepEqual(
      month.body.trending.map((t) => [t.nft.title, t.volume]),
      [
        ['Robot', 5],
        ['Mushroom', 3],
        ['Bear', 0.5],
      ]
    );
  });

  it('respects ?limit', async () => {
    await seedMarket();
    const top = await request(app).get('/api/trending/nfts?period=all&limit=1');
    assert.equal(top.body.trending.length, 1);
    assert.equal(top.body.trending[0].nft.title, 'Mushroom');
  });

  it('is an empty list, not an error, with no sales at all', async () => {
    const res = await request(app).get('/api/trending/nfts?period=all');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.trending, []);
  });
});

describe('GET /api/trending/categories', () => {
  it('ranks categories by volume, with listing counts and previews', async () => {
    await seedMarket();

    const res = await request(app).get('/api/trending/categories?period=all');
    assert.equal(res.status, 200);

    const [art, collectibles] = res.body.categories;
    assert.equal(art.category, 'Art');
    assert.equal(art.volume, 7.5);
    assert.equal(art.sales, 3);
    assert.equal(art.nftCount, 2);
    // Best seller first.
    assert.deepEqual(
      art.previews.map((p) => p.title),
      ['Mushroom', 'Bear']
    );

    assert.equal(collectibles.category, 'Collectibles');
    assert.equal(collectibles.nftCount, 2, 'counts unsold listings too');
    // The sold Robot leads; the unsold Dog tops up the preview row.
    assert.deepEqual(
      collectibles.previews.map((p) => p.title),
      ['Robot', 'Unsold Dog']
    );
  });

  it('uses the period window for the ranking', async () => {
    await seedMarket();
    const week = await request(app).get('/api/trending/categories?period=7d');
    // Last 7 days: Collectibles 5 vs Art 3.5 (the 40-day-old sale is out).
    assert.deepEqual(
      week.body.categories.map((c) => [c.category, c.volume]),
      [
        ['Collectibles', 5],
        ['Art', 3.5],
      ]
    );
  });
});

describe('GET /api/stats', () => {
  it('counts listings, artists who have listed, and sales', async () => {
    await seedMarket();

    const res = await request(app).get('/api/stats');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { nfts: 4, creators: 2, sales: 4, volume: 12.5 });
  });

  it('is all zeros on an empty marketplace', async () => {
    const res = await request(app).get('/api/stats');
    assert.deepEqual(res.body, { nfts: 0, creators: 0, sales: 0, volume: 0 });
  });
});

describe('misc', () => {
  it('GET /api/health answers', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('unknown /api paths are a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.message, 'Endpoint not found');
  });
});
