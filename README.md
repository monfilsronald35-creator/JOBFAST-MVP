# JOBFAST

### The Global Workforce, Services & Business Intelligence Platform

> **Connect Talent. Create Opportunities. Build the Future.**

JOBFAST is a global technology platform designed to connect workers, professionals,
businesses, organizations, clients, and service providers through one intelligent,
secure, scalable digital ecosystem.

---

## Implementation Status

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented & committed |
| 🔧 | In development |
| 📋 | Planned |

---

## 1. Product Vision

JOBFAST is designed to become a global infrastructure layer for work, services,
businesses, and digital opportunities.

```
Workers
  ↓
Professionals
  ↓
Businesses
  ↓
Organizations
  ↓
Clients
  ↓
Enterprise
  ↓
Global Marketplace
```

The long-term objective is to create a single ecosystem where users can:

- Find work and hire workers
- Offer and discover services
- Communicate and collaborate
- Manage organizations
- Receive AI-powered recommendations
- Make secure payments
- Analyze performance
- Operate internationally

---

## 2. Core Objectives

**1. Discoverability** — Make people, jobs, businesses, and services easier to find.

**2. Trust** — Build identity, reputation, verification, security, fraud prevention,
and controlled access into the platform at every layer.

**3. Intelligence** — Use AI to improve search, matching, recommendations, pricing,
fraud detection, translation, automation, and business insights.

**4. Globalization** — Support multiple countries, currencies, languages, regions,
localized business rules, and global expansion without rewriting the core.

**5. Enterprise Scalability** — Support individual users through large organizations
and enterprise customers on the same architecture.

---

## 3. Platform Architecture

```
                     ┌─────────────────────┐
                     │      JOBFAST UI      │
                     │   React / Vite       │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │    API Gateway       │
                     │  Authentication      │
                     │  Rate Limiting       │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   JOBFAST BACKEND    │
                     │  Node.js / REST API  │
                     │  36 Domain Modules   │
                     └──────────┬──────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
  ┌────────────┐        ┌──────────────┐       ┌──────────────┐
  │ Supabase   │        │ AI Services  │       │ External APIs│
  │ PostgreSQL │        │ Matching     │       │ Payments     │
  │ RLS        │        │ Search       │       │ Maps         │
  └─────┬──────┘        │ Translation  │       │ Notifications│
        │               └──────────────┘       └──────────────┘
        ▼
  ┌──────────────┐
  │ PostgreSQL   │
  │ RLS Policies │
  │ 150+ Tables  │
  └──────────────┘
```

**Critical security rule:** The frontend never calls Supabase directly for data.
All requests flow through the backend. `SUPABASE_SERVICE_ROLE_KEY` never appears
in frontend code. `VITE_*` variables are browser-visible — secrets stay on the
backend only.

Data path for every protected action:

```
Button → React handler → Frontend service → axios → Backend endpoint
  → requireAuth → requireRole → Business logic → Supabase + RLS
  → Response → UI update
```

---

## 4. Technology Stack

**Frontend** ✅
- React 18, Vite 5, TypeScript
- React Router v6
- Framer Motion
- React Query
- Socket.IO Client
- i18next (Kreyòl / Français / English / Español)
- Tailwind CSS

**Backend** ✅
- Node.js 20, Express
- TypeScript, strict mode
- JWT authentication (own auth — not Supabase Auth)
- 36 domain modules (modular monolith)
- TypedEventBus (domain events)
- Socket.IO (real-time)

**Database** ✅
- PostgreSQL via Supabase
- Row Level Security (RLS) on all tables
- 150+ tables across 25 migrations
- JSONB, PostGIS, pgvector extensions

**Infrastructure** ✅ / 📋
- Render (backend) ✅
- Vercel (frontend) ✅
- Supabase (database + storage) ✅
- Cloudflare (CDN / WAF) 📋
- Redis (cache) 📋

**AI** 🔧 / 📋
- Claude (Anthropic) — AI assistant, matching, insights ✅ integrated
- Vector similarity matching 🔧
- Fraud ML model 📋
- Voice interface 📋

---

## 5. Project Structure

