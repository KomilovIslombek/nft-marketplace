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
│   │   └── nft.controller.js   # NFT listing CRUD
│   ├── middleware/
│   │   └── auth.middleware.js  # verifies the JWT cookie, attaches req.user
│   ├── modules/
│   │   ├── user.js             # Mongoose User schema (password hashing hook)
│   │   └── nft.js              # Mongoose Nft schema (creator + owner refs to User)
│   ├── routes/
│   │   ├── auth.routes.js      # /api/auth/* routes
│   │   └── nft.routes.js       # /api/nfts/* routes
│   ├── utils/
│   │   ├── generatetoken.js    # signs JWTs
│   │   └── seed.js             # populates demo creators + NFTs — `npm run seed`
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
    └── profile.html
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
- ✅ Marketplace page (`marketplace.html`) — search, NFTs/Collections tabs, NFT grid (currently hardcoded HTML; matching backend data now exists, wiring it up is next)
- ✅ Backend NFT API — list (paginated + category filter), get one, create/update/delete (owner-only), seed script

**Planned next (see [Roadmap](#roadmap)):**
- ⬜ Wire `marketplace.html` up to `GET /api/nfts` instead of hardcoded cards
- ⬜ Artist Page, NFT detail page, Rankings, Connect Wallet
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
| GET | `/nfts` | No | List NFTs. Query params: `category`, `creator`, `owner`, `page`, `limit` (default 12) |
| GET | `/nfts/:id` | No | Get one NFT |
| POST | `/nfts` | Yes | Create an NFT listing (creator + owner = you) |
| PUT | `/nfts/:id` | Yes | Update an NFT (current owner only) |
| DELETE | `/nfts/:id` | Yes | Delete an NFT (current owner only) |

## Roadmap

- [x] NFT data model + CRUD API
- [ ] Wire the Marketplace page to the real API instead of hardcoded cards
- [ ] Artist profile pages
- [ ] NFT detail page
- [ ] Wallet connect flow
- [ ] Rankings page
- [ ] Deploy backend + frontend to production
- [ ] Tests (backend integration tests at minimum)

---

## License

MIT — see [LICENSE](LICENSE).
