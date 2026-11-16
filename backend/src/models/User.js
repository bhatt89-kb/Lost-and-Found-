const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },            //google account get empty 
  googleId: { type: String },    // google id get recruted
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },  // authentication get verified 
  role: { type: String, enum: ['user', 'admin'], default: 'user' },  //role is divided into 2 parts and both gets different options 
  fullName: { type: String, trim: true, maxlength: 60, default: '' },
  branch: { type: String, trim: true, maxlength: 60, default: '' },
  year: { type: String, trim: true, maxlength: 30, default: '' },
  resetTokenHash: { type: String },
  resetTokenExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);