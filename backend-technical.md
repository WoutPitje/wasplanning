# Backend Technical Specification

## NestJS API Architecture

### Module Structure
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
- **AuthModule**: JWT auth, role-based access + tenant context
- **TenantModule**: Multi-tenant management, garage admin
- **UsersModule**: User management, roles, availability (tenant-scoped)
- **VehiclesModule**: Vehicle registration, status tracking (tenant-scoped)
- **WashTasksModule**: Task queue, assignment, status updates (tenant-scoped)
- **NotificationsModule**: Real-time updates via WebSockets (tenant-aware)
- **PaymentsModule**: Mollie integration, subscription management (tenant-scoped)

### Database (PostgreSQL + TypeORM)

**Entity Relationship Diagram**: See [database-schema.md](./database-schema.md) for complete ERD

**Multi-Tenant Entities**
```typescript
@Entity('tenants')
class Tenant {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() name: string
  @Column() slug: string
  @Column({ nullable: true }) logo_url: string
  @Column({ type: 'json', nullable: true }) settings: object
}

@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() email: string
  @Column({ type: 'enum', enum: UserRole }) role: UserRole
  @Column('text', { array: true }) skills: string[]
  
  // Multi-tenant foreign key
  @Column() tenant_id: string
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant
}

@Entity('vehicles')
class Vehicle {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() license_plate: string
  @Column() tenant_id: string // Tenant isolation
  @ManyToOne(() => Tenant)
  tenant: Tenant
}

@Entity('wash_tasks')
class WashTask {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() vehicle_id: string
  @Column() assigned_user_id: string
  @Column() tenant_id: string // Tenant isolation
  @ManyToOne(() => Tenant)
  tenant: Tenant
}

@Entity('subscriptions')
class Subscription {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() mollie_subscription_id: string
  @Column() tenant_id: string // Tenant isolation
  @Column({ type: 'enum', enum: SubscriptionStatus }) status: SubscriptionStatus
  @Column() plan_type: string // starter, groei, enterprise
  @Column('decimal', { precision: 10, scale: 2 }) amount: number
  @Column() next_payment_date: Date
  @ManyToOne(() => Tenant)
  tenant: Tenant
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
- DTOs with class-validator + tenant validation
- TypeORM with auto-migrations + Row-Level Security
- Redis for queue management (BullMQ) with tenant namespacing
- WebSocket gateway for real-time updates (tenant rooms)
- Request logging with Pino (tenant context)
- File storage with MinIO (tenant-specific buckets)
- Multi-tenant JWT tokens with tenant context
- Mollie payment integration for subscription billing

### Multi-Tenancy Implementation

#### Tenant Context Injection
```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest()
    const tenantId = this.extractTenantId(request)
    
    // Set tenant context for entire request
    TenantContext.setTenantId(tenantId)
    
    return next.handle()
  }
}
```

#### Row-Level Security
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY; 
ALTER TABLE wash_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_users ON users 
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

#### Tenant-Aware Services
```typescript
@Injectable()
export class VehicleService {
  async findAll(): Promise<Vehicle[]> {
    const tenantId = TenantContext.getTenantId()
    return this.vehicleRepository.find({
      where: { tenant_id: tenantId }
    })
  }
}
```

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

### Testing Strategy

#### Backend Testing
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

### CI/CD Testing
```yaml
# .github/workflows/test.yml
- Run linting (ESLint, Prettier)
- Run unit tests with coverage
- Run integration tests with test database
- Run E2E tests on staging environment
- SonarQube analysis
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://dev:dev123@localhost:5432/wasplanning
DATABASE_TEST_URL=postgresql://dev:dev123@localhost:5432/wasplanning_test

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# Application
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# WebSockets
WS_CORS_ORIGIN=http://localhost:3001

# External APIs
RDW_API_KEY=your-rdw-api-key
MOLLIE_API_KEY=your-mollie-api-key
```

### Deployment Configuration
```dockerfile
# Production Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### API Documentation
- Swagger UI available at `/api/docs`
- OpenAPI 3.0 specification
- Role-based endpoint documentation
- Request/response examples
- Authentication requirements

### Performance Considerations
- Database connection pooling
- Redis caching for frequently accessed data
- Efficient database queries with proper indexing
- Rate limiting per tenant and user
- Background job processing for heavy operations

### Security Features
- Multi-tenant data isolation
- Role-based access control
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Audit logging for sensitive operations