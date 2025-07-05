# Config Module

This module contains all configuration files and setup for the application's external dependencies and services.

## Overview

The config module centralizes all configuration logic, making it easy to manage environment-specific settings and service configurations.

## Structure

```
config/
├── data-source.ts      # TypeORM data source configuration for migrations
├── database.config.ts  # Database connection configuration
├── jwt.config.ts      # JWT authentication configuration
├── minio.config.ts    # MinIO/S3 storage configuration
└── redis.config.ts    # Redis cache configuration
```

## Configuration Files

### data-source.ts
TypeORM data source configuration used by the TypeORM CLI for running migrations and seeds.

**Key Features:**
- Loads environment variables
- Configures database connection
- Sets up migration and entity paths
- Used by `npm run migration:*` commands

**Usage:**
```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
```

### database.config.ts
Database configuration factory for the main application.

**Configuration:**
- PostgreSQL connection settings
- Connection pooling
- SSL configuration for production
- Logging settings

**Environment Variables:**
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `DATABASE_SSL`

### jwt.config.ts
JWT authentication configuration.

**Configuration:**
- Secret key management
- Token expiration times
- Signing algorithms

**Environment Variables:**
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

### minio.config.ts
MinIO (S3-compatible) object storage configuration.

**Configuration:**
- MinIO server connection
- Bucket management
- Access credentials
- Region settings

**Environment Variables:**
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_USE_SSL`
- `MINIO_BUCKET_PREFIX`

### redis.config.ts
Redis cache and session storage configuration.

**Configuration:**
- Redis server connection
- Connection pooling
- Retry logic
- Namespace configuration

**Environment Variables:**
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`

## Usage

### In Modules
```typescript
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### In Services
```typescript
constructor(private configService: ConfigService) {
  const dbHost = this.configService.get<string>('DATABASE_HOST');
}
```

## Environment Variables

All configurations use environment variables with sensible defaults for development:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=wasplanning
DATABASE_PASSWORD=wasplanning
DATABASE_NAME=wasplanning
DATABASE_SSL=false

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=wasplanning
MINIO_SECRET_KEY=wasplanning123
MINIO_USE_SSL=false
MINIO_BUCKET_PREFIX=wasplanning

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Development vs Production

### Development
- Uses local services (PostgreSQL, Redis, MinIO)
- Relaxed security settings
- Detailed logging enabled

### Production
- Uses environment-specific credentials
- SSL/TLS encryption enabled
- Connection pooling optimized
- Secure JWT secrets

## Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Validation**: Use `@nestjs/config` validation for required variables
3. **Type Safety**: Export TypeScript interfaces for configuration objects
4. **Documentation**: Document all environment variables
5. **Defaults**: Provide sensible defaults for development