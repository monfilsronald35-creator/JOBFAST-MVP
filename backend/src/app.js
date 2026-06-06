import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import crypto from 'crypto';

import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import jobRoutes from './routes/jobs.routes.js';
// Si sou GitHub li gen yon gwo "E", mete gwo "E" a nan app.js la tou:
import { notFoundHandler, errorHandler } from './middlewares/ErrorHandler.js';


const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN.includes('*') ? '*' : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(morgan(env.APP_STAGE === 'development' ? 'dev' : 'combined'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    app: env.APP_NAME,
    version: env.APP_VERSION,
  });
});

const API_PREFIX = env.API_PREFIX || '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
