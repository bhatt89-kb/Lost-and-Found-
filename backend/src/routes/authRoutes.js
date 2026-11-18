const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Reset emails: 5 requests per hour per IP
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many reset requests. Please try again in an hour.' },
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);
router.post('/google', authController.googleLogin);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/profile', auth, authController.updateProfile); //profile
router.put('/avatar', auth, upload.single('avatar'), authController.uploadAvatar);
router.delete('/avatar', auth, authController.removeAvatar);

module.exports = router;