# Backend — NFT Marketplace API

Express + MongoDB REST API for the [NFT Marketplace](../README.md) project.
Covers authentication (register/login/Google OAuth/session), NFT listing CRUD,
and the sale history that the creator rankings are aggregated from.

## Quick start

```bash
npm install
cp .env.example .env   # fill in your own values
npm run dev             # nodemon, http://localhost:5000
npm run seed            # optional — demo creators, 18 NFTs, and generated sale history
```

See the [root README](../README.md#environment-variables) for what each
`.env` variable does, and [root README → API reference](../README.md#api-reference)
for the current endpoint list.

## Structure

- `config/db.js` — MongoDB connection
- `modules/user.js` — Mongoose `User` schema (hashes passwords automatically on save)
- `modules/nft.js` — Mongoose `Nft` schema. Stores both `creator` and `owner` as separate
  refs to `User`. They start out the same person and diverge once the NFT sells, which is
  what makes Profile's and the Artist page's "Created" vs "Owned" tabs show different data.
- `modules/sale.js` — Mongoose `Sale` schema: one completed transaction (`nft`, `seller`,
  `buyer`, `price`, `soldAt`). Immutable once written — a reversal is a new sale in the
  other direction, not an edit. This is the event that moves `owner`, and every volume
  figure on the Rankings page is a sum over these documents.
- `middleware/auth.middleware.js` — verifies the JWT cookie on protected routes
- `controllers/auth.controller.js`, `controllers/nft.controller.js`,
  `controllers/user.controller.js`, `controllers/ranking.controller.js` — route handlers
- `routes/auth.routes.js` (`/api/auth`), `routes/nft.routes.js` (`/api/nfts`),
  `routes/user.routes.js` (`/api/users`), `routes/ranking.routes.js` (`/api/rankings`)
- `utils/generatetoken.js` — signs JWTs
- `utils/seed.js` — idempotent demo data seeder (`npm run seed`); only ever touches its own
  demo users/NFTs/sales, never real data

Auth uses an `httpOnly` cookie (not `localStorage`/headers) so the token is
never exposed to frontend JavaScript — see the comments in
`auth.controller.js` for the reasoning behind each cookie flag.

## How rankings are calculated

`GET /api/rankings` aggregates `Sale` documents, not `Nft` documents.

- A sale is credited to the **creator of the NFT**, not to whoever sold it. A secondary
  sale still counts toward the original artist's volume — that's what makes it a "Top
  Creators" board rather than a "most active traders" board.
- `?period=7d|30d|90d|all` filters on `soldAt`. For a bounded period the API also
  aggregates the immediately preceding window of equal length, so `changePercent`
  compares like with like (last 30 days vs the 30 before it).
- `changePercent` is `null` in two distinct cases, and the UI must tell them apart via
  `previousVolume`: `previousVolume === null` means the period was `all` and there is no
  previous window (rendered `—`); `previousVolume === 0` means the creator had no sales
  last period, so a percentage would be a division by zero (rendered `New`).

## Seeded demo history

`npm run seed` generates the sale history rather than hard-coding it, but does so from a
**fixed random seed** (`RANDOM_SEED` in `utils/seed.js`), so every run produces the exact
same data. That matters: without it, re-seeding reshuffles the leaderboard and any
screenshot or doc referring to it immediately goes stale.

Two details in there are easy to trip over if you change the script:

- NFT listing dates are backdated across the last 25–150 days and inserted with
  `insertMany(docs, { timestamps: false })`. Without that option Mongoose's timestamp
  plugin overwrites `createdAt` with the current time, and every date-windowed query
  collapses to returning the same thing for every window.
- Sales are cleared **before** the NFTs they reference. Delete the NFTs first and you
  leave orphaned `Sale` documents pointing at ids that no longer exist; the rankings
  aggregation then silently drops them at `$unwind` and volumes quietly come out short.
