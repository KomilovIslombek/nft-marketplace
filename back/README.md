# Backend — NFT Marketplace API

Express + MongoDB REST API for the [NFT Marketplace](../README.md) project.
Covers authentication (register/login/Google OAuth/session) and NFT listing CRUD.

## Quick start

```bash
npm install
cp .env.example .env   # fill in your own values
npm run dev             # nodemon, http://localhost:5000
npm run seed            # optional — populates demo creators + 12 NFTs to develop against
```

See the [root README](../README.md#environment-variables) for what each
`.env` variable does, and [root README → API reference](../README.md#api-reference)
for the current endpoint list.

## Structure

- `config/db.js` — MongoDB connection
- `modules/user.js` — Mongoose `User` schema (hashes passwords automatically on save)
- `modules/nft.js` — Mongoose `Nft` schema. Stores both `creator` and `owner` as separate
  refs to `User` (they start out the same person, diverge on a future sale) — this is what
  will let Profile's "Created" vs "Owned" tabs query real, different data.
- `middleware/auth.middleware.js` — verifies the JWT cookie on protected routes
- `controllers/auth.controller.js`, `controllers/nft.controller.js` — route handlers
- `routes/auth.routes.js` (mounted at `/api/auth`), `routes/nft.routes.js` (mounted at `/api/nfts`)
- `utils/generatetoken.js` — signs JWTs
- `utils/seed.js` — idempotent demo data seeder (`npm run seed`); only ever touches its own demo users/NFTs, never real data

Auth uses an `httpOnly` cookie (not `localStorage`/headers) so the token is
never exposed to frontend JavaScript — see the comments in
`auth.controller.js` for the reasoning behind each cookie flag.

Auth uses an `httpOnly` cookie (not `localStorage`/headers) so the token is
never exposed to frontend JavaScript — see the comments in
`auth.controller.js` for the reasoning behind each cookie flag.
