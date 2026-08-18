// =====================================================
// MIDDLEWARE/AUTHMIDDLEWARE.JS
// Protects routes by verifying the httpOnly token cookie.
// On success, attaches the logged-in user to req.user so
// any route handler after this knows who's making the request.
// =====================================================

const jwt = require('jsonwebtoken');
const User = require('../modules/user');

async function protect(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token found' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look the user up fresh from the database rather than trusting the
    // token's payload alone — covers cases like the account being deleted
    // after the token was issued.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    // Covers both an invalid signature (tampered token) and an expired token
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
}

module.exports = protect;