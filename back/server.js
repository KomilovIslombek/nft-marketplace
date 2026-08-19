require('dotenv').config()


const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

connectDB(); // Connect to mongoDB before anything else

app.use(cors({
    origin: process.env.FRONTEND_URL,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`)
})