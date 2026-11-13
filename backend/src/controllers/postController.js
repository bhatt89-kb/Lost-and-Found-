const Post = require('../models/Post');
const Claim = require('../models/Claim');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const CATEGORIES = ['Electronics', 'Keys', 'ID Cards', 'Clothing', 'Other'];

// Escape special characters so a search like "(" can't break the regex
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create a new found-item post (Protected)
exports.createPost = async (req, res) => {
  try {
    const location_found = (req.body.location_found || '').trim();
    const category = (req.body.category || '').trim();
    const description = (req.body.description || '').trim();
    const verification_question = (req.body.verification_question || '').trim();

    if (!location_found || !category || !verification_question) {
      return res.status(400).json({ error: 'Location, category and verification question are required' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (location_found.length > 100) {
      return res.status(400).json({ error: 'Location is too long (max 100 characters)' });
    }
    if (description.length > 200) {
      return res.status(400).json({ error: 'Description is too long (max 200 characters)' });
    }
    if (verification_question.length > 200) {
      return res.status(400).json({ error: 'Verification question is too long (max 200 characters)' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a photo of the item' });
    }

    // finder_id always comes from the verified login token, never from the request body
    const finder_id = req.user.studentId;

    const result = await uploadImage(req.file.buffer);

    const newPost = new Post({
      finder_id,
      image_url: result.secure_url,
      image_public_id: result.public_id,
      location_found,
      category,
      description,
      verification_question,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post', details: error.message });
  }
};

// Fetch posts, one page at a time (Public)
exports.getAllPosts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

    const query = { status: { $in: ['active', 'claim_pending'] } };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const safe = escapeRegex(search.trim().slice(0, 50));
      query.$or = [
        { location_found: { $regex: safe, $options: 'i' } },
        { verification_question: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    res.status(200).json({ posts, total, page, hasMore: page * limit < total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts', details: error.message });
  }
};

// My posts, with the number of pending claims on each (Protected)
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ finder_id: req.user.studentId })
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Claim.aggregate([
      { $match: { post_id: { $in: posts.map((p) => p._id) }, status: 'pending' } },
      { $group: { _id: '$post_id', n: { $sum: 1 } } },
    ]);
    const byPost = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

    res.status(200).json(posts.map((p) => ({ ...p, pendingClaims: byPost[String(p._id)] || 0 })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your posts', details: error.message });
  }
};

// Delete a post by ID (Protected & Owner Verified)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only the person who posted it can delete it
    if (post.finder_id !== req.user.studentId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own posts' });
    }

    // Remove the image from Cloudinary too (ignore errors so the post still gets deleted)
    if (post.image_public_id) {
      await deleteImage(post.image_public_id).catch(() => {});
    }

    await Post.findByIdAndDelete(id);
    await Claim.deleteMany({ post_id: id }); // don't leave orphaned claims behind

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post', details: error.message });
  }
};