const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app, useTestDatabase, createUser, createNft } = require('./helpers');

useTestDatabase();

// Logs a user in through the real API and returns a cookie-keeping agent.
async function loggedInAgent(user) {
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123!' })
    .expect(200);
  return agent;
}

describe('GET /api/nfts — list, search, filter, paginate', () => {
  it('returns newest first with pagination info', async () => {
    const artist = await createUser();
    for (let i = 1; i <= 5; i += 1) {
      await createNft(artist, { title: `Piece ${i}`, createdAt: new Date(2026, 0, i) });
    }

    const res = await request(app).get('/api/nfts?limit=2&page=1');

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.nfts.map((n) => n.title),
      ['Piece 5', 'Piece 4']
    );
    assert.deepEqual(res.body.pagination, { page: 1, limit: 2, total: 5, totalPages: 3 });

    const lastPage = await request(app).get('/api/nfts?limit=2&page=3');
    assert.deepEqual(
      lastPage.body.nfts.map((n) => n.title),
      ['Piece 1']
    );
  });

  it('searches titles case-insensitively', async () => {
    const artist = await createUser();
    await createNft(artist, { title: 'Magic Mushroom 0325' });
    await createNft(artist, { title: 'Happy Robot 032' });

    const res = await request(app).get('/api/nfts?search=MUSHROOM');

    assert.deepEqual(
      res.body.nfts.map((n) => n.title),
      ['Magic Mushroom 0325']
    );
  });

  it('treats regex characters in the search as plain text', async () => {
    const artist = await createUser();
    await createNft(artist, { title: 'Happy Robot' });
    await createNft(artist, { title: 'Price (a+b)' });

    // Unescaped, ".*" would match every title.
    const wildcard = await request(app).get(`/api/nfts?search=${encodeURIComponent('.*')}`);
    assert.equal(wildcard.status, 200);
    assert.equal(wildcard.body.nfts.length, 0);

    const literal = await request(app).get(`/api/nfts?search=${encodeURIComponent('(a+b)')}`);
    assert.deepEqual(
      literal.body.nfts.map((n) => n.title),
      ['Price (a+b)']
    );
  });

  it('filters by category and by creator', async () => {
    const alice = await createUser();
    const bob = await createUser();
    await createNft(alice, { title: 'Alice Art', category: 'Art' });
    await createNft(alice, { title: 'Alice Music', category: 'Music' });
    await createNft(bob, { title: 'Bob Art', category: 'Art' });

    const art = await request(app).get('/api/nfts?category=Art');
    assert.deepEqual(art.body.nfts.map((n) => n.title).sort(), ['Alice Art', 'Bob Art']);

    const byAlice = await request(app).get(`/api/nfts?creator=${alice._id}`);
    assert.deepEqual(byAlice.body.nfts.map((n) => n.title).sort(), ['Alice Art', 'Alice Music']);
  });

  it('only exposes public creator fields', async () => {
    const artist = await createUser({ username: 'shroomie' });
    await createNft(artist);

    const res = await request(app).get('/api/nfts');
    const { creator } = res.body.nfts[0];

    assert.equal(creator.username, 'shroomie');
    assert.equal(creator.email, undefined);
    assert.equal(creator.password, undefined);
  });
});

describe('GET /api/nfts/:id', () => {
  it('returns one NFT', async () => {
    const artist = await createUser();
    const nft = await createNft(artist, { title: 'The One' });

    const res = await request(app).get(`/api/nfts/${nft._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.nft.title, 'The One');
  });

  it('is a 404 for both a malformed and an unknown id', async () => {
    const malformed = await request(app).get('/api/nfts/not-an-id');
    const unknown = await request(app).get('/api/nfts/507f1f77bcf86cd799439011');
    assert.equal(malformed.status, 404);
    assert.equal(unknown.status, 404);
  });
});

describe('POST / PUT / DELETE /api/nfts — ownership rules', () => {
  const NEW_NFT = { title: 'Fresh Mint', imageUrl: '/x.png', category: 'Art', price: 2 };

  it('requires login to create', async () => {
    const res = await request(app).post('/api/nfts').send(NEW_NFT);
    assert.equal(res.status, 401);
  });

  it('creates a listing where creator and owner are the logged-in user', async () => {
    const user = await createUser();
    const agent = await loggedInAgent(user);

    const res = await agent.post('/api/nfts').send(NEW_NFT);

    assert.equal(res.status, 201);
    assert.equal(String(res.body.nft.creator), String(user._id));
    assert.equal(String(res.body.nft.owner), String(user._id));
  });

  it('rejects an invalid category with 400', async () => {
    const agent = await loggedInAgent(await createUser());
    const res = await agent.post('/api/nfts').send({ ...NEW_NFT, category: 'Memes' });
    assert.equal(res.status, 400);
  });

  it('lets only the current owner edit or delete', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const nft = await createNft(owner, { title: 'Mine' });

    const strangerAgent = await loggedInAgent(stranger);
    assert.equal((await strangerAgent.put(`/api/nfts/${nft._id}`).send({ price: 0 })).status, 403);
    assert.equal((await strangerAgent.delete(`/api/nfts/${nft._id}`)).status, 403);

    const ownerAgent = await loggedInAgent(owner);
    const updated = await ownerAgent.put(`/api/nfts/${nft._id}`).send({ price: 9 });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.nft.price, 9);

    assert.equal((await ownerAgent.delete(`/api/nfts/${nft._id}`)).status, 200);
    assert.equal((await request(app).get(`/api/nfts/${nft._id}`)).status, 404);
  });
});
