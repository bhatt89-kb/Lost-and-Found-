const Claim = require('../models/Claim');
const Post = require('../models/Post');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { deleteImage } = require('../utils/cloudinary');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Email a student by their studentId. Never throws: a failed email must not break the request.
const notifyUser = async (studentId, subject, text) => {
  try {
    const user = await User.findOne({ studentId });
    if (user && user.email) {
      await sendEmail(user.email, subject, text);
    }
  } catch (error) {
    console.error('Notification failed:', error.message);
  }
};

// Submit a claim answer (Protected)
exports.submitClaim = async (req, res) => {
  try {
    const { post_id, verification_answer } = req.body;
    const claimant_id = req.user.studentId;

    if (!verification_answer || !verification_answer.trim()) {
      return res.status(400).json({ error: 'Please answer the verification question' });
    }

    const post = await Post.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Can't claim your own post
    if (post.finder_id === claimant_id) {
      return res.status(400).json({ error: "You can't claim an item you posted" });
    }

    // Only one pending claim at a time
    if (post.status !== 'active') {
      return res.status(400).json({ error: 'This item already has a pending claim' });
    }

    // No duplicate claims by the same person
    const alreadyClaimed = await Claim.findOne({ post_id, claimant_id });
    if (alreadyClaimed) {
      return res.status(400).json({ error: 'You have already claimed this item' });
    }

    const newClaim = await Claim.create({ post_id, claimant_id, verification_answer });

    post.status = 'claim_pending';
    await post.save();

    // Tell the finder (not awaited, so the claimant gets a fast response).
    // The answer itself is not included in the email.
    notifyUser(
      post.finder_id,
      'Someone claimed your found item - Campus Lost & Found',
      `Hi ${post.finder_id},\n\nSomeone has submitted a claim for the ${post.category} you found at ${post.location_found}.\n\nLog in to review their answer to your verification question:\n${CLIENT_URL}\n\nCampus Lost & Found`
    );

    res.status(201).json({ message: 'Claim submitted successfully', claim: newClaim });
  } catch (error) {
    // Unique index caught a duplicate that slipped past the check above
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already claimed this item' });
    }
    res.status(500).json({ error: 'Failed to submit claim', details: error.message });
  }
};

// Confirm Handover, Send Email, and Purge Post (Protected & Finder Verified)
exports.resolveHandover = async (req, res) => {
  try {
    const { claim_id, is_verified, dropoff_location } = req.body;
    const claim = await Claim.findById(claim_id);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const post = await Post.findById(claim.post_id);
    if (!post) {
      return res.status(404).json({ error: 'Associated post not found' });
    }

    // Only the original finder can verify claims
    if (post.finder_id !== req.user.studentId) {
      return res.status(403).json({ error: 'Unauthorized: Only the item finder can confirm handovers' });
    }

    // A claim can only be resolved once
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: 'This claim was already resolved' });
    }

    if (is_verified) {
      if (!dropoff_location || !dropoff_location.trim()) {
        return res.status(400).json({ error: 'Please enter a pickup location' });
      }

      claim.status = 'approved';
      await claim.save();

      notifyUser(
        claim.claimant_id,
        'Asset Verified & Ready for Pickup - Campus Lost & Found',
        `Good news!\n\nYour lost item has been verified by the finder.\n\nPlease pick it up at: ${dropoff_location}\n\nStay Secure,\nCampus Lost & Found System`
      );

      // Remove the image from Cloudinary, then purge post and claims
      if (post.image_public_id) {
        await deleteImage(post.image_public_id).catch(() => {});
      }
      await Post.findByIdAndDelete(post._id);
      await Claim.deleteMany({ post_id: post._id });

      return res.status(200).json({
        message: 'Handover confirmed! Email sent and post purged.',
        dropoff_location,
      });
    } else {
      claim.status = 'rejected';
      await claim.save();

      // Reopen the post so others can claim it
      post.status = 'active';
      await post.save();

      notifyUser(
        claim.claimant_id,
        'Your claim was not approved - Campus Lost & Found',
        `Hi ${claim.claimant_id},\n\nThe finder could not verify your answer for the ${post.category} found at ${post.location_found}, so your claim was not approved.\n\nYou won't be able to submit another claim for this item.\n\nCampus Lost & Found`
      );

      return res.status(200).json({ message: 'Claim rejected. Post reset to active status.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve handover', details: error.message });
  }
};

// Fetch claims for a post (Protected, finder only)
exports.getClaimsByPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.finder_id !== req.user.studentId) {
      return res.status(403).json({ error: 'Only the finder can view claims' });
    }

    const claims = await Claim.find({ post_id: post._id });
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims', details: error.message });
  }
};

// My claims, with the post each one is about (Protected)
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant_id: req.user.studentId })
      .populate('post_id', 'image_url location_found category status createdAt verification_question')
      .sort({ createdAt: -1 });

    // Skip claims whose post no longer exists
    res.status(200).json(claims.filter((c) => c.post_id));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your claims', details: error.message });
  }
};

// Withdraw my own pending claim (Protected)
exports.withdrawClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    if (claim.claimant_id !== req.user.studentId) {
      return res.status(403).json({ error: 'You can only withdraw your own claims' });
    }
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending claims can be withdrawn' });
    }

    await claim.deleteOne();

    // Reopen the post if nobody else is waiting on it
    const stillPending = await Claim.exists({ post_id: claim.post_id, status: 'pending' });
    if (!stillPending) {
      await Post.updateOne({ _id: claim.post_id, status: 'claim_pending' }, { status: 'active' });
    }

    res.status(200).json({ message: 'Claim withdrawn' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to withdraw claim', details: error.message });
  }
};

// How many pending claims are waiting on my posts (Protected)
exports.getPendingCount = async (req, res) => {
  try {
    const myPosts = await Post.find({ finder_id: req.user.studentId }).select('_id');
    const count = await Claim.countDocuments({
      post_id: { $in: myPosts.map((p) => p._id) },
      status: 'pending',
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending count', details: error.message });
  }
};