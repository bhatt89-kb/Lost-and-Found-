const User = require('../models/User');

// Use AFTER the normal auth middleware
module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Could not verify admin access' });
  }
};