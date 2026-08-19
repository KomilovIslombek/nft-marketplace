# Working on this project

## Always start the full dev environment automatically

Whenever VS Code is opened for this project (`code .` / `code <path>`),
immediately start everything needed to see changes live — **do not** ask
the user to run commands manually or tell them what to run themselves.
Run it yourself, then tell them what you started (one line per process is
enough, e.g. "Started: backend on :5000, frontend on :5501, sass watcher").

Required processes, all run in the background:

1. **Backend API** — `npm run dev` from `back/` (nodemon, port 5000, needs `back/.env` to exist)
2. **Frontend static server** — serves `front/` on port 5501, e.g. `npx serve front -l 5501`
3. **SCSS watcher** — `npx sass --watch front/assets/scss/main.scss:front/assets/css/main.css --style=expanded --no-source-map`
   run from the repo root. **This one is easy to forget and silently breaks
   everything** — SCSS files are never read directly by the browser; only
   `front/assets/css/main.css` is linked from the HTML. Without an active
   watcher, edits to any `.scss` file do nothing and it looks like "my
   changes aren't working" with no error anywhere.

Verify each is actually up (don't just assume the background command
started cleanly) — e.g. `curl http://127.0.0.1:5000/api/health` and check
the sass watcher's output for a compile confirmation — before telling the
user it's ready.

## The Live Sass Compile VS Code extension — known trap

`front/.vscode/settings.json` configures the Live Sass Compile extension
to save output to `front/assets/css/`. **That file only takes effect if
`front/` itself is the opened VS Code workspace root.** This project is
normally opened at the repo root (`nft-marketplace/`, so both `back/` and
`front/` show in the sidebar) — in that case `front/.vscode/settings.json`
is inert, and if the extension's "Watch Sass" is clicked, it falls back to
its default behavior: compiling `main.css`/`main.css.map` right next to
`main.scss` inside `front/assets/scss/`. This already happened once
(Aug 2026) and produced stray, wrong-location CSS files that had to be
deleted.

Root-level `.vscode/settings.json` now also declares the same
`liveSassCompile.settings.formats` (with a root-relative `savePath`) so
this can't happen again regardless of which folder is opened as root. If
stray `front/assets/scss/main.css` / `main.css.map` files ever reappear,
that's the symptom — delete them and prefer the CLI `sass --watch` process
over the editor extension.

## Stack quick reference

- **Backend**: Node/Express 5, MongoDB via Mongoose, JWT in an httpOnly
  cookie, Google OAuth. Entry point `back/server.js`. Full details: [back/README.md](back/README.md)
- **Frontend**: static HTML + SCSS + vanilla JS, no build tool/framework.
  Full details: [front/README.md](front/README.md)
- Project overview, tech stack, roadmap: [README.md](README.md)
