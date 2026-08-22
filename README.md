# NFT Marketplace

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-stack NFT marketplace built from scratch — vanilla HTML/SCSS/JS on the
frontend, a Node.js/Express REST API on the backend, MongoDB for storage, and
JWT-based authentication (including Google OAuth). This is a personal
portfolio project, built and documented the way a production app would be.

**Design reference:** the full UI (Homepage, Marketplace, Artist Page, NFT
Page, Rankings, Connect Wallet, Create Account) is specced in Figma —
[NFT Marketplace mockup](https://www.figma.com/design/rZrfOdLveTRirGv5bMojpp/NFT-Marketplace--Copy---Copy---Copy-).
The sections below reflect what's actually implemented so far vs. what's planned.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Status: what's built vs. planned](#status-whats-built-vs-planned)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Roadmap](#roadmap)

---

## Tech stack

**Frontend**
- Static HTML5 pages, no framework/bundler
- SCSS (compiled to CSS via the VS Code "Live Sass Compile" extension)
- Vanilla JavaScript (ES6+, `fetch` API, no build step)
- Served locally with VS Code Live Server (port `5501`)

**Backend**
- Node.js + [Express 5](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- Authentication: JWT stored in an `httpOnly` cookie (email/password + Google OAuth via `google-auth-library`)
- Passwords hashed with `bcrypt`

## Project structure

```
nft-marketplace/
├── back/                       # Express REST API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js  # register / login / Google OAuth / me / logout
│   │   ├── nft.controller.js   # NFT listing CRUD
│   │   ├── user.controller.js  # public profile lookup (GET /api/users/:id)
│   │   └── ranking.controller.js # creator leaderboard aggregated from Sale docs
│   ├── middleware/
│   │   └── auth.middleware.js  # verifies the JWT cookie, attaches req.user
│   ├── modules/
│   │   ├── user.js             # Mongoose User schema (password hashing hook)
│   │   ├── nft.js              # Mongoose Nft schema (creator + owner refs to User)
│   │   └── sale.js             # Mongoose Sale schema (one completed transaction)
│   ├── routes/
│   │   ├── auth.routes.js      # /api/auth/* routes
│   │   ├── nft.routes.js       # /api/nfts/* routes
│   │   ├── user.routes.js      # /api/users/* routes
│   │   └── ranking.routes.js   # /api/rankings routes
│   ├── utils/
│   │   ├── generatetoken.js    # signs JWTs
│   │   └── seed.js             # demo creators + NFTs + generated sale history — `npm run seed`
│   ├── .env.example            # template for your local .env
│   └── server.js                # app entrypoint
│
└── front/                      # Static frontend
    ├── assets/
    │   ├── css/                # compiled output (generated from scss/)
    │   ├── scss/                # source styles (abstracts / components / layout / pages)
    │   ├── js/                  # page scripts + shared layout/auth logic
    │   ├── images/, icons/, sounds/
    │   └── templates/           # standalone HTML partials (banner, scroll-to-top button)
    ├── index.html               # Homepage
    ├── login.html
    ├── register.html
    ├── profile.html
    ├── marketplace.html         # Browse/search/filter all NFTs
    ├── nft.html                 # Single NFT detail — reached via #id=<mongoId>
    ├── artist.html               # Creator profile — reached via #id=<mongoId>
    ├── connect-wallet.html       # Wallet provider picker (honestly non-functional)
    └── rankings.html             # Top Creators leaderboard — period tabs re-query the API
```

## Status: what's built vs. planned

The Figma mockup defines 7 page types (each with desktop/tablet/mobile
variants): **Homepage, Create Account, Artist Page, NFT Page, Connect
Wallet, Marketplace, Rankings**.

**Implemented so far:**
- ✅ Homepage (`index.html`) — hero, trending collections, top artists, categories, "how it works," newsletter, footer
- ✅ Register / Login (`register.html`, `login.html`) — email+password and "Sign in with Google"
- ✅ Profile page (`profile.html`) — shown when authenticated
- ✅ Backend auth API — register, login, Google OAuth, session check (`/me`), logout, change password
- ✅ Auth state synced across pages via an `httpOnly` JWT cookie (nav switches between guest/logged-in automatically)
- ✅ Marketplace page (`marketplace.html`) — fully wired to the live API: search (debounced + on submit), category filter chips, "Load more" pagination, loading/empty/error states
- ✅ Backend NFT API — list (search + category filter + pagination), get one, create/update/delete (owner-only), seed script
- ✅ CORS accepts common local dev ports automatically (5500/5501/5502/3000) — no manual config needed whichever way the frontend is being served
- ✅ NFT detail page (`nft.html`) — hero image, artist info, description, category, price/highest-bid, and a real "more from this artist" grid. Reached by clicking any Marketplace card.
- ✅ Artist Page (`artist.html`) — profile with real stats (NFTs Created, NFTs Owned, listed value), bio, and Created/Owned tabs backed by the real API. Reached by clicking a creator's name on the NFT detail page.
- ✅ Backend: `GET /api/users/:id` — public profile lookup (username/avatarUrl/bio only, never email/password)
- ✅ Sale/transaction model (`Sale`) — the first thing in the app that can move an NFT's `owner`. Ownership now genuinely diverges from authorship, which is what makes the "Created" vs "Owned" tabs on Profile/Artist show different data instead of two identical grids.
- ✅ Backend: `GET /api/rankings` — creator leaderboard aggregated from real `Sale` documents: volume, NFTs sold, and period-over-period change across `7d`/`30d`/`90d`/`all` windows
- ✅ Rankings page (`rankings.html`) — Top Creators leaderboard with `7d`/`30d`/`90d`/`all` period tabs. Each tab is a separate query against a different `soldAt` window, not a client-side re-sort. The Change column distinguishes "no comparable previous period" (`—`) from "no sales last period" (`New`) rather than collapsing both into a fake 0%.
- ✅ Connect Wallet page (`connect-wallet.html`) — three provider options (MetaMask, WalletConnect, Coinbase Wallet). Real, clickable UI, but honestly non-functional: clicking one opens a modal that plainly says there's no real Web3/wallet integration, rather than silently doing nothing or faking a connection.

**Known gaps (by design, not bugs):**
- "Collections" tab on Marketplace is a visual-only stub — no collections feature exists yet (see Roadmap)
- No live bidding — the NFT detail page shows real price/highest-bid but the "Place Bid" button is honestly disabled rather than pretending to work
- No wallet address, "Follow" button, or social links on the Artist Page — none of that has real data behind it yet, so it's omitted rather than faked
- No real wallet/Web3 integration — Connect Wallet is UI only, explained above
- No buy/checkout flow, so **no sale is ever created by a user action**. The `Sale` model and the rankings aggregation that reads it are real code paths; the transactions currently in the database were generated by `npm run seed` from a fixed random seed. Demo content, real mechanism.
- The homepage "Top Creators" section is still hardcoded HTML with placeholder avatars and a repeated "34.53 ETH". It now has a real endpoint to read from (`GET /api/rankings`) but hasn't been wired up to it yet.

**Planned next (see [Roadmap](#roadmap)):**
- ⬜ Wiring the homepage "Top Creators" section to the rankings API
- ⬜ Deployment to production

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB)
- A [Google OAuth client ID](https://console.cloud.google.com/apis/credentials) if you want "Sign in with Google" to work
- The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and [Live Sass Compile](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) VS Code extensions (or any static file server + Sass watcher you prefer)

### 1. Backend

```bash
cd back
npm install
cp .env.example .env   # then fill in your own values — see below
npm run dev             # starts on http://localhost:5000 with nodemon
```

### 2. Frontend

Open `front/` in VS Code and start it with Live Server (or any static
server) on port `5501` so it matches `FRONTEND_URL` in your `.env`:

```bash
# any static server works, e.g.:
npx serve front -l 5501
```

Then visit `http://127.0.0.1:5501/index.html`.

> The frontend and backend run as two separate local servers — CORS is
> configured on the backend (`FRONTEND_URL`) to allow requests between them.

## Environment variables

All required variables are documented in [`back/.env.example`](back/.env.example):

| Variable | Description |
|---|---|
| `MONGODB_URI` | Full MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console, for "Sign in with Google" |
| `FRONTEND_URL` | Origin allowed by CORS (your local frontend URL) |
| `NODE_ENV` | `development` or `production` — controls cookie `secure` flag |
| `PORT` | API server port (defaults to `5000`) |

## API reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/register` | No | Create an account (username, email, password) |
| POST | `/auth/login` | No | Log in with email + password |
| POST | `/auth/google` | No | Log in / sign up with a Google ID token |
| GET | `/auth/me` | Yes | Get the current logged-in user |
| POST | `/auth/logout` | No | Clear the auth cookie |
| PUT | `/auth/change-password` | Yes | Change password (local accounts only) |
| GET | `/nfts` | No | List NFTs. Query params: `search`, `category`, `creator`, `owner`, `page`, `limit` (default 12) |
| GET | `/nfts/:id` | No | Get one NFT |
| POST | `/nfts` | Yes | Create an NFT listing (creator + owner = you) |
| PUT | `/nfts/:id` | Yes | Update an NFT (current owner only) |
| DELETE | `/nfts/:id` | Yes | Delete an NFT (current owner only) |
| GET | `/users/:id` | No | Public profile (username, avatarUrl, bio) — never email or password |
| GET | `/rankings` | No | Creator leaderboard by sales volume. Query params: `period` (`7d`/`30d`/`90d`/`all`, default `30d`), `limit` (default 20, max 50) |

## Roadmap

- [x] NFT data model + CRUD API
- [x] Wire the Marketplace page to the real API instead of hardcoded cards
- [x] NFT detail page
- [x] Artist profile pages
- [x] Wallet connect flow (UI only — no real Web3 integration)
- [x] Sale/transaction model + creator rankings API (`GET /api/rankings`)
- [x] Rankings page (frontend)
- [ ] Wire the homepage "Top Creators" section to `GET /api/rankings`
- [ ] Deploy backend + frontend to production
- [ ] Tests (backend integration tests at minimum)

---

## License

MIT — see [LICENSE](LICENSE).
