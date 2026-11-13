const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  finder_id: { type: String, required: true }, // studentId of the person who posted
  image_url: { type: String, required: true },
  image_public_id: { type: String },           // used to delete the image from Cloudinary
  location_found: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, trim: true, maxlength: 200, default: '' }, // optional, public
  verification_question: { type: String, required: true },
  status: { type: String, enum: ['active', 'claim_pending', 'resolved'], default: 'active' }
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);