require('dotenv').config()


const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

connectDB(); // Connect to mongoDB before anything else

// In development, the frontend can end up on a few different local ports
// depending on how it's being served (VS Code's Live Server defaults to
// 5500, our own docs/scripts use 5501, etc.) — so instead of locking CORS
// to a single exact FRONTEND_URL, allow any 127.0.0.1/localhost origin on
// a known dev port. Production still locks to exactly FRONTEND_URL, since
// there's no ambiguity about what the real deployed frontend's origin is.
const DEV_ORIGIN_PATTERN = /^https?:\/\/(127\.0\.0\.1|localhost):(5500|5501|5502|3000)$/;

app.use(cors({
    origin(origin, callback) {
        // No Origin header at all (curl, server-to-server, Postman) — allow it.
        if (!origin) return callback(null, true);

        const isAllowed =
            process.env.NODE_ENV !== 'production'
                ? DEV_ORIGIN_PATTERN.test(origin)
                : origin === process.env.FRONTEND_URL;

        // Pass `false` (not an Error) for a disallowed origin — the cors
        // package then just omits the Access-Control-Allow-Origin header,
        // which is all a browser needs to block the response. Passing an
        // Error here instead would surface as a noisy 500 to any caller,
        // browser or not, for what is normal, expected rejection behavior.
        callback(null, isAllowed);
    },
    credentials: true,
}))

app.use(cookieParser()); // lets req.cookies read the incoming httpOnly token cookie
app.use(express.json())

// ---------- Routes ----------
// Simple health check — confirms the server is alive and responding
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NFT Marketplace API is running' });
});

app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/nfts', require('./routes/nft.routes'))
app.use('/api/users', require('./routes/user.routes'))
app.use('/api/rankings', require('./routes/ranking.routes'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`)
})