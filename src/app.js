
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const { errorHandler } = require('./middlewares/errorHandler');
const scoringJob = require('./jobs/scoringJob');

// Import routes
const authRoutes = require('./routes/authRoutes');
const learnerRoutes = require('./routes/learnerRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const nudgeRoutes = require('./routes/nudgeRoutes');
const outcomeRoutes = require('./routes/outcomeRoutes');

const app = express();

// Connect to database
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/learners', learnerRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/nudges', nudgeRoutes);
app.use('/api/outcomes', outcomeRoutes);

// Error handling (always last)
app.use(errorHandler);

// Start scheduled jobs
scoringJob.start();

module.exports = app;