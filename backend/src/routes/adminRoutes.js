const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminMiddleware');

// Everything here needs a login AND the admin role
router.use(auth, adminOnly);

router.get('/reports', reportController.listReports);
router.post('/reports/:id/dismiss', reportController.dismissReport);
router.delete('/posts/:id', reportController.adminDeletePost);

module.exports = router;