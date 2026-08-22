// =====================================================
// CONTROLLERS/USER.CONTROLLER.JS
// Public user profile lookups — for the Artist Page, which needs to
// look up a creator by id even for artists who have zero NFTs yet
// (an edge case /api/nfts?creator=<id> alone can't cover).
// =====================================================

const User = require('../modules/user');

// Fields safe to expose publicly — never email, never password.
const PUBLIC_FIELDS = 'username avatarUrl bio createdAt';

// GET /api/users/:id
// Public.
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select(PUBLIC_FIELDS);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    // Malformed ObjectId (CastError) collapses to the same 404 as "doesn't
    // exist" — from the client's perspective there's no useful difference.
    console.error('Get user error:', err.message);
    res.status(404).json({ message: 'User not found' });
  }
}

module.exports = { getUserById };
