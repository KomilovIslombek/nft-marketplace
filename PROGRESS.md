# Progress

## Current step

**Go live.** The code is ready for production and committed locally, but
not pushed and not deployed. Next: the owner pushes to GitHub, then
follows [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (Atlas → seed → Render →
Netlify → connect them), then replaces the "Live demo" placeholder in
README.md with the real URL.

## Roadmap

| Step | Status |
|---|---|
| Pages: Homepage, Auth, Profile, Marketplace, NFT, Artist, Rankings, Connect Wallet | ✅ done |
| Backend: auth, NFT CRUD, users, Sale model, rankings | ✅ done |
| Homepage on real data (stats, Top Categories, Spotlight, footer) | ✅ done 2026-11-26 |
| Backend integration tests + CI | ✅ done 2026-11-26 |
| Production config (netlify.toml, render.yaml, config.js, CORS) + deploy guide | ✅ done 2026-11-26 |
| Push to GitHub | ⬜ needs the owner's OK |
| Create accounts and deploy (Atlas, Render, Netlify, Google OAuth origin) | ⬜ owner, per docs/DEPLOYMENT.md |
| Put the live link in the README and the portfolio | ⬜ after deploy |

Possible later: a create-listing form, a buy flow that writes `Sale`
documents, rate limiting on auth.

## Decisions

Full reasoning in [docs/DECISIONS.md](docs/DECISIONS.md).

- "Trending Collection" → **Top Categories** and "Auction" → **Spotlight**
  (most traded NFT), both aggregated from existing `Sale` data. No
  Collection or Auction model. (2026-11-26)
- Hosting: Netlify (static + `/api` proxy) + Render free + Atlas M0. The
  proxy keeps the SameSite=Strict cookie first-party. (2026-11-26)
- Tests: node:test + supertest + mongodb-memory-server. (2026-11-26)
- Seeded demo creators get random passwords, because the repo is public. (2026-11-26)
- Newsletter forms stay but say they aren't connected; the Marketplace
  "Collections" tab and the footer's dead social icons were removed. (2026-11-26)

## Open questions

- Custom domain? If yes, add it to `FRONTEND_URL` (comma-separated) and to
  the Google OAuth origins.
- Keep the Render service awake with an uptime ping (one service fits the
  750 free hours), or accept a ~1 min cold start?

## Done

- 2026-11-26: homepage fake sections replaced with real data; one API config
  (`config.js`) with cold-start retries; 35 backend integration tests + GitHub
  Actions; Netlify/Render/Atlas production setup verified locally behind a
  Netlify-style proxy; footer template text removed; README, deploy guide,
  decisions doc, screenshots.
- Aug 2026: Rankings API + page, Sale model, Connect Wallet, Artist page, NFT
  page, Marketplace on the API, NFT model + CRUD, auth incl. Google.
