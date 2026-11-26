# Progress

## Current step

**Go live: the backend is left.** The frontend is deployed at
https://komilov-nft-marketplace.netlify.app (Netlify project
`komilov-nft-marketplace`). The API doesn't exist yet, so data sections
show "couldn't load". Next: the owner follows
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) steps 1–3 and 5 (Atlas → seed →
Render Blueprint → FRONTEND_URL + Google origin), and links the GitHub repo
in Netlify for auto-deploys.

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
| Atlas + seed + Render API + Google OAuth origin | ⬜ owner, per docs/DEPLOYMENT.md |
| Link the GitHub repo in Netlify (auto-deploy on push) | ⬜ owner, one click |
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
- Live URL: the free Netlify subdomain `komilov-nft-marketplace.netlify.app`.
  The owner's own domain (islomkomilov.uz) is not to be touched for this
  project. Render service name `komilov-nft-api`, because `nft-marketplace-api`
  on onrender.com belongs to someone else. (2026-11-26)
- Tests: node:test + supertest + mongodb-memory-server. (2026-11-26)
- Seeded demo creators get random passwords, because the repo is public. (2026-11-26)
- Newsletter forms stay but say they aren't connected; the Marketplace
  "Collections" tab and the footer's dead social icons were removed. (2026-11-26)

## Open questions

- Keep the Render service awake with an uptime ping (one service fits the
  750 free hours), or accept a ~1 min cold start?

## Done

- 2026-11-26: homepage fake sections replaced with real data; one API config
  (`config.js`) with cold-start retries; 35 backend integration tests + GitHub
  Actions; Netlify/Render/Atlas production setup verified locally behind a
  Netlify-style proxy; footer template text removed; README, deploy guide,
  decisions doc, screenshots. Pushed to GitHub.
- Aug 2026: Rankings API + page, Sale model, Connect Wallet, Artist page, NFT
  page, Marketplace on the API, NFT model + CRUD, auth incl. Google.
