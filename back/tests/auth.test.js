const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { app, useTestDatabase, createUser, getAuthCookie } = require('./helpers');

useTestDatabase();

const NEW_USER = { username: 'alice', email: 'alice@test.local', password: 'Password123!' };

describe('POST /api/auth/register', () => {
  it('creates the account and sets an httpOnly, SameSite=Strict auth cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(NEW_USER);

    assert.equal(res.status, 201);
    assert.equal(res.body.user.username, 'alice');
    assert.equal(res.body.user.email, 'alice@test.local');
    assert.equal(res.body.user.password, undefined, 'password hash must never be returned');

    const cookie = getAuthCookie(res);
    assert.ok(cookie, 'expected a token cookie');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@test.local' });
    assert.equal(res.status, 400);
  });

  it('rejects a duplicate email or username with 409', async () => {
    await request(app).post('/api/auth/register').send(NEW_USER).expect(201);

    const sameEmail = await request(app)
      .post('/api/auth/register')
      .send({ ...NEW_USER, username: 'alice2' });
    assert.equal(sameEmail.status, 409);

    const sameUsername = await request(app)
      .post('/api/auth/register')
      .send({ ...NEW_USER, email: 'other@test.local' });
    assert.equal(sameUsername.status, 409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    await createUser({ username: 'bob', email: 'bob@test.local', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.local', password: 'Password123!' });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.username, 'bob');
    assert.ok(getAuthCookie(res));
  });

  it('gives the same 401 message for a wrong password and an unknown email', async () => {
    await createUser({ email: 'bob@test.local', password: 'Password123!' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@test.local', password: 'nope-nope' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: 'Password123!' });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    // Different messages would tell an attacker which emails are registered.
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
    assert.equal(getAuthCookie(wrongPassword), undefined);
  });
});

describe('session: /me, logout, change-password', () => {
  it('GET /api/auth/me is 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('GET /api/auth/me is 401 with a forged token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not-a-real-jwt');
    assert.equal(res.status, 401);
  });

  it('keeps the session across requests, then logout clears it', async () => {
    const agent = request.agent(app); // stores cookies like a browser would

    await agent.post('/api/auth/register').send(NEW_USER).expect(201);

    const me = await agent.get('/api/auth/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.user.username, 'alice');

    const logout = await agent.post('/api/auth/logout');
    assert.equal(logout.status, 200);

    const afterLogout = await agent.get('/api/auth/me');
    assert.equal(afterLogout.status, 401);
  });

  it('changes the password only when the current one is correct', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(NEW_USER).expect(201);

    const wrong = await agent
      .put('/api/auth/change-password')
      .send({ currentPassword: 'wrong-password', newPassword: 'NewPassword456!' });
    assert.equal(wrong.status, 401);

    const tooShort = await agent
      .put('/api/auth/change-password')
      .send({ currentPassword: NEW_USER.password, newPassword: 'short' });
    assert.equal(tooShort.status, 400);

    await agent
      .put('/api/auth/change-password')
      .send({ currentPassword: NEW_USER.password, newPassword: 'NewPassword456!' })
      .expect(200);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_USER.email, password: NEW_USER.password });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_USER.email, password: 'NewPassword456!' });
    assert.equal(newLogin.status, 200);
  });
});