```
JOBFAST-MVP/
│
├── apps/
│   └── frontend/              # React / Vite application
│       ├── src/
│       │   ├── api/           # Canonical axios client (single source of truth)
│       │   ├── components/    # Shared UI components
│       │   ├── context/       # AuthContext, global state
│       │   ├── pages/         # Route-level pages (one directory per phase)
│       │   │   ├── Settings/        # Phase 14 ✅
│       │   │   ├── Analytics/       # Phase 15 ✅
│       │   │   ├── AIHub/           # Phase 16 ✅
│       │   │   └── SuperAdmin/      # Phase 17 ✅
│       │   ├── routes/        # AppRoutes.tsx — all routes + security gates
│       │   └── services/      # Frontend service layer (calls backend only)
│       └── .env.example
│
├── backend/
│   └── src/
│       ├── core/              # Auth middleware, DB client, error classes, events
│       └── modules/           # 36 domain modules
│           ├── auth/          # Login, register, JWT, OTP, sessions
│           ├── users/         # Profiles, settings, devices, sessions
│           ├── jobs/          # Job listings, applications, matching
│           ├── marketplace/   # Products, services, orders
│           ├── wallet/        # Balances, transactions, transfers
│           ├── payments/      # Stripe, MonCash, NatCash, webhooks
│           ├── chat/          # Conversations, messages, presence
│           ├── notifications/ # Push, email, SMS, in-app
│           ├── search/        # Universal search, ranking
│           ├── ai/            # Assistant, matching, pricing, fraud
│           ├── analytics/     # Events, KPIs, dashboards
│           ├── admin/         # Admin OS — 17 sections, 35 endpoints
│           ├── localization/  # Countries, currencies, languages, i18n
│           ├── monetization/  # Revenue engine, fee rules, billing
│           └── integration/   # Partner APIs, API keys, webhooks, OAuth2
│
├── supabase/
│   └── migrations/            # SQL migrations 001–026 (run in Supabase SQL Editor)
│
└── docs/                      # Architecture, security, API, deployment docs
```

---

## 6. Backend Modules (36 Registered)

| # | Module | Status | Key Features |
|---|--------|--------|-------------|
| 1 | auth | ✅ | JWT, register, login, OTP, password reset |
| 2 | users | ✅ | Profiles, settings, devices, sessions |
| 3 | jobs | ✅ | Listings, applications, scheduling, contracts |
| 4 | marketplace | ✅ | Products, services, orders, disputes |
| 5 | wallet | ✅ | Balances, transactions, escrow, bank accounts |
| 6 | payments | ✅ | Stripe, MonCash, NatCash, webhooks, refunds |
| 7 | chat | ✅ | Conversations, messages, files, real-time |
| 8 | notifications | ✅ | Push, email, SMS, in-app, queue |
| 9 | search | ✅ | Universal search, AI ranking, geo ranking |
| 10 | media | ✅ | Images, videos, documents, CDN |
| 11 | maps | ✅ | Geolocation, distance, routing |
| 12 | analytics | ✅ | Events, KPIs, dashboards, exports |
| 13 | travel | ✅ | Hotels, flights, bookings, insurance |
| 14 | health | ✅ | Healthcare providers, appointments, records |
| 15 | telecom | ✅ | Data packages, recharges, dealer accounts |
| 16 | enterprise | ✅ | Organizations, branches, employees, roles |
| 17 | admin | ✅ | Dashboard, users, moderation, feature flags |
| 18 | ai | ✅ | Assistant, matching, pricing, translation |
| 19 | identity | ✅ | MFA, trusted devices, social login |
| 20 | government | ✅ | Licenses, permits, certificates, payments |
| 21 | security | ✅ | Threat detection, fraud alerts, risk scores |
| 22 | storage | ✅ | File upload, CDN, presigned URLs |
| 23 | realtime | ✅ | Presence, sync, location, event bus |
| 24 | localization | ✅ | 34 countries, currencies, i18n, country context |
| 25 | monetization | ✅ | Revenue engine, fee rules, free tier, billing |
| 26 | integration | ✅ | Partner APIs, API keys, webhooks, OAuth2 |
| 27–36 | Additional verticals | ✅ | Education, insurance, banking, stories, etc. |

---

## 7. Frontend Phases

| Phase | Name | Route | Status |
|-------|------|-------|--------|
| 1 | Authentication | `/login`, `/register`, `/otp` | ✅ |
| 2 | App Shell | Layout, navigation, routing | ✅ |
| 3 | Home / Dashboard | `/dashboard` | ✅ |
| 4 | Universal Search | `/search` | ✅ |
| 5 | Marketplace | `/market`, `/marketplace` | ✅ |
| 6 | Create Center | `/create-post` | ✅ |
| 7 | Chat | `/chat` | ✅ |
| 8 | Profile | `/profile`, `/edit-profile` | ✅ |
| 9 | Wallet | `/wallet` | ✅ |
| 10 | Notifications | `/notifications` | ✅ |
| 11 | Business Dashboard | `/provider-dashboard` | ✅ |
| 12 | Admin Platform | `/admin` | ✅ |
| 13 | Enterprise Platform | `/enterprise-dashboard` | ✅ |
| 14 | Settings | `/settings` | ✅ |
| 15 | Analytics | `/analytics` | ✅ |
| 16 | AI Hub | `/ai` | ✅ |
| 17 | Super Admin | `/super-admin` | ✅ |

---

## 8. Database Migrations

Migrations run manually in the Supabase SQL Editor, in order.

| File | Domain | Key Tables |
|------|--------|-----------|
| `001_foundation.sql` | Core setup | extensions, base config |
| `002_identity_service.sql` | Identity | users, sessions, devices, MFA, OTP |
| `003_global_profile_service.sql` | Profiles | profiles, skills, experience, verification |
| `004_country_localization.sql` | Localization | countries, currencies, languages, translations |
| `005_jobs_service.sql` | Jobs | jobs, applications, matches, contracts |
| `006_marketplace_service.sql` | Marketplace | products, services, orders, reviews |
| `007_wallet_service.sql` | Wallet | wallets, transactions, escrow, bank accounts |
| `008_payment_platform.sql` | Payments | payment methods, providers, webhooks |
| `009_chat_service.sql` | Chat | conversations, messages, calls |
| `010_notification_service.sql` | Notifications | notifications, templates, queues |
| `011_search_engine.sql` | Search | indexes, history, recommendations |
| `013_AI_PLATFORM.sql` | AI | models, prompts, requests, memory, scores |
| `014_ANALYTICS_PLATFORM.sql` | Analytics | events, metrics, revenue reports |
| `015_ENTERPRISE_SERVICE.sql` | Enterprise | organizations, branches, roles, payrolls |
| `016_TELECOM_SERVICE.sql` | Telecom | providers, packages, recharges, dealers |
| `017_TRAVEL_PLATFORM.sql` | Travel | hotels, flights, bookings, insurance |
| `018_HEALTHCARE_PLATFORM.sql` | Healthcare | providers, appointments, records |
| `019_GOVERNMENT_PLATFORM.sql` | Government | licenses, permits, certificates |
| `020_SECURITY_PLATFORM.sql` | Security | events, risk scores, fraud alerts |
| `021_REALTIME_PLATFORM.sql` | Realtime | connections, presence, event bus |
| `022_MEDIA_STORAGE.sql` | Media | files, images, videos, CDN assets |
| `023_MONETIZATION.sql` | Monetization | commission rules, pricing, platform fees |
| `024_ADMIN_PLATFORM.sql` | Admin | admin users, roles, moderation, audit logs |
| `025_INTEGRATION_PLATFORM.sql` | Integration | API keys, OAuth clients, webhooks |
| `026_INDEXES_RLS.sql` | Security | indexes, RLS policies, security rules |

Migration order must be respected. Each migration may reference tables from
earlier migrations. Do not skip or reorder.

---

## 9. Security Architecture

```
User
 ↓
Authentication (JWT — own auth, not Supabase Auth)
 ↓
API Authorization (requireAuth middleware)
 ↓
Role-Based Access Control (requireRole)
 ↓
PostgreSQL Row Level Security
 ↓
Database
 ↓
Audit Log
```

Security components:

- JWT authentication (passwords in `profiles.password_hash`, bcrypt)
- Row Level Security on all user-facing tables
- Role hierarchy: `user → worker → company → moderator → analyst → support → admin → super_admin`
- Session management & trusted device tracking
- AI-powered fraud detection
- Rate limiting per endpoint class
- HMAC webhook signatures (`sha256=<hex>`)
- API key hashing (sha256, raw key returned once only)
- No secrets in frontend code, ever

```sql
-- Example RLS policy
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);
```

The application must never depend exclusively on frontend restrictions.
Security must exist at the database layer.

---

## 10. User Access Model

```
Anonymous
   ↓
Authenticated User
   ↓
Verified User
   ↓
Professional / Worker
   ↓
Business / Company
   ↓
Organization
   ↓
Enterprise
   ↓
Administrator (admin)
   ↓
Super Administrator (super_admin)
```

Permissions are always evaluated server-side. The backend never trusts
client-provided role, user ID, balance, price, or ownership claims.

---

## 11. API Design

Endpoints are organized by domain module:

```
/api/auth           /api/users          /api/profiles
/api/jobs           /api/marketplace    /api/wallet
/api/payments       /api/chat           /api/notifications
/api/search         /api/analytics      /api/ai
/api/admin          /api/admin/os       /api/integration
/api/localization   /api/monetization   /api/flags
```

Standard response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors never expose stack traces, database credentials, or internal
infrastructure details.

---

## 12. AI Platform

| Capability | Status | Notes |
|-----------|--------|-------|
| AI Assistant (chat) | ✅ | Claude via backend proxy |
| AI Matching | ✅ | Job/worker matching engine |
| AI Recommendations | 🔧 | Learning from user behavior |
| AI Search | ✅ | Natural-language search |
| AI Pricing | ✅ | Demand/supply recommendations |
| AI Fraud Detection | ✅ | Risk scoring, auto-block |
| AI Translation | 🔧 | Multi-language communication |
| AI Voice | 📋 | Voice commands interface |
| AI Automation | 🔧 | Rule-based workflows |
| AI Insights | ✅ | Business intelligence |

The AI layer is a backend service. The frontend never holds AI provider API
keys. All AI requests proxy through the backend with authorization checks.

---

## 13. Analytics Domains

| Domain | Status | Data Source |
|--------|--------|-------------|
| Business Analytics | ✅ | jobs, profiles, contracts |
| Marketplace Analytics | ✅ | products, orders, services |
| Financial Analytics | ✅ | wallet, payments, revenue |
| AI Analytics | 🔧 | ai_requests, ai_scores |
| Revenue | ✅ | monetization module |
| Growth | 🔧 | user registration, retention |
| Engagement | 🔧 | analytics_events |
| Fraud | ✅ | security_events, risk_scores |
| Performance | ✅ | API latency, error rates |
| System Health | ✅ | service checks, snapshots |

---

## 14. Financial Infrastructure

| Feature | Status |
|---------|--------|
| Multi-currency wallets | ✅ |
| HTG, USD, EUR, DOP | ✅ |
| Cryptocurrency | 📋 |
| Stripe integration | ✅ |
| MonCash integration | 🔧 |
| NatCash integration | 🔧 |
| Escrow | ✅ |
| Invoicing | ✅ |
| Refunds | ✅ |
| Commission engine | ✅ |
| AML / KYC | 📋 |

All financial amounts stored in minor units (centimes, integers) as `BIGINT`.
All financial operations validated server-side. The frontend never computes
balances, commissions, or fees.

---

## 15. Globalization

| Feature | Status |
|---------|--------|
| Kreyòl Ayisyen | ✅ |
| Français | ✅ |
| English | ✅ |
| Español | 🔧 |
| 34 countries configured | ✅ |
| Multi-currency rates | ✅ |
| Country-specific rules | ✅ |
| Regional feature flags | ✅ |
| Timezone support | ✅ |

---

## 16. Deployment Architecture

```
              INTERNET
                  │
                  ▼
            CLOUDFLARE
         DNS / CDN / WAF
                  │
         ┌────────┴────────┐
         ▼                 ▼
      VERCEL             RENDER
     Frontend            Backend
         │                 │
         └────────┬────────┘
                  ▼
               SUPABASE
                  │
       PostgreSQL + Storage
                  │
                  ▼
                 RLS
```

---

## 17. Environment Variables

**Never commit `.env` to Git.** Use `.env.example` as the template.

