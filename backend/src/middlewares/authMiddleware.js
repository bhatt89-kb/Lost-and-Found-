const jwt = require('jsonwebtoken');

const JWT_SECRET = require('../config/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Please log in first.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attaches { userId, studentId } to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};