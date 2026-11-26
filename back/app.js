// =====================================================
// APP.JS
// Builds and exports the Express app — routes, CORS, cookies, JSON —
// without connecting to a database or opening a port.
//
// Why this is separate from server.js: the integration tests need the
// exact same app the real server runs, but pointed at a throwaway
// in-memory MongoDB and driven by supertest instead of a real port.
// If building the app and starting it lived in one file, requiring it
// from a test would also connect to the real database and call listen().
// =====================================================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// In development, the frontend can end up on a few different local ports
// depending on how it's being served (VS Code's Live Server defaults to
// 5500, our own docs/scripts use 5501, etc.) — so instead of locking CORS
// to a single exact FRONTEND_URL, allow any 127.0.0.1/localhost origin on
// a known dev port.
const DEV_ORIGIN_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost):(5500|5501|5502|3000)$/;

// Production locks CORS to an explicit allowlist. FRONTEND_URL may hold
// several comma-separated origins (e.g. the netlify.app address and a
// custom domain pointing at the same site).
function productionOrigins() {
  return (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

const isProduction = process.env.NODE_ENV === 'production';

// Behind Render's load balancer (and Netlify's proxy in front of that),
// the request reaching Express is plain HTTP from a proxy. Trusting the
// first proxy hop makes req.secure / req.ip reflect the real visitor.
if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header at all (curl, server-to-server, Postman) — allow it.
      if (!origin) return callback(null, true);

      const isAllowed = isProduction
        ? productionOrigins().includes(origin)
        : DEV_ORIGIN_PATTERN.test(origin);

      // Pass `false` (not an Error) for a disallowed origin — the cors
      // package then just omits the Access-Control-Allow-Origin header,
      // which is all a browser needs to block the response. Passing an
      // Error here instead would surface as a noisy 500 to any caller,
      // browser or not, for what is normal, expected rejection behavior.
      callback(null, isAllowed);
    },
    credentials: true,
  })
);

app.use(cookieParser()); // lets req.cookies read the incoming httpOnly token cookie
app.use(express.json());

// ---------- Routes ----------
// Simple health check — confirms the server is alive and responding.
// Render's health check and any uptime pinger hit this path.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NFT Marketplace API is running' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/nfts', require('./routes/nft.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/rankings', require('./routes/ranking.routes'));
app.use('/api/trending', require('./routes/trending.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

// Unknown /api path — answer in JSON like every other endpoint instead of
// Express's default HTML "Cannot GET" page.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

module.exports = app;
