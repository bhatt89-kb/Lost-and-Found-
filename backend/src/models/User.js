const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },                        // empty for Google accounts
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetTokenHash: { type: String },
  resetTokenExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);