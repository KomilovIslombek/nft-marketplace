// =====================================================
// UTILS/GENERATETOKEN.JS
// Creates a signed JWT containing the user's ID.
// This token is what the frontend stores and sends back
// on every future request to prove "I'm already logged in."
// =====================================================

const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign(
    { id: userId }, // payload — kept minimal on purpose, just enough to look the user up later
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // token stops being valid after 7 days — user has to log in again
  );
}

module.exports = generateToken;