const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app, useTestDatabase, createUser, createNft, createSale } = require('./helpers');

useTestDatabase();

describe('GET /api/rankings', () => {
  it('credits every sale — including resales — to the NFT creator', async () => {
    const creator = await createUser({ username: 'creator' });
    const flipper = await createUser({ username: 'flipper' });
    const buyer = await createUser({ username: 'buyer' });
    const nft = await createNft(creator);

    await createSale(nft, { seller: creator, buyer: flipper, price: 1, daysAgo: 3 });
    await createSale(nft, { seller: flipper, buyer, price: 2.5, daysAgo: 1 });

    const res = await request(app).get('/api/rankings?period=all');

    assert.equal(res.status, 200);
    assert.equal(res.body.rankings.length, 1, 'the flipper sold too, but is not a creator');
    const [row] = res.body.rankings;
    assert.equal(row.creator.username, 'creator');
    assert.equal(row.volume, 3.5);
    assert.equal(row.nftsSold, 2);
  });

  it('orders by volume and only counts sales inside the period', async () => {
    const big = await createUser({ username: 'big' });
    const small = await createUser({ username: 'small' });
    const buyer = await createUser();
    const bigNft = await createNft(big);
    const smallNft = await createNft(small);

    await createSale(bigNft, { seller: big, buyer, price: 5, daysAgo: 2 });
    await createSale(smallNft, { seller: small, buyer, price: 1, daysAgo: 2 });
    await createSale(smallNft, { seller: buyer, buyer: small, price: 10, daysAgo: 20 }); // outside 7d

    const week = await request(app).get('/api/rankings?period=7d');
    assert.deepEqual(
      week.body.rankings.map((r) => [r.creator.username, r.volume]),
      [
        ['big', 5],
        ['small', 1],
      ]
    );

    const month = await request(app).get('/api/rankings?period=30d');
    assert.deepEqual(
      month.body.rankings.map((r) => [r.creator.username, r.volume]),
      [
        ['small', 11],
        ['big', 5],
      ]
    );
  });

  it('compares against the previous window, and says "new" instead of dividing by zero', async () => {
    const steady = await createUser({ username: 'steady' });
    const newcomer = await createUser({ username: 'newcomer' });
    const buyer = await createUser();
    const steadyNft = await createNft(steady);
    const newNft = await createNft(newcomer);

    await createSale(steadyNft, { seller: steady, buyer, price: 2, daysAgo: 10 }); // previous 7d window
    await createSale(steadyNft, { seller: buyer, buyer: steady, price: 3, daysAgo: 2 }); // current window
    await createSale(newNft, { seller: newcomer, buyer, price: 1, daysAgo: 1 });

    const res = await request(app).get('/api/rankings?period=7d');
    const byName = Object.fromEntries(res.body.rankings.map((r) => [r.creator.username, r]));

    assert.equal(byName.steady.previousVolume, 2);
    assert.equal(byName.steady.changePercent, 50); // 2 -> 3 is +50%

    assert.equal(byName.newcomer.previousVolume, 0);
    assert.equal(byName.newcomer.changePercent, null);
  });

  it('has no previous window for "all", reported as null rather than 0', async () => {
    const artist = await createUser();
    const buyer = await createUser();
    await createSale(await createNft(artist), { seller: artist, buyer, price: 1 });

    const res = await request(app).get('/api/rankings?period=all');
    assert.equal(res.body.since, null);
    assert.equal(res.body.rankings[0].previousVolume, null);
    assert.equal(res.body.rankings[0].changePercent, null);
  });

  it('falls back to 30d for an unknown period and caps the limit', async () => {
    const res = await request(app).get('/api/rankings?period=forever&limit=9999');
    assert.equal(res.status, 200);
    assert.equal(res.body.period, '30d');
  });

  it('rounds float drift out of the volume', async () => {
    const artist = await createUser();
    const buyer = await createUser();
    const nft = await createNft(artist);
    for (let i = 0; i < 3; i += 1) {
      await createSale(nft, { seller: artist, buyer, price: 1.63 }); // 4.890000000000001 unrounded
    }

    const res = await request(app).get('/api/rankings?period=all');
    assert.equal(res.body.rankings[0].volume, 4.89);
  });
});
