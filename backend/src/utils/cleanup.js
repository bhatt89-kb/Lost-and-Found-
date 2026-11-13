const Post = require('../models/Post');
const Claim = require('../models/Claim');
const { deleteImage } = require('./cloudinary');

const EXPIRE_DAYS = parseInt(process.env.POST_EXPIRE_DAYS, 10) || 60;
const DAY_MS = 24 * 60 * 60 * 1000;

// Remove old, unclaimed posts together with their photos and claims
const cleanupExpiredPosts = async () => {
  try {
    const cutoff = new Date(Date.now() - EXPIRE_DAYS * DAY_MS);
    const expired = await Post.find({ status: 'active', createdAt: { $lt: cutoff } });

    for (const post of expired) {
      if (post.image_public_id) {
        await deleteImage(post.image_public_id).catch(() => {});
      }
      await Claim.deleteMany({ post_id: post._id });
      await Post.deleteOne({ _id: post._id });
    }

    if (expired.length > 0) {
      console.log(`[CLEANUP] Removed ${expired.length} expired post(s)`);
    }
  } catch (error) {
    console.error('[CLEANUP] Failed:', error.message);
  }
};

// Run once now, then every 24 hours
const startCleanupJob = () => {
  cleanupExpiredPosts();
  setInterval(cleanupExpiredPosts, DAY_MS);
};

module.exports = { startCleanupJob, cleanupExpiredPosts };