const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  claimant_id: { type: String, required: true },
  verification_answer: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// One claim per person per post (blocks duplicates even if two requests arrive together)
claimSchema.index({ post_id: 1, claimant_id: 1 }, { unique: true });

module.exports = mongoose.model('Claim', claimSchema);