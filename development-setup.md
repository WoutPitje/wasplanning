# Development Setup Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn
- Expo CLI (for mobile development)

## Quick Start

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/wasplanning.git
cd wasplanning

# Install all dependencies
npm run install:all

# Setup database
npm run db:setup

# Setup MinIO buckets
npm run storage:setup
```

### Development

#### Start All Services
```bash
# Start backend services + web app
npm run dev

# Start mobile app (separate terminal)
npm run dev:mobile
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000` (Console: `http://localhost:9001`)
- NestJS API on `http://localhost:3000`
- Nuxt frontend on `http://localhost:3001`
- Swagger docs on `http://localhost:3000/api/docs`
- Expo dev server (scan QR with Expo Go app)

#### Individual Services
```bash
npm run dev:db        # PostgreSQL only
npm run dev:redis     # Redis only
npm run dev:minio     # MinIO only
npm run dev:backend   # NestJS API only
npm run dev:frontend  # Nuxt app only
npm run dev:mobile    # Expo app only
```

## Project Structure

```
wasplanning/
├── backend/          # NestJS API
├── frontend/         # Nuxt 3 SSG
├── mobile/           # Expo React Native
├── docker/           # Docker configs
├── scripts/          # Dev scripts
├── package.json      # Root package.json
└── docker-compose.yml
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://dev:dev123@localhost:5432/wasplanning
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3000
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Multi-location support
ENABLE_MULTI_LOCATION=true
DEFAULT_LOCATION_NAME=Hoofdvestiging
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:3000
NUXT_PUBLIC_WS_URL=ws://localhost:3000

# Feature flags
NUXT_PUBLIC_ENABLE_MULTI_LOCATION=true
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000

# Feature flags
EXPO_PUBLIC_ENABLE_MULTI_LOCATION=true
```

## Available Scripts

```bash
# Development
npm run dev              # Start all services (DB, API, Web)
npm run dev:mobile       # Start Expo development server

# Database
npm run db:setup         # Run migrations and seed data
npm run migration:generate # Generate new migration
npm run migration:run    # Run pending migrations

# Testing
npm run test            # Run all tests
npm run test:unit       # Run unit tests only
npm run test:e2e        # Run E2E tests
npm run test:cov        # Run tests with coverage

# Building
npm run build           # Build web for production
npm run build:mobile    # Build mobile app (iOS/Android)
npm run clean           # Clean build artifacts
```

## Docker Services

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: wasplanning
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
```

## Testing

### Running Tests
```bash
# Backend tests
cd backend
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests

# Frontend tests
cd frontend
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:e2e       # E2E tests

# Mobile tests
cd mobile
npm run test           # Run all tests
npx detox test         # E2E tests on simulator
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports 3000, 3001, 5432, 6379, 9000 are available
2. **Database connection**: Ensure PostgreSQL is running via Docker
3. **Expo app not loading**: Check network connection and API_URL in mobile .env
4. **MinIO not accessible**: Verify MinIO service is running on port 9000

### Reset Everything
```bash
npm run clean
docker-compose down -v
npm run install:all
npm run db:setup
npm run storage:setup
npm run dev
```