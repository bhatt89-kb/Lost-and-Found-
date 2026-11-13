const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  reporter_id: { type: String, required: true }, // studentId of the reporter
  reason: { type: String, enum: ['spam', 'inappropriate', 'misleading', 'other'], required: true },
  details: { type: String, trim: true, maxlength: 200, default: '' },
  status: { type: String, enum: ['open', 'dismissed'], default: 'open' },
}, { timestamps: true });

// One report per person per post
reportSchema.index({ post_id: 1, reporter_id: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);