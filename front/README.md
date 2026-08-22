# Frontend — NFT Marketplace

Static HTML/SCSS/vanilla JS frontend for the [NFT Marketplace](../README.md) project.
No build tool or framework — pages are plain `.html` files, styled with SCSS
compiled to `assets/css/`, and scripted with plain JS modules under `assets/js/`.

## Running locally

Serve this folder on port `5501` (matching the backend's `FRONTEND_URL`):

- **VS Code:** open this folder and use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, configured for port `5501` (see `.vscode/settings.json`)
- **Or any static server:** `npx serve . -l 5501`

Then open `index.html`. The backend must also be running (see
[`../back/README.md`](../back/README.md)) for login/register/profile to work.

## Editing styles

Source styles live in `assets/scss/` and compile to `assets/css/main.css`.
If you're using the [Live Sass Compile](https://marketplace.visualstudio.com/items?itemName=glenn2223.live-sass) VS Code extension, it picks up the
config in `.vscode/settings.json` automatically — just edit any `.scss`
file and save.

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
| Homepage | `index.html` | Hero, trending collections, top artists, categories, newsletter |
| Register | `register.html` | Email/password + Google sign-in |
| Login | `login.html` | Email/password + Google sign-in |
| Profile | `profile.html` | Requires being logged in |
| Marketplace | `marketplace.html` | Search, category filter, "Load more" — all against `GET /api/nfts` |
| NFT detail | `nft.html` | Reached via `#id=<mongoId>` from any NFT card |
| Artist | `artist.html` | Reached via `#id=<mongoId>`; Created/Owned tabs |
| Connect Wallet | `connect-wallet.html` | UI only — clicking a provider explains there's no Web3 integration |
| Rankings | `rankings.html` | Top Creators leaderboard from `GET /api/rankings`; period tabs re-query the server |
