const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/authMiddleware');
const reportController = require('../controllers/reportController');

// Public route: Anyone can view active lost items
router.get('/', postController.getAllPosts);
router.get('/mine', auth, postController.getMyPosts);

// Protected routes: Require valid JWT token
router.post('/', auth, postController.createPost);
router.post('/:id/report', auth, reportController.createReport);
router.delete('/:id', auth, postController.deletePost);

module.exports = router;