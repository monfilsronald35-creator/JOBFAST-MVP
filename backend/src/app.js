import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import crypto from 'crypto';

import { env } from './config/env.js';

// ── Core Layer ─────────────────────────────────────────────────────────────
import { gateway, rateLimiters } from './gateway/index.js';
import { logger } from './core/logger.js';
import { healthHandler, metricsHandler } from './core/monitoring.js';
import { notificationEngine } from './core/notificationEngine.js';
import { startBackgroundJobs } from './infrastructure/jobs.js';

// ── Existing Routes ────────────────────────────────────────────────────────
import authRoutes        from './routes/auth.routes.js';
import userRoutes        from './routes/users.routes.js';
import jobRoutes         from './routes/jobs.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import searchRoutes      from './routes/search.routes.js';
import workersRoutes     from './routes/workers.routes.js';
import companyRoutes     from './routes/company.routes.js';
import enterpriseRoutes  from './routes/enterprise.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import locationRoutes    from './routes/location.routes.js';
import reputationRoutes  from './routes/reputation.routes.js';
import adminRoutes       from './routes/admin.routes.js';
import walletRoutes      from './routes/wallet.routes.js';
import paymentRoutes     from './routes/payment.routes.js';
import escrowRoutes      from './routes/escrow.routes.js';
import payoutRoutes      from './routes/payout.routes.js';
import messageRoutes     from './routes/messages.routes.js';
import postRoutes        from './routes/posts.routes.js';
import bookingRoutes     from './routes/bookings.routes.js';
import pushRoutes        from './routes/push.routes.js';

// ── Feature Routes (New Verticals) ─────────────────────────────────────────
import hotelsRoutes      from './features/hotels/hotels.routes.js';
import restaurantsRoutes from './features/restaurants/restaurants.routes.js';
import transportRoutes   from './features/transport/transport.routes.js';
import hospitalsRoutes   from './features/hospitals/hospitals.routes.js';
import tourismRoutes     from './features/tourism/tourism.routes.js';
import educationRoutes   from './features/education/education.routes.js';
import eventsRoutes      from './features/events/events.routes.js';
import insuranceRoutes   from './features/insurance/insurance.routes.js';
import bankingRoutes     from './features/banking/banking.routes.js';
import storiesRoutes     from './features/stories/stories.routes.js';
import aiRoutes          from './features/ai/ai.routes.js';
import businessRoutes    from './routes/business.routes.js';
import socialRoutes      from './features/social/social.routes.js';

import { notFoundHandler, errorHandler } from './ErrorHandler.js';
import userRepo from './repositories/user.repository.js';

const app = express();

// ── Security Headers ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = env.CORS_ORIGIN;
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*')) return cb(null, origin);
    if (allowedOrigins.includes(origin)) return cb(null, origin);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-API-Version'],
}));

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID injection
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

app.use(morgan(env.APP_STAGE === 'development' ? 'dev' : 'combined'));

// ── Gateway Middleware (API prefix only) ───────────────────────────────────
const API_PREFIX = env.API_PREFIX || '/api/v1';
app.use(API_PREFIX, ...gateway());

// ── Health & Metrics (no auth, no rate limit) ──────────────────────────────
app.get('/health',                  healthHandler);
app.get(`${API_PREFIX}/health`,     healthHandler);
app.get(`${API_PREFIX}/metrics`,    metricsHandler);

// ── Existing Feature Routes ────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`,           rateLimiters.auth, authRoutes);
app.use(`${API_PREFIX}/users`,          userRoutes);
app.use(`${API_PREFIX}/jobs`,           jobRoutes);
app.use(`${API_PREFIX}/notifications`,  notificationRoutes);
app.use(`${API_PREFIX}/search`,         rateLimiters.search, searchRoutes);
app.use(`${API_PREFIX}/workers`,        workersRoutes);
app.use(`${API_PREFIX}/company`,        companyRoutes);
app.use(`${API_PREFIX}/enterprise`,     enterpriseRoutes);
app.use(`${API_PREFIX}/marketplace`,    marketplaceRoutes);
app.use(`${API_PREFIX}/location`,       locationRoutes);
app.use(`${API_PREFIX}/reputation`,     reputationRoutes);
app.use(`${API_PREFIX}/admin`,          adminRoutes);
app.use(`${API_PREFIX}/wallet`,         rateLimiters.financial, walletRoutes);
app.use(`${API_PREFIX}/payments`,       rateLimiters.financial, paymentRoutes);
app.use(`${API_PREFIX}/escrow`,         rateLimiters.financial, escrowRoutes);
app.use(`${API_PREFIX}/payouts`,        rateLimiters.financial, payoutRoutes);
app.use(`${API_PREFIX}/messages`,       messageRoutes);
app.use(`${API_PREFIX}/posts`,          postRoutes);
app.use(`${API_PREFIX}/bookings`,       bookingRoutes);
app.use(`${API_PREFIX}/push`,           pushRoutes);

// ── New Business Vertical Routes ──────────────────────────────────────────
app.use(`${API_PREFIX}/hotels`,         hotelsRoutes);
app.use(`${API_PREFIX}/restaurants`,    restaurantsRoutes);
app.use(`${API_PREFIX}/transport`,      transportRoutes);
app.use(`${API_PREFIX}/hospitals`,      hospitalsRoutes);
app.use(`${API_PREFIX}/tourism`,        tourismRoutes);
app.use(`${API_PREFIX}/education`,      educationRoutes);
app.use(`${API_PREFIX}/events`,         eventsRoutes);
app.use(`${API_PREFIX}/insurance`,      insuranceRoutes);
app.use(`${API_PREFIX}/banking`,        bankingRoutes);
app.use(`${API_PREFIX}/stories`,        storiesRoutes);

// ── AI Layer Routes ────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/ai`,             aiRoutes);

// ── Business / Company / Social ───────────────────────────────────────────
app.use(`${API_PREFIX}/business`,       businessRoutes);
app.use(`${API_PREFIX}/social`,         socialRoutes);

// ── Community Members (public feed) ───────────────────────────────────────
app.get(`${API_PREFIX}/community/members`, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const { users } = await userRepo.getUsers({ page: 1, limit });
    const members = users.map(u => ({
      id:                  u.id,
      name:                u.name,
      role:                u.role,
      profession:          u.profession,
      category:            u.category,
      city:                u.location?.city    || '',
      country:             u.location?.country || 'Haiti',
      photo:               u.profileMetadata?.profilePhoto || u.profilePhoto || null,
      yearsExperience:     u.profileMetadata?.yearsExperience || null,
      specialties:         u.profileMetadata?.specialties || [],
      rating:              u.stats?.rating || 5.0,
      profileCompleteness: u.profileCompleteness || 0,
      availability:        u.isAvailable ? 'available' : 'unavailable',
      memberSince:         u.stats?.memberSince || '',
      joinedAt:            u.createdAt,
    }));
    return res.json({ success: true, data: members, total: members.length });
  } catch {
    return res.json({ success: true, data: [], total: 0 });
  }
});

// ── Error Handlers ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Background Jobs ──────────────────────────────────────────────────
startBackgroundJobs();

export default app;
