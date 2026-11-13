require('dotenv').config(); // must stay first, so .env is loaded before the other files

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const { startCleanupJob } = require('./src/utils/cleanup');

const app = express();

// On hosts like Render the app sits behind a proxy. Without this, every visitor
// looks like the same IP and the rate limiter would block everyone together.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware (Crucial: Must be declared BEFORE routes)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lostandfound';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    startCleanupJob(); // remove expired posts (starts only once the database is connected)
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Rate limiting
// Login/register: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});
// Whole API: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "Campus Lost & Found API is running" });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image is too large (max 5 MB)' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));