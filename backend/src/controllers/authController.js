const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = require('../config/jwt');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const RESET_MINUTES = 60;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.register = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(studentId || '')) {
      return res.status(400).json({ error: 'Student ID must be 3-30 characters (letters, numbers, _ . -)' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const existingUser = await User.findOne({ $or: [{ studentId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Student ID or Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ studentId, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id, studentId: user.studentId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, studentId: user.studentId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(400).json({ error: 'Invalid Student ID or Password' });
    }

    // Accounts created with Google have no password
    if (!user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please use the Google button.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Student ID or Password' });
    }

    const token = jwt.sign({ userId: user._id, studentId: user.studentId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, studentId: user.studentId });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

    // Verify the token with Google (never trust the frontend alone)
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub, email, email_verified } = ticket.getPayload();

    if (!email_verified) {
      return res.status(400).json({ error: 'Google email is not verified' });
    }

    let user = await User.findOne({ $or: [{ googleId: sub }, { email: email.toLowerCase() }] });

    if (!user) {
      // Create a unique studentId from the email, e.g. kapil@gmail.com -> kapil, kapil1...
      const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
      let studentId = base;
      let n = 1;
      while (await User.exists({ studentId })) studentId = `${base}${n++}`;

      user = await User.create({ studentId, email, googleId: sub, authProvider: 'google' });
    } else if (!user.googleId) {
      user.googleId = sub; // link Google to an existing account with the same email
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, studentId: user.studentId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, studentId: user.studentId });
  } catch (error) {
    res.status(401).json({ error: 'Google sign-in failed', details: error.message });
  }
};

// Step 1: email a reset link. The reply is always the same, so nobody can use
// this to find out which emails have accounts.
exports.forgotPassword = async (req, res) => {
  const genericReply = { message: 'If an account exists for that email, a reset link has been sent.' };

  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = hashToken(token);
      user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
      await user.save();

      // Not awaited, so the reply time doesn't reveal whether the account exists
      sendEmail(
        user.email,
        'Reset your password - Campus Lost & Found',
        `Hi ${user.studentId},\n\nWe got a request to reset your password. Open this link to choose a new one (it works once and expires in ${RESET_MINUTES} minutes):\n\n${CLIENT_URL}/?reset=${token}\n\nIf you didn't ask for this, you can ignore this email. Your password won't change.\n\nCampus Lost & Found`
      ).catch(() => {});
    }

    res.status(200).json(genericReply);
  } catch (error) {
    res.status(500).json({ error: 'Could not process the request. Please try again.' });
  }
};

// Step 2: set the new password using the emailed token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;   // single use
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated. You can log in now.' });
  } catch (error) {
    res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
};
// Current user's basic info (Protected)
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('studentId role');
    if (!user) {
      return res.status(401).json({ error: 'Account not found' });
    }
    res.status(200).json({ studentId: user.studentId, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load account' });
  }
};