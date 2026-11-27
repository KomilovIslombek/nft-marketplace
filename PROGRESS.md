# Progress

## Current step

**Live.** https://komilov-nft-marketplace.netlify.app runs end to end:
Netlify (frontend, linked to GitHub `main`) → `/api` proxy → Render
service `komilov-nft-api-6bjd` (Blueprint `nft-marketplace`, auto-deploys
on push) → Atlas database `nft-marketplace-prod`. Nothing is blocked.
Optional next: the possible-later items below, or an uptime ping.

## Roadmap

| Step | Status |
|---|---|
| Pages: Homepage, Auth, Profile, Marketplace, NFT, Artist, Rankings, Connect Wallet | ✅ done |
| Backend: auth, NFT CRUD, users, Sale model, rankings | ✅ done |
| Homepage on real data (stats, Top Categories, Spotlight, footer) | ✅ done 2026-11-26 |
| Backend integration tests + CI | ✅ done 2026-11-26 |
| Production config (netlify.toml, render.yaml, config.js, CORS) + deploy guide | ✅ done 2026-11-26 |
| Push to GitHub | ✅ done 2026-11-26 |
| Netlify project + first frontend deploy | ✅ done 2026-11-26 |
| Atlas prod DB + seed, Render API, Google OAuth origin | ✅ done 2026-11-27 |
| Netlify linked to GitHub (auto-deploy on push) | ✅ done 2026-11-27 |
| Live link in the README | ✅ done 2026-11-27 |
| Live link in the owner's portfolio / freelance profiles | ⬜ owner |

Possible later: a create-listing form, a buy flow that writes `Sale`
documents, rate limiting on auth.

## Decisions

Full reasoning in [docs/DECISIONS.md](docs/DECISIONS.md).

- "Trending Collection" → **Top Categories** and "Auction" → **Spotlight**
  (most traded NFT), both aggregated from existing `Sale` data. No
  Collection or Auction model. (2026-11-26)
- Hosting: Netlify (static + `/api` proxy) + Render free + Atlas M0. The
  proxy keeps the SameSite=Strict cookie first-party. (2026-11-26)
- Live URL: the free Netlify subdomain `komilov-nft-marketplace.netlify.app`.
  The owner's own domain (islomkomilov.uz) is not to be touched for this
  project. Render service name `komilov-nft-api` (Render made it
  `komilov-nft-api-6bjd`), because `nft-marketplace-api` on onrender.com
  belongs to someone else. (2026-11-26)
- Production DB `nft-marketplace-prod` on the existing Atlas cluster, using
  the same database user as development (fine for a portfolio demo; a
  separate prod-only user is a possible hardening step). The prod URI lives
  locally in the gitignored `back/.env.production.local`. (2026-11-27)
- Tests: node:test + supertest + mongodb-memory-server. (2026-11-26)
- Seeded demo creators get random passwords, because the repo is public. (2026-11-26)
- Newsletter forms stay but say they aren't connected; the Marketplace
  "Collections" tab and the footer's dead social icons were removed. (2026-11-26)

## Open questions

- Keep the Render service awake with an uptime ping (one service fits the
  750 free hours), or accept a ~1 min cold start?

## Done

- 2026-11-27: live. Render Blueprint created (komilov-nft-api-6bjd), prod DB
  seeded, Netlify proxy pointed at it, Google OAuth origin added, Netlify
  linked to GitHub. Checked live: all pages 200, /api/health, stats,
  trending, rankings (7d/30d populated), search, category filter,
  /auth/me 401 for guests, CORS rejects foreign origins.

- 2026-11-26: homepage fake sections replaced with real data; one API config
  (`config.js`) with cold-start retries; 35 backend integration tests + GitHub
  Actions; Netlify/Render/Atlas production setup verified locally behind a
  Netlify-style proxy; footer template text removed; README, deploy guide,
  decisions doc, screenshots. Pushed to GitHub.
- Aug 2026: Rankings API + page, Sale model, Connect Wallet, Artist page, NFT
  page, Marketplace on the API, NFT model + CRUD, auth incl. Google.
