# Frontend — NFT Marketplace

Static HTML/SCSS/vanilla JS frontend for the [NFT Marketplace](../README.md) project.
No build tool or framework — pages are plain `.html` files, styled with SCSS
compiled to `assets/css/`, and scripted with plain JS modules under `assets/js/`.

## Running locally

Serve this folder with any static server, e.g. from the repo root
`npx serve front -l 5501`, then open `http://127.0.0.1:5501/index.html`.
The backend must be running too (see [`../back/README.md`](../back/README.md)).

## Where the API is

[`assets/js/config.js`](assets/js/config.js) is loaded first on every page
and defines `API_BASE` and `apiFetch()`, which every other script uses:

- **Locally** (`localhost` / `127.0.0.1`): port 5000 on the *same hostname* as
  the page, so the `SameSite=Strict` auth cookie is sent back.
- **Production:** a relative `/api`, which Netlify proxies to the Render API
  (see [`../netlify.toml`](../netlify.toml)), so the cookie stays first-party.
- `apiFetch()` retries read-only requests while the free-tier server wakes up,
  and shows a short "waking up" note.

## Editing styles

Source styles live in `assets/scss/` and compile to `assets/css/main.css`.
Run the compiler in watch mode from the repo root (the browser only ever
loads the compiled CSS, so without it `.scss` edits do nothing):

```bash
npx sass --watch front/assets/scss/main.scss:front/assets/css/main.css --style=expanded --no-source-map
```

```
assets/scss/
├── abstracts/    # variables, mixins, resets, base, fonts, loader
├── components/   # buttons, modal, page loader, rocket-button, subscribe form
├── layout/       # header, footer, hero, nav, per-section styles
└── pages/        # home, profile, register
```

## Pages

| Page | File | Notes |
|---|---|---|
| Homepage | `index.html` | Hero stats + featured NFT, Top Categories, Top Creators, Browse Categories, Discover More, Spotlight — all from the API |
| Register | `register.html` | Email/password + Google sign-in |
| Login | `login.html` | Email/password + Google sign-in |
| Profile | `profile.html` | Requires being logged in |
| Marketplace | `marketplace.html` | Search, category filter (`#category=Art` pre-selects one), "Load more" — all against `GET /api/nfts` |
| NFT detail | `nft.html` | Reached via `#id=<mongoId>` from any NFT card |
| Artist | `artist.html` | Reached via `#id=<mongoId>`; Created/Owned tabs |
| Connect Wallet | `connect-wallet.html` | UI only — clicking a provider explains there's no Web3 integration |
| Rankings | `rankings.html` | Top Creators leaderboard from `GET /api/rankings`; period tabs re-query the server; `#period=all` opens a tab |
