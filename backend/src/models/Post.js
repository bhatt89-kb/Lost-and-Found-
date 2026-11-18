const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  finder_id: { type: String, required: true }, // studentId of the person who posted

  // NEW: just ONE word naming the object (e.g. "Wallet", "Earbuds"). No photo, no long description.
  item_name: { type: String, trim: true, maxlength: 20, default: '' },

  // NEW: where the item is right now, so the owner knows where to go
  custody: {
    type: String,
    enum: ['with_finder', 'security_office', 'left_in_place'],
    default: 'with_finder',
  },

  location_found: { type: String, required: true },
  category: { type: String, required: true },
  verification_question: { type: String, required: true },
  status: { type: String, enum: ['active', 'claim_pending', 'resolved'], default: 'active' },

  // Legacy fields: only old posts have these. They are no longer shown anywhere.
  image_url: { type: String, default: '' },
  image_public_id: { type: String },
  description: { type: String, trim: true, maxlength: 200, default: '' },
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);