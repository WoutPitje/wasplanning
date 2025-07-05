# Wash Planning System

A real-time vehicle wash management system for auto service centers, coordinating between workshop, wash station, and planning departments.

## Features

- **Real-time Status Tracking** - Track vehicles from workshop to wash station to completion
- **Role-based Access** - Separate interfaces for Werkplaats, Wassers, Haal/Breng Planners, Wasplanners, and Admins
- **Smart Task Assignment** - Match wash tasks to available washers based on skills
- **Mobile Responsive** - Fully responsive from 320px width, optimized for all devices
- **Real-time Updates** - WebSocket notifications for instant status changes
- **Multi-language Support** - Dutch (primary) and English interface translations
- **Audit Logging** - Complete audit trail for compliance and security monitoring

## Tech Stack

- **Backend**: NestJS, PostgreSQL, Redis, TypeORM
- **Frontend**: Nuxt 3 (SSG), shadcn-vue, Pinia
- **Mobile**: Expo/React Native, NativeWind, Zustand
- **Storage**: MinIO (S3-compatible object storage)
- **Real-time**: Socket.io
- **API Docs**: Swagger/OpenAPI
- **i18n**: Vue I18n (Dutch/English)

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
- NestJS API on `http://localhost:3001`
- Nuxt frontend on `http://localhost:3000`
- Swagger docs on `http://localhost:3001/api/docs`

## Project Structure

```
wasplanning/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── admin/       # Admin/tenant management
│   │   ├── audit/       # Audit logging module
│   │   ├── auth/        # Authentication & authorization
│   │   ├── users/       # User management
│   │   ├── storage/     # File storage (MinIO)
│   │   ├── common/      # Shared utilities
│   │   ├── config/      # Configuration files
│   │   ├── database/    # Database seeds
│   │   └── migrations/  # Database migrations
│   └── test/
├── frontend/            # Nuxt 3 application
│   ├── pages/          # Role-based pages
│   ├── components/     # Shared components
│   ├── composables/    # Vue composables
│   ├── stores/         # Pinia stores
│   ├── i18n/           # Internationalization
│   └── types/          # TypeScript types
├── mobile/             # Expo React Native app (planned)
│   ├── app/            # Expo Router pages
│   ├── components/     # Native components
│   ├── hooks/          # React hooks
│   └── services/       # API & WebSocket
└── docker-compose.yml  # Docker services
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

### Mobile Testing (Planned)
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

# Mobile tests (when implemented)
cd mobile
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npx detox test         # E2E tests on simulator
```

## API Documentation

Once the backend is running, access the Swagger documentation at:
```
http://localhost:3001/api/docs
```

## User Roles

1. **Werkplaats** - Submit wash requests only
2. **Wassers** - View queue, update wash status
3. **Haal/Breng Planners** - View completion status for return trips
4. **Wasplanners** - Manage queue and task assignments
5. **Garage Admin** - Manage users and settings for their garage
6. **Super Admin** - Manage all garages and global settings

## Multi-Location Support (Planned)

The system will support multiple locations per tenant:

- **Per Tenant**: Each garage can have multiple physical locations
- **Location-Specific**: Wash tasks, users, and vehicles can be assigned to specific locations
- **Cross-Location**: Wasplanners can view and manage tasks across all locations within their tenant
- **Reporting**: Generate reports per location or aggregated across all locations
- **User Assignment**: Users can be assigned to one or multiple locations based on their role

## Internationalization (i18n)

The frontend supports multiple languages using Vue I18n:

- **Default Language**: Dutch (nl)
- **Available Languages**: Dutch (nl), English (en)
- **Configuration**: Located in `frontend/i18n/i18n.config.ts`

### Adding Translations

1. All UI text must use the `t()` function from Vue I18n
2. Never hardcode Dutch or English text in components
3. Translation keys follow a hierarchical structure:
   - Common: `common.save`, `common.cancel`
   - Page-specific: `[role].[page].[element]`
   - Example: `admin.tenants.form.title`

### Using i18n in Components

```vue
<template>
  <h1>{{ t('page.title') }}</h1>
  <Button>{{ t('common.save') }}</Button>
  <Input :placeholder="t('form.email.placeholder')" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

### Important Notes

- Avoid using @ symbols in translation strings (use descriptive text instead)
- For email placeholders, use descriptive text like "Enter your email address"
- Use computed properties for reactive translations
- All new features must include both Dutch and English translations

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://dev:dev123@localhost:5432/wasplanning
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_URL=http://localhost:3001
NUXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Mobile Responsiveness

The frontend is designed to be fully responsive and functional on all devices:

- **Minimum Support**: 320px width (iPhone SE)
- **Breakpoints**: Uses Tailwind CSS responsive prefixes (sm:, md:, lg:, xl:)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Tables**: Horizontal scroll on mobile or card-based layouts
- **Forms**: Single column layout on mobile devices
- **Navigation**: Hamburger menu pattern for mobile
- **Typography**: Minimum 14px font size on mobile
- **Spacing**: Touch-friendly padding and margins

## Audit Logging

The system includes comprehensive audit logging for security and compliance:

### Features
- **Complete Activity Tracking**: All user actions are logged with timestamp, IP address, and details
- **Multi-tenant Isolation**: Each tenant's audit logs are completely isolated
- **Role-based Access**: Super admins and garage admins can view audit logs
- **Advanced Filtering**: Filter by user, action type, resource, or date range
- **CSV Export**: Export audit logs for compliance reporting
- **Non-blocking**: Audit failures don't impact application functionality

### Tracked Actions
- **Authentication**: Login, logout, impersonation start/stop
- **User Management**: Create, update, deactivate users, password resets
- **Tenant Management**: Create, update, deactivate tenants
- **File Operations**: Upload, download, delete files (planned)
- **Vehicle Operations**: Create, update wash requests (planned)

### Implementation for Developers
When adding new features that require audit logging:

1. Inject the `AuditService` into your controller:
```typescript
constructor(private readonly auditService: AuditService) {}
```

2. Log actions after successful operations:
```typescript
await this.auditService.logAction({
  tenant_id: req.user.tenant.id,
  user_id: req.user.id,
  action: 'resource.created',
  resource_type: 'resource_name',
  resource_id: resource.id,
  details: { /* additional context */ },
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});
```

3. Use consistent action naming: `resource.action` (e.g., `user.created`, `tenant.updated`)

### Viewing Audit Logs
- **Super Admin**: Can view all audit logs at `/admin/audit`
- **Garage Admin**: Can view their tenant's logs at `/garage-admin/audit` (planned)
- **API Endpoint**: `GET /api/v1/audit` with query parameters for filtering

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