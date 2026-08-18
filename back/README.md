# Backend — NFT Marketplace API

Express + MongoDB REST API for the [NFT Marketplace](../README.md) project.
Currently covers authentication only (register/login/Google OAuth/session).

## Quick start

```bash
npm install
cp .env.example .env   # fill in your own values
npm run dev             # nodemon, http://localhost:5000
```

See the [root README](../README.md#environment-variables) for what each
`.env` variable does, and [root README → API reference](../README.md#api-reference)
for the current endpoint list.

## Structure

- `config/db.js` — MongoDB connection
- `modules/user.js` — Mongoose `User` schema (hashes passwords automatically on save)
- `middleware/auth.middleware.js` — verifies the JWT cookie on protected routes
- `controllers/auth.controller.js` — route handlers
- `routes/auth.routes.js` — mounted at `/api/auth`
- `utils/generatetoken.js` — signs JWTs

Auth uses an `httpOnly` cookie (not `localStorage`/headers) so the token is
never exposed to frontend JavaScript — see the comments in
`auth.controller.js` for the reasoning behind each cookie flag.
