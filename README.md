# Wash Planning System

A real-time vehicle wash management system for auto service centers, coordinating between workshop, wash station, and planning departments.

## Features

- **Real-time Status Tracking** - Track vehicles from workshop to wash station to completion
- **Role-based Access** - Separate interfaces for Werkplaats, Wassers, Haal/Breng Planners, Wasplanners, and Admins
- **Smart Task Assignment** - Match wash tasks to available washers based on skills
- **Mobile Responsive** - Optimized for tablets and phones used by wash staff
- **Real-time Updates** - WebSocket notifications for instant status changes

## Tech Stack

- **Backend**: NestJS, PostgreSQL, Redis, TypeORM
- **Frontend**: Nuxt 3 (SSG), shadcn-vue, Pinia
- **Mobile**: Expo/React Native, NativeWind, Zustand
- **Storage**: MinIO (S3-compatible object storage)
- **Real-time**: Socket.io
- **API Docs**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wasplanning.git
cd wasplanning

# Install all dependencies
npm run install:all

# Setup database
npm run db:setup
```

### Development

```bash
# Start all services (PostgreSQL, Redis, MinIO, Backend, Frontend)
npm run dev

# Setup MinIO buckets (first time only)
npm run storage:setup
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000` (Console: `http://localhost:9001`)
- NestJS API on `http://localhost:3000`
- Nuxt frontend on `http://localhost:3001`
- Swagger docs on `http://localhost:3000/api/docs`

## Project Structure

```
wasplanning/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/     # Feature modules
│   │   ├── entities/    # TypeORM entities
│   │   └── migrations/  # Database migrations
│   └── test/
├── frontend/            # Nuxt 3 application
│   ├── pages/          # Role-based pages
│   ├── components/     # Shared components
│   ├── composables/    # Vue composables
│   └── stores/         # Pinia stores
├── mobile/             # Expo React Native app
│   ├── app/            # Expo Router pages
│   ├── components/     # Native components
│   ├── hooks/          # React hooks
│   └── services/       # API & WebSocket
├── docker/             # Docker configurations
└── scripts/            # Development scripts
```

## Available Scripts

```bash
# Development
npm run dev              # Start all services (DB, API, Web)
npm run dev:mobile       # Start Expo development server
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

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

## Testing

### Backend Testing
- **Unit Tests**: Jest for services and controllers
- **Integration Tests**: SuperTest with test database
- **E2E Tests**: Playwright for API testing
- **Coverage**: Minimum 80% code coverage

### Frontend Testing
- **Unit Tests**: Vitest for components and composables
- **Component Tests**: @testing-library/vue
- **E2E Tests**: Playwright for user scenarios
- **Visual Tests**: Storybook (optional)

### Mobile Testing
- **Unit Tests**: Jest + React Native Testing Library
- **Component Tests**: @testing-library/react-native
- **E2E Tests**: Detox for device testing
- **Platform Testing**: Expo Go + EAS Build

### Running Tests

```bash
# Backend tests
cd backend
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests

# Frontend tests
cd frontend
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:e2e       # E2E tests
npm run test:coverage  # Coverage report

# Mobile tests
cd mobile
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npx detox test         # E2E tests on simulator
```

## API Documentation

Once the backend is running, access the Swagger documentation at:
```
http://localhost:3000/api/docs
```

## User Roles

1. **Werkplaats** - Submit wash requests only
2. **Wassers** - View queue, update wash status
3. **Haal/Breng Planners** - View completion status for return trips
4. **Wasplanners** - Manage queue and task assignments
5. **Garage Admin** - Manage users and settings for their garage
6. **Super Admin** - Manage all garages and global settings

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
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:3000
NUXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Technical Documentation

For detailed technical information, see:

- **[📋 Technical Overview](./technical-overview.md)** - Start here for system architecture
- **[⚙️ Backend Technical](./backend-technical.md)** - NestJS API specification
- **[🌐 Frontend Technical](./frontend-technical.md)** - Nuxt 3 web application
- **[📱 Mobile Technical](./mobile-technical.md)** - Expo React Native app
- **[🚀 Development Setup](./development-setup.md)** - Developer onboarding guide
- **[🏗️ Deployment](./deployment.md)** - Production deployment guide

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.