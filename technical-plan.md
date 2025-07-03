# Technical Plan - Wash Planning System

## Backend (NestJS)

### Architecture
```
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── vehicles/
│   ├── wash-tasks/
│   └── notifications/
├── common/
│   ├── guards/
│   ├── decorators/
│   └── filters/
└── config/
```

### Core Modules
- **AuthModule**: JWT auth, role-based access (Workshop/Washer/Planner)
- **UsersModule**: User management, roles, availability
- **VehiclesModule**: Vehicle registration, status tracking
- **WashTasksModule**: Task queue, assignment, status updates
- **NotificationsModule**: Real-time updates via WebSockets

### Database (PostgreSQL + TypeORM)

**Entities**
```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() email: string
  @Column({ type: 'enum', enum: UserRole }) role: UserRole
  @Column('text', { array: true }) skills: string[]
}
```

**Migration Setup**
```
src/
├── migrations/
│   ├── 1234567890-CreateUsers.ts
│   ├── 1234567891-CreateVehicles.ts
│   └── 1234567892-CreateWashTasks.ts
├── entities/
├── typeorm.config.ts
```

**Scripts**
```json
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/typeorm.config.ts",
"migration:run": "typeorm-ts-node-commonjs migration:run -d src/typeorm.config.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/typeorm.config.ts"
```

### Key Features
- Swagger API documentation at `/api/docs`
- DTOs with class-validator
- TypeORM with auto-migrations
- Redis for queue management (BullMQ)
- WebSocket gateway for real-time updates
- Request logging with Pino
- File storage with MinIO (S3-compatible)

### File Storage (MinIO)
```typescript
// storage.module.ts
@Module({
  imports: [
    MinioModule.register({
      endPoint: 'localhost',
      port: 9000,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
      useSSL: false
    })
  ]
})

// Buckets
- wash-photos (before/after images)
- documents (inspection reports)
- exports (generated reports)
```

## Frontend (Nuxt 3 SSG)

### Structure
```
├── composables/
│   ├── useAuth.ts
│   ├── useWashTasks.ts
│   └── useNotifications.ts
├── stores/
│   ├── auth.ts
│   ├── tasks.ts
│   └── vehicles.ts
├── pages/
│   ├── workshop/
│   ├── washer/
│   └── planner/
```

### Key Components
- Role-based layouts
- Real-time task board (drag-drop)
- Mobile-responsive washer interface
- Dashboard with KPIs

### Tech Stack
- **UI**: shadcn-vue + Radix Vue
- **Styling**: TailwindCSS + CSS variables
- **State**: Pinia with persistence
- **Forms**: VeeValidate + Zod
- **Tables**: shadcn-vue DataTable (built-in)
- **API**: $fetch with ofetch interceptors
- **Auth**: @sidebase/nuxt-auth
- **i18n**: @nuxtjs/i18n
- **PWA**: @vite-pwa/nuxt
- **Charts**: Chart.js
- **Dates**: date-fns
- **Icons**: Lucide icons
- **WebSockets**: Socket.io client

### Nuxt Config
```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@sidebase/nuxt-auth'
  ],
  ssr: true,
  nitro: {
    prerender: {
      routes: ['/workshop', '/washer', '/planner']
    }
  }
})

## Documentation Requirements

### Code Documentation
1. **API Endpoints**: Swagger decorators with examples
2. **Services**: JSDoc with method descriptions
3. **DTOs**: Property descriptions and validation rules
4. **Composables**: Usage examples in comments

### Project Documentation
1. **README.md**: Setup, env vars, quick start
2. **API.md**: Endpoint reference, auth flow
3. **DEPLOYMENT.md**: Docker, PM2, nginx config
4. **CONTRIBUTING.md**: Code style, PR process

### User Documentation
1. **Workshop Guide**: How to submit wash requests
2. **Washer Manual**: Task management, status updates
3. **Planner Dashboard**: Reporting, analytics

## Testing Strategy

### Backend Testing
```
backend/
├── test/
│   ├── unit/
│   │   ├── services/
│   │   └── controllers/
│   ├── integration/
│   │   └── modules/
│   └── e2e/
│       └── api/
```

**Testing Stack**
- **Unit Tests**: Jest + @nestjs/testing
- **Integration**: SuperTest + Test database
- **E2E**: Playwright API testing
- **Coverage**: Jest coverage reports (min 80%)

**Test Scripts**
```json
"test": "jest",
"test:watch": "jest --watch",
"test:cov": "jest --coverage",
"test:e2e": "jest --config ./test/jest-e2e.json"
```

### Frontend Testing
```
frontend/
├── test/
│   ├── unit/
│   │   ├── components/
│   │   └── composables/
│   └── e2e/
│       └── scenarios/
```

**Testing Stack**
- **Unit Tests**: Vitest + @vue/test-utils
- **Component**: @testing-library/vue
- **E2E**: Playwright
- **Visual**: Storybook (optional)

**Test Scripts**
```json
"test": "vitest",
"test:unit": "vitest run",
"test:e2e": "playwright test",
"test:coverage": "vitest run --coverage"
```

### CI/CD Testing
```yaml
# .github/workflows/test.yml
- Run linting (ESLint, Prettier)
- Run unit tests with coverage
- Run integration tests
- Run E2E tests on staging
- SonarQube analysis
```

## Development Phases

**Phase 1 (Week 1-2)**
- Auth system + user management
- Basic CRUD for vehicles/tasks
- Swagger setup
- Unit test setup (80% coverage target)

**Phase 2 (Week 3-4)**
- Real-time updates
- Role-based frontends
- Task assignment logic
- Integration tests

**Phase 3 (Week 5-6)**
- Analytics dashboard
- Mobile optimization
- Integration APIs
- E2E test suite

## Developer Setup

### Monorepo Structure
```
wasplanning/
├── backend/          # NestJS API
├── frontend/         # Nuxt 3 SSG
├── docker/           # Docker configs
├── scripts/          # Dev scripts
├── package.json      # Root package.json
└── docker-compose.yml
```

### Root package.json
```json
{
  "scripts": {
    "dev": "concurrently -n \"DB,REDIS,MINIO,API,WEB\" -c \"yellow,red,magenta,blue,green\" \"npm:dev:*\"",
    "dev:db": "docker-compose up postgres",
    "dev:redis": "docker-compose up redis",
    "dev:minio": "docker-compose up minio",
    "dev:backend": "cd backend && npm run start:dev",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "db:setup": "cd backend && npm run migration:run && npm run seed",
    "storage:setup": "cd scripts && ./setup-minio-buckets.sh",
    "test": "concurrently \"cd backend && npm test\" \"cd frontend && npm test\"",
    "build": "cd frontend && npm run generate && cd ../backend && npm run build",
    "clean": "rm -rf backend/dist frontend/.output"
  }
}
```

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
    volumes:
      - pgdata:/var/lib/postgresql/data

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
    volumes:
      - minio_data:/data

volumes:
  pgdata:
  minio_data:
```

### Quick Start
```bash
# First time setup
npm run install:all
npm run db:setup

# Start everything
npm run dev

# Access
# API: http://localhost:3000
# Frontend: http://localhost:3001
# Swagger: http://localhost:3000/api/docs
# MinIO Console: http://localhost:9001
# Redis: localhost:6379
# Postgres: localhost:5432
```

## Deployment
- Docker containers
- PostgreSQL + Redis
- Nginx reverse proxy
- GitHub Actions CI/CD