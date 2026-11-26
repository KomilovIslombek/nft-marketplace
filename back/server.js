// =====================================================
// SERVER.JS
// Entry point: loads .env, connects to MongoDB, starts listening.
// Everything about *what* the API does lives in app.js — this file
// only decides *where* it runs.
// =====================================================

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  // Connect first: an API that is listening but has no database would
  // answer every request with a 500. connectDB exits the process on
  // failure, so on Render a bad MONGODB_URI shows up as a failed deploy.
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
  });
}

start();