Frontend (`.env` — browser-visible):

```bash
VITE_API_URL=https://your-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # anon key only — never service role
```

Backend (`.env` — server only):

```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<min 32 chars random>

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # NEVER in frontend
DATABASE_URL=postgres://...

STRIPE_SECRET_KEY=sk_live_...          # NEVER in frontend
STRIPE_WEBHOOK_SECRET=whsec_...
```

`SUPABASE_SERVICE_ROLE_KEY` must **never** appear in any `VITE_*` variable
or any file served to the browser.

---

## 18. Development

```bash
# Install all dependencies
npm install

# Run frontend (http://localhost:5173)
cd apps/frontend && npm run dev

# Run backend (http://localhost:5000)
cd backend && npm run dev

# Production build (quality gate — must exit 0)
cd apps/frontend && npm run build

# Type check
cd apps/frontend && npm run typecheck
cd backend && npx tsc --noEmit
```

---

## 19. CI/CD Pipeline (Target)

```
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Build (exit 0)
 ↓
Security Scan
 ↓
Deployment
```

Production deployment is reproducible and rollback-capable.

---

## 20. Engineering Principles

**Security First** — Security is part of the architecture, not an afterthought.
Every endpoint requires explicit auth and role checks.

**Database Integrity** — Business rules enforced server-side and in the database.
RLS is not optional.

**Least Privilege** — Users and services receive only the permissions required.
`super_admin` access requires explicit role assignment.

**Reuse Before Create** — Check existing modules before adding new ones.
36 modules already cover most domains.

**Correctness Over Speed** — Financial operations are ACID-compliant.
Money amounts are integers (no floating point).

**Additive Database Changes** — Migrations only add. Never drop columns or tables
in production without a separate, reviewed, reversible plan.

**No Secrets in Frontend** — Zero tolerance. Any `VITE_*` variable is public.

---

## 21. Development Rules

Before adding any feature:

1. Define the business requirement
2. Identify the database tables involved (check existing migrations first)
3. Define authorization rules (which roles can access this)
4. Define the API contract (endpoint, method, request/response shape)
5. Define frontend behavior (which page, which service file calls the endpoint)
6. Add tests where the risk justifies it
7. Add monitoring for production-critical paths
8. Document breaking changes

Never add a frontend feature that requires persistent data without a
corresponding backend endpoint and database table.

---

## 22. Security Rules

Never commit:

```
.env / .env.local / .env.production
private keys
SUPABASE_SERVICE_ROLE_KEY
JWT secrets
database passwords
Stripe secret keys
AI provider API keys
```

Never trust client-provided:

- User ID, role, or permission
- Price, balance, or commission
- Ownership claims
- Financial status

Never bypass RLS because a query is easier without it.

---

## 23. Disaster Recovery

| Component | Status |
|-----------|--------|
| Automated DB backup (Supabase) | ✅ every 6h |
| Backup retention | ✅ 30 days |
| Emergency mode (platform-wide pause) | ✅ via Super Admin |
| Deployment rollback | ✅ Render/Vercel rollback |
| Audit log | ✅ all admin actions |
| Incident playbook | 📋 |
| Backup restoration test | 📋 |

A backup never tested for restoration is not a verified recovery strategy.

---

## 24. Success Metrics

| Metric | Target |
|--------|--------|
| API Availability | > 99.9% |
| API P99 Latency | < 500ms |
| AI Match Accuracy | > 90% |
| Payment Success Rate | > 98% |
| Fraud Rate | < 0.1% |
| Search Success Rate | > 85% |
| Build Pass Rate | 100% (gate) |

---

## 25. Long-Term Vision

JOBFAST aims to become a global digital infrastructure connecting:

```
People + Skills + Jobs + Services + Businesses
   + Organizations + AI + Payments + Data
```

The goal is not simply to build another job application.

The goal is to build an intelligent ecosystem where economic opportunities
move faster, more securely, and more efficiently across borders — starting
in Haiti and expanding globally.

---

## License

Copyright © JOBFAST. All rights reserved unless otherwise specified
by the project owner.

---

## Project

**JOBFAST** — Global Workforce, Services & Business Intelligence Platform

*Connect Talent. Create Opportunities. Build the Future.*
