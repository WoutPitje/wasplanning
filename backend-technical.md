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