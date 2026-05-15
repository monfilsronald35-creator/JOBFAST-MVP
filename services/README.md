# JOBFAST Backend Services

A scalable microservices architecture for the JOBFAST platform, built with Node.js, Express.js, PostgreSQL, Redis, and Docker.

## Architecture Overview

JOBFAST uses a modular microservices architecture with the following services:

- **API Gateway** - Routes requests to appropriate services
- **Auth Service** - Authentication and authorization (JWT)
- **User Service** - User profiles, roles, and professions management
- **Job Service** - Job listings, applications, and matching
- **Business Service** - Company and business management
- **Wallet Service** - Wallet, transactions, and payments
- **Virtual Card Service** - Virtual cards, limits, and card management
- **Notification Service** - Real-time notifications via Socket.io
- **AI Personalization Service** - AI-powered recommendations and personalization
- **Fraud Service** - Fraud detection and prevention
- **Search Service** - Location-based search and filtering
- **Analytics Service** - Reports, metrics, and analytics
- **Admin Service** - Admin panel APIs for moderation and management

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js / Fastify
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: Prisma
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Containerization**: Docker & Docker Compose
- **Deployment**: Render, Railway, Vercel
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- npm or yarn

## Getting Started

### 1. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Update the `.env` file with your actual configuration values.

### 2. Database Setup

Run database migrations:

```bash
# For each service
cd auth-service
npx prisma migrate dev
cd ../user-service
npx prisma migrate dev
# ... repeat for other services
```

### 3. Start Services with Docker

```bash
docker-compose up -d
```

This will start all services including PostgreSQL and Redis.

### 4. Start Services Locally (Development)

For local development without Docker:

```bash
# Install dependencies for each service
cd auth-service && npm install
cd ../user-service && npm install
# ... repeat for other services

# Start each service in separate terminals
cd auth-service && npm run dev
cd ../user-service && npm run dev
# ... repeat for other services
```

## Service Ports

| Service | Port |
|---------|------|
| API Gateway | 3000 |
| Auth Service | 3001 |
| User Service | 3002 |
| Job Service | 3003 |
| Business Service | 3004 |
| Wallet Service | 3005 |
| Virtual Card Service | 3006 |
| Notification Service | 3007 |
| AI Personalization Service | 3008 |
| Fraud Service | 3009 |
| Search Service | 3010 |
| Analytics Service | 3011 |
| Admin Service | 3012 |
| Socket.io Server | 3013 |

## Key Features

### Smart Registration
- Automatic role detection (worker, boss, tradex, hybrid)
- Multiple profession support
- Device fingerprinting for duplicate account prevention

### Dynamic Homepage
- Personalized homepages based on user role
- Role-specific content and recommendations

### Professions Engine
- Support for 300+ professions
- Categorized by industry (construction, mechanics, digital, health, travel, office, etc.)

### AI System
- User role and interest detection
- Smart notifications
- Trust score calculation
- Fraud score calculation
- Verified badge system

### Location Engine
- GPS-based location tracking
- Distance sorting
- Nearby jobs and workers
- City/state/country normalization

### Wallet + Card System
- Virtual card creation
- Online payment support
- Card limits and freeze/unfreeze
- Transfers and recharge
- Country-specific withdrawals (Haiti MonCash/NatCash)

### Notifications
- Real-time push notifications
- Job alerts
- Money notifications
- Nearby offers
- Profile messages

### Security
- JWT authentication
- Rate limiting
- Anti-fraud measures
- Device fingerprinting
- Duplicate account blocking
- Scam keyword detection

### Admin Panel API
- User moderation
- Fraud review
- Payout management
- Card management
- Reports and analytics

## API Documentation

Each service has its own API documentation. Access them at:

- API Gateway: `http://localhost:3000/api-docs`
- Auth Service: `http://localhost:3001/api-docs`
- User Service: `http://localhost:3002/api-docs`
- ... and so on for other services

## Testing

Run tests for all services:

```bash
# Run tests for a specific service
cd auth-service
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Render Deployment

1. Connect your GitHub repository to Render
2. Create web services for each microservice
3. Configure environment variables
4. Deploy

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Create services for PostgreSQL, Redis, and each microservice
3. Configure environment variables
4. Deploy

### Vercel Deployment (Frontend)

1. Connect your GitHub repository to Vercel
2. Configure build settings
3. Deploy

## Monitoring

- Use application monitoring tools like Sentry for error tracking
- Use logging aggregation with tools like LogDNA or Papertrail
- Monitor database performance with tools like pgAdmin
- Monitor Redis with RedisInsight

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

MIT License

## Support

For support and questions, please contact the JOBFAST team at support@jobfast.com