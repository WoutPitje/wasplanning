# Wash Planning System

A multi-tenant SaaS vehicle wash management system for auto service centers, coordinating between workshop, wash station, and planning departments with subscription-based billing.

## Features

- **Multi-Tenant Architecture** - Complete tenant isolation with per-tenant databases and data
- **Subscription Management** - Tiered pricing with usage-based limits and Stripe integration
- **Real-time Status Tracking** - Track vehicles from workshop to wash station to completion
- **Role-based Access Control** - Six distinct roles with hierarchical permissions
- **Smart Task Assignment** - Match wash tasks to available washers based on skills
- **Mobile Responsive** - Fully responsive from 320px width, optimized for all devices
- **Real-time Updates** - WebSocket notifications for instant status changes
- **Multi-language Support** - Dutch (primary) and English interface translations
- **Comprehensive Audit Logging** - Complete audit trail for compliance and security monitoring
- **Subscription Limits** - Usage-based restrictions with automatic warnings and enforcement

## Tech Stack

- **Backend**: NestJS, PostgreSQL, Redis, TypeORM
- **Frontend**: Nuxt 3 (SSG), shadcn-vue, Pinia
- **Mobile**: Expo/React Native, NativeWind, Zustand
- **Storage**: MinIO (S3-compatible object storage)
- **Real-time**: Socket.io
- **API Docs**: Swagger/OpenAPI
- **i18n**: Vue I18n (Dutch/English)
- **Payments**: Stripe (subscriptions, payment methods, webhooks)
- **Email**: SMTP with Handlebars templates
- **Security**: JWT auth, role-based access, rate limiting

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
- MailHog on `localhost:1025` (Web UI: `http://localhost:8025`)
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

## User Roles & Permissions

### Role Hierarchy

1. **SUPER_ADMIN** (System Administrator)
   - Universal access across all tenants
   - Can impersonate other users for support
   - Manages tenants and system-wide settings
   - Bypasses all role and tenant restrictions
   - Can view all audit logs

2. **GARAGE_ADMIN** (Tenant Administrator)
   - Full access within their tenant only
   - Can create and manage users (except other admins)
   - Manages subscription and billing
   - Views tenant audit logs
   - Cannot access other tenants

3. **WASPLANNERS** (Wash Planners)
   - Manages wash queue and assignments
   - Views all wash-related data
   - Can assign tasks to washers
   - Limited to their tenant

4. **WASSERS** (Washers)
   - Views assigned wash tasks
   - Updates wash status
   - Limited to their own tasks
   - Mobile-optimized interface

5. **WERKPLAATS** (Workshop Staff)
   - Creates wash requests
   - Views status of submitted requests
   - Cannot modify assignments
   - Limited to their location

6. **HAAL_BRENG_PLANNERS** (Pickup/Delivery Planners)
   - Views completed washes
   - Manages pickup/delivery schedules
   - Cannot modify wash tasks
   - Coordinates vehicle logistics

## Subscription Plans & Limits

### Available Plans

1. **Free Plan**
   - 50 cars washed per month
   - 5 active users
   - 1 location
   - Basic features

2. **Standard Plan** (€100/month)
   - 500 cars washed per month
   - 20 active users
   - 3 locations
   - All features
   - Email support

3. **Enterprise Plan** (€400/month)
   - Unlimited cars washed
   - Unlimited active users
   - Unlimited locations
   - Priority support
   - Custom integrations

### Limit Enforcement
- Real-time usage tracking
- Warnings at 80% usage
- Hard limits prevent exceeding quotas
- Automatic email notifications
- Mid-cycle upgrades with proration

## Multi-Location Support

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
# Database
DATABASE_URL=postgresql://dev:dev123@localhost:5432/wasplanning
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=wasplanning

# Email Configuration (Development uses MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM_EMAIL=noreply@wasplanning.nl
SMTP_FROM_NAME=Wasplanning System

# Stripe (Required for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Application URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
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

## Security & Compliance

### Authentication & Authorization

#### Decorators
- `@Public()` - Mark endpoints as publicly accessible
- `@Roles(...roles)` - Restrict access to specific roles
- `@CurrentUser()` - Inject authenticated user into method
- `@NoImpersonation()` - Prevent impersonated access
- `@RateLimit(options)` - Apply rate limiting
- `@CheckLimit(limitType)` - Check subscription limits
- `@AllowReadOnly()` - Allow read-only access for restricted subscriptions

#### Guards (Applied in Order)
1. **JwtAuthGuard** - JWT authentication (skipped for @Public)
2. **RolesGuard** - Role-based access control
3. **TenantGuard** - Tenant isolation enforcement
4. **SubscriptionGuard** - Subscription limit checking
5. **NoImpersonationGuard** - Block impersonated users

### Tenant Isolation

- All data is strictly isolated per tenant
- Tenant context automatically added to requests
- Cross-tenant access prevented at multiple levels
- Super admins can access all tenants
- Queries filtered by tenant_id automatically

### Audit Logging

The system includes comprehensive audit logging for security and compliance:

#### Features
- **Complete Activity Tracking**: All actions logged with timestamp, IP, user agent
- **Multi-tenant Isolation**: Tenant-specific audit trails
- **Role-based Access**: Admins can view and export logs
- **Advanced Filtering**: By user, action, resource, date range
- **CSV Export**: For compliance reporting
- **Non-blocking**: Failures don't impact functionality

#### Tracked Actions
- **Authentication**: Login, logout, impersonation
- **User Management**: CRUD operations, password resets
- **Tenant Management**: Create, update, suspend, resume
- **Subscription & Billing**: Plan changes, payments, limits
- **Settings**: Configuration changes
- **Limit Violations**: Exceeded limits and warnings

## Developer Guidelines

### Controller Implementation Pattern

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(UserRole.GARAGE_ADMIN)
@Controller('resources')
export class ResourceController {
  constructor(
    private readonly resourceService: ResourceService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @CheckLimit(LimitType.RESOURCES)
  async create(@Body() dto: CreateDto, @Request() req: any) {
    // Service handles business logic
    const resource = await this.resourceService.create(
      dto,
      req.user.tenant.id,
    );

    // Audit after successful operation
    await this.auditService.logAction({
      tenant_id: req.user.tenant.id,
      user_id: req.user.id,
      action: 'resource.created',
      resource_type: 'resource',
      resource_id: resource.id,
      details: { name: resource.name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    return resource;
  }
}
```

### Service Implementation Pattern

```typescript
@Injectable()
export class ResourceService {
  async create(dto: CreateDto, tenantId: string) {
    // Always include tenant_id in queries
    const existing = await this.repository.findOne({
      where: { 
        name: dto.name,
        tenant_id: tenantId,
      },
    });

    if (existing) {
      throw new ConflictException('Resource already exists');
    }

    // Create with tenant association
    const resource = this.repository.create({
      ...dto,
      tenant_id: tenantId,
    });

    return this.repository.save(resource);
  }
}
```

### Key Development Rules

1. **Always use guards in correct order**: JWT → Roles → Tenant
2. **Never trust client-provided tenant IDs**: Use `req.user.tenant.id`
3. **Include tenant_id in all queries**: Prevent cross-tenant data leaks
4. **Audit significant actions**: User changes, settings, payments
5. **Check subscription limits**: Before creating limited resources
6. **Handle errors gracefully**: Return meaningful error messages
7. **Use TypeORM transactions**: For multi-step operations
8. **Validate DTOs thoroughly**: Use class-validator decorators

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