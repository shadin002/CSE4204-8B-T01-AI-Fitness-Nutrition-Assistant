require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { success } = require('./utils/apiResponse');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const progressRoutes = require('./routes/progressRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, slow down.' },
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/', (req, res) =>
  success(res, 200, 'AI Fitness & Nutrition API is running', {
    status: 'ok',
    time: new Date().toISOString(),
  })
);

app.get('/api/health', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const payload = {
    success: dbReady,
    message: dbReady ? 'Ready' : 'Database unavailable',
    data: {
      uptime: process.uptime(),
      database: dbReady ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
    },
  };
  return res.status(dbReady ? 200 : 503).json(payload);
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

async function startServer() {
  await connectDB();
  server = app.listen(PORT, () =>
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  );
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(`Startup failed: ${err.message}`);
    process.exit(1);
  });
}

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  if (server) server.close(() => process.exit(1));
  else process.exit(1);
});

module.exports = app;