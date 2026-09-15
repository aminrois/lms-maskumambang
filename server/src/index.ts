import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { deduplicateLessonPlans } from './scripts/cleanDuplicateLessonPlans';
import { syncLessonPlansWithJadwal } from './scripts/syncLessonPlansWithJadwal';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // handled by frontend
  })
);

// Gzip/Brotli compression — skip if already compressed
app.use(
  compression({
    level: 6,
    threshold: 1024, // only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// HTTP request logging
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// CORS
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? '*' : [CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: NODE_ENV });
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 LMS Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 API Endpoints available at http://localhost:${PORT}/api/v1`);
  console.log(`🌍 Environment: ${NODE_ENV}`);

  // Run initial cleanup for duplicates and schedule sync in background
  (async () => {
    try {
      await deduplicateLessonPlans();
      await syncLessonPlansWithJadwal();
    } catch (err) {
      console.error('Initial lesson plan sync error:', err);
    }
  })();
});

// Graceful Shutdown
const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

