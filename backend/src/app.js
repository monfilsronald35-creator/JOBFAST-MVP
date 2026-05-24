import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import crypto from 'crypto';

import { env } from '../config/env.js';

import authRoutes from '../routes/auth.routes.js';
import userRoutes from '../routes/users.routes.js';
import jobRoutes from '../routes/jobs.routes.js';

import { errorHandler, notFoundHandler } from '../middlewares/errorHandler.js';

const app = express();

// ================= SECURITY =================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ================= CORS (FIXED) =================

app.use(
  cors({
    origin: env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// ================= PERFORMANCE =================

app.use(compression());

// ================= BODY =================

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ================= REQUEST ID =================

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// ================= LOGGING =================

app.use(morgan(env.APP_STAGE === 'development' ? 'dev' : 'combined'));

// ================= HEALTH =================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
  });
});

// ================= RATE LIMIT (IMPORTANT) =================
// (optional middleware placeholder)
// app.use(rateLimiter);

// ================= ROUTES =================

const API_PREFIX = env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);

// ================= ERROR HANDLING =================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;