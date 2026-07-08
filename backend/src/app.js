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
import notificationRoutes from './routes/notifications.routes.js';
import searchRoutes from './routes/search.routes.js';
import workersRoutes from './routes/workers.routes.js';
import companyRoutes from './routes/company.routes.js';
import enterpriseRoutes from './routes/enterprise.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import locationRoutes    from './routes/location.routes.js';
import reputationRoutes  from './routes/reputation.routes.js';
import adminRoutes       from './routes/admin.routes.js';
import walletRoutes      from './routes/wallet.routes.js';
import paymentRoutes     from './routes/payment.routes.js';
import escrowRoutes      from './routes/escrow.routes.js';
import payoutRoutes      from './routes/payout.routes.js';

// ✅ CHEMEN KORÈK LA: Nou retire "/middlewares" paske fichye a nan menm nivo ak app.js
import { notFoundHandler, errorHandler } from './ErrorHandler.js';

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

const API_PREFIX = env.API_PREFIX || '/api/v1';

const healthHandler = (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    app: env.APP_NAME,
    version: env.APP_VERSION,
  });
};

app.get('/health', healthHandler);
app.get(`${API_PREFIX}/health`, healthHandler);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/workers`, workersRoutes);
app.use(`${API_PREFIX}/company`, companyRoutes);
app.use(`${API_PREFIX}/enterprise`, enterpriseRoutes);
app.use(`${API_PREFIX}/marketplace`, marketplaceRoutes);
app.use(`${API_PREFIX}/location`,    locationRoutes);
app.use(`${API_PREFIX}/reputation`,  reputationRoutes);
app.use(`${API_PREFIX}/admin`,      adminRoutes);
app.use(`${API_PREFIX}/wallet`,     walletRoutes);
app.use(`${API_PREFIX}/payments`,   paymentRoutes);
app.use(`${API_PREFIX}/escrow`,     escrowRoutes);
app.use(`${API_PREFIX}/payouts`,    payoutRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
