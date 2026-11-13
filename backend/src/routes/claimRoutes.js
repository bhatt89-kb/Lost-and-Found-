const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const auth = require('../middlewares/authMiddleware');

// All claim operations require JWT authentication
router.post('/', auth, claimController.submitClaim);
router.post('/resolve', auth, claimController.resolveHandover);
router.get('/mine', auth, claimController.getMyClaims);
router.get('/pending-count', auth, claimController.getPendingCount);
router.get('/post/:postId', auth, claimController.getClaimsByPost);
router.delete('/:id', auth, claimController.withdrawClaim);

module.exports = router;