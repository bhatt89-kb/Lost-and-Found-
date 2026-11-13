const Post = require('../models/Post');
const Claim = require('../models/Claim');
const Report = require('../models/Report');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { deleteImage } = require('../utils/cloudinary');

const REASONS = ['spam', 'inappropriate', 'misleading', 'other'];

// Report a post (Protected)
exports.createReport = async (req, res) => {
  try {
    const reason = (req.body.reason || '').trim();
    const details = (req.body.details || '').trim();

    if (!REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Please choose a reason' });
    }
    if (details.length > 200) {
      return res.status(400).json({ error: 'Details are too long (max 200 characters)' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.finder_id === req.user.studentId) {
      return res.status(400).json({ error: "You can't report your own post" });
    }

    await Report.create({
      post_id: post._id,
      reporter_id: req.user.studentId,
      reason,
      details,
    });

    res.status(201).json({ message: 'Report submitted' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You already reported this post' });
    }
    res.status(500).json({ error: 'Failed to submit report', details: error.message });
  }
};

// All open reports, with the post each one is about (Admin)
exports.listReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'open' })
      .populate('post_id', 'image_url location_found category description finder_id createdAt')
      .sort({ createdAt: -1 });

    // Skip reports whose post no longer exists
    res.status(200).json(reports.filter((r) => r.post_id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
};

// Dismiss a report: the post stays up (Admin)
exports.dismissReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { status: 'dismissed' });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.status(200).json({ message: 'Report dismissed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dismiss report', details: error.message });
  }
};

// Remove a reported post, its photo, claims and reports (Admin)
exports.adminDeletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.image_public_id) {
      await deleteImage(post.image_public_id).catch(() => {});
    }
    await Claim.deleteMany({ post_id: post._id });
    await Report.deleteMany({ post_id: post._id });
    await Post.deleteOne({ _id: post._id });

    // Tell the finder (not awaited; a failed email must not undo the removal)
    User.findOne({ studentId: post.finder_id })
      .then((finder) => {
        if (finder && finder.email) {
          return sendEmail(
            finder.email,
            'Your post was removed - Campus Lost & Found',
            `Hi ${finder.studentId},\n\nYour ${post.category} post (found at ${post.location_found}) was removed by a moderator after it was reported.\n\nCampus Lost & Found`
          );
        }
        return null;
      })
      .catch(() => {});

    res.status(200).json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove post', details: error.message });
  }
};