// =====================================================
// CONTROLLERS/AUTHCONTROLLER.JS
// Business logic for registering and logging in users.
// =====================================================

const User = require('../modules/user');
const generateToken = require('../utils/generatetoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Sets the JWT as an httpOnly cookie — invisible to JavaScript, sent
// automatically by the browser on every request to this API.
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true, // can't be read via document.cookie — protects against XSS token theft
    secure: process.env.NODE_ENV === 'production', // requires HTTPS in production; localhost dev over http is fine
    sameSite: 'strict', // browser won't send this cookie on cross-site requests — protects against CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matching the JWT's own expiresIn
  });
}


// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are all required' });
    }

    // Check for an existing user with the same email OR username,
    // so we can give a clear error instead of a confusing database crash
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with that email or username already exists' });
    }

    // Password gets hashed automatically by the pre-save hook in User.js —
    // this line never touches the plain-text password directly
    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);
    setAuthCookie(res, token);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Something went wrong during registration' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // .select('+password') is required here because the schema excludes
    // password from query results by default (select: false in User.js)
    const user = await User.findOne({ email }).select('+password');

    // Deliberately vague error message — "email not found" vs "wrong password"
    // as SEPARATE messages tells an attacker which emails are registered.
    // One generic message protects against that.
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Something went wrong during login' });
  }
}


// POST /api/auth/google
// Frontend sends the ID token Google's script produced after the user
// signs in with their Google account. We verify it server-side —
// never trust a token like this without checking it against Google directly.
async function googleAuth(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // First time this Google account has signed in — create an account.
      // Username is derived from their name plus a random suffix, since
      // usernames must be unique and we can't ask them to pick one mid-flow.
      const baseUsername = name.replace(/\s+/g, '').toLowerCase();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);

      user = await User.create({
        username: `${baseUsername}${randomSuffix}`,
        email,
        authProvider: 'google',
      });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Logged in with Google successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ message: 'Google authentication failed' });
  }
}


// GET /api/auth/me — protected route. If this succeeds, the person is logged in.
// This is how the FRONTEND checks login status — it can't read the httpOnly
// cookie directly, so it asks the backend instead.
function getMe(req, res) {
  // req.user was attached by the protect middleware
  res.status(200).json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
    },
  });
}
 
// POST /api/auth/logout
function logout(req, res) {
  // clearCookie options MUST match what was used in setAuthCookie (path,
  // httpOnly, sameSite, secure) — mismatched options are a common reason
  // "logout" silently fails to actually remove the cookie in some browsers.
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
 
  res.status(200).json({ message: 'Logged out successfully' });
}
 



// PUT /api/auth/change-password — protected route
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
 
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are both required' });
    }
 
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
 
    // req.user (from the middleware) never has the password field (select: false) —
    // fetch it again here, explicitly including it, so we can verify the current one
    const user = await User.findById(req.user._id).select('+password');
 
    if (user.authProvider !== 'local') {
      return res.status(400).json({
        message: `This account signed up with ${user.authProvider}. Password changes aren't available for that sign-in method.`,
      });
    }
 
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
 
    // Assigning triggers isModified('password') in the pre-save hook,
    // so it gets re-hashed automatically — no manual bcrypt call needed here
    user.password = newPassword;
    await user.save();
 
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Something went wrong while changing your password' });
  }
}
 
module.exports = { register, login, googleAuth, getMe, logout, changePassword };