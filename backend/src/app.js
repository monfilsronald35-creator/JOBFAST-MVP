import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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
import messageRoutes    from './routes/messages.routes.js';
import postRoutes       from './routes/posts.routes.js';
import bookingRoutes    from './routes/bookings.routes.js';

// ✅ CHEMEN KORÈK LA: Nou retire "/middlewares" paske fichye a nan menm nivo ak app.js
import { notFoundHandler, errorHandler } from './ErrorHandler.js';
import User from './models/user.model.js';
import { usersDatabase } from './controllers/register.controller.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// CORS: when origin list contains '*' we allow any origin explicitly (not the
// wildcard string) so it stays compatible with credentials mode in browsers.
const allowedOrigins = env.CORS_ORIGIN; // string[]
app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser requests (curl, Render health check, server-to-server) have
      // no Origin header — always allow them.
      if (!origin) return cb(null, true);
      // Wildcard configured → allow every browser origin, echo it back.
      if (allowedOrigins.includes('*')) return cb(null, origin);
      // Specific list → check membership.
      if (allowedOrigins.includes(origin)) return cb(null, origin);
      cb(null, false); // blocked — no CORS headers sent
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
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
app.use(`${API_PREFIX}/messages`,   messageRoutes);
app.use(`${API_PREFIX}/posts`,      postRoutes);
app.use(`${API_PREFIX}/bookings`,   bookingRoutes);

// Public community feed — returns latest registered members (no auth required)
app.get(`${API_PREFIX}/community/members`, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);

    // Prefer MongoDB (persistent); fall back to in-memory for MVP
    let members = [];
    if (mongoose.connection.readyState === 1) {
      const docs = await User.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name role profession category location profileMetadata profileCompleteness stats availability createdAt')
        .lean();
      members = docs.map(u => ({
        id: u._id,
        name: u.name,
        role: u.role,
        profession: u.profession,
        category: u.category,
        city: u.location?.city || '',
        country: u.location?.country || 'Haiti',
        photo: u.profileMetadata?.profilePhoto || null,
        yearsExperience: u.profileMetadata?.yearsExperience || null,
        specialties: u.profileMetadata?.specialties || [],
        rating: u.stats?.rating || 5.0,
        profileCompleteness: u.profileCompleteness || 0,
        availability: u.availability || 'available',
        memberSince: u.stats?.memberSince || '',
        joinedAt: u.createdAt,
      }));
    } else {
      // In-memory fallback
      members = Array.from(usersDatabase.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          profession: u.profession,
          category: u.category,
          city: u.location?.city || '',
          country: u.location?.country || 'Haiti',
          photo: u.profileMetadata?.profilePhoto || null,
          yearsExperience: u.profileMetadata?.yearsExperience || null,
          specialties: u.profileMetadata?.specialties || [],
          rating: u.stats?.rating || 5.0,
          profileCompleteness: u.profileCompleteness || 0,
          availability: u.availability || 'available',
          memberSince: u.stats?.memberSince || '',
          joinedAt: u.createdAt,
        }));
    }

    return res.json({ success: true, data: members, total: members.length });
  } catch (err) {
    return res.json({ success: true, data: [], total: 0 });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
