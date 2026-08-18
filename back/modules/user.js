// =====================================================
// MODELS/USER.JS
// Mongoose schema for a user account.
// Passwords are hashed automatically before saving —
// no route ever needs to remember to do this manually.
// =====================================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // excludes password from query results by default — you have to explicitly ask for it
      required: function () {
        return this.authProvider === 'local'; // only required for email/password accounts
      },
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
  },
  {
    timestamps: true, // automatically adds createdAt / updatedAt fields
  }
);

// ---------- Pre-save hook: hash the password automatically ----------
// This runs every time a document is about to be saved.
// We only hash if the password field was actually changed —
// otherwise, updating a user's email would re-hash an ALREADY-hashed
// password, breaking their ability to ever log in again.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const saltRounds = 10; // cost factor — higher = slower to hash AND slower to brute-force
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// ---------- Instance method: compare a plain password to the stored hash ----------
// Used during login — you can never "un-hash" a password, you can only
// hash the login attempt the same way and compare the two hashes.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);