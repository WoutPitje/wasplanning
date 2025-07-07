# Environment Configuration Guide

## Overview

This document provides comprehensive configuration guidance for all environment variables used across the Wasplanning system components.

## Environment Files Structure

```
wasplanning/
├── backend/.env                 # Backend API configuration
├── frontend/.env                # Frontend web app configuration
├── mobile/.env                  # Mobile app configuration
├── docker/.env                  # Docker services configuration
├── .env.example                 # Example environment file
├── .env.development             # Development overrides
├── .env.production              # Production overrides
└── .env.test                    # Test environment
```

## Backend Configuration (backend/.env)

### Database Configuration
```env
# PostgreSQL Database
DATABASE_URL=postgresql://dev:dev123@localhost:5432/wasplanning
DATABASE_TEST_URL=postgresql://dev:dev123@localhost:5432/wasplanning_test

# Connection Pool Settings
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dev
DB_PASSWORD=dev123
DB_NAME=wasplanning
DB_SYNC=false
DB_LOGGING=false
DB_MAX_CONNECTIONS=100
DB_SSL_MODE=disable
```

### Redis Configuration
```env
# Redis Cache & Session Store
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600
```

### JWT Authentication
```env
# JWT Token Configuration
JWT_SECRET=your-256-bit-secret-key-here-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=wasplanning-api
JWT_AUDIENCE=wasplanning-app
```

### MinIO Object Storage
```env
# MinIO S3-Compatible Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=wasplanning
MINIO_REGION=us-east-1
```

### Application Settings
```env
# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3001
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Multi-location Features
ENABLE_MULTI_LOCATION=true
DEFAULT_LOCATION_NAME=Hoofdvestiging
MAX_LOCATIONS_PER_TENANT=10
ENABLE_CROSS_LOCATION_ASSIGNMENTS=true
```

### WebSocket Configuration
```env
# Real-time WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=http://localhost:3001
WS_ADAPTER=redis
WS_REDIS_URL=redis://localhost:6379
```

### External APIs
```env
# RDW API (Vehicle Information)
RDW_API_URL=https://opendata.rdw.nl/resource
RDW_API_KEY=your-rdw-api-key
RDW_API_TIMEOUT=5000

# Mollie Payment API
MOLLIE_API_KEY=test_your-mollie-api-key
MOLLIE_WEBHOOK_URL=https://your-domain.nl/api/webhooks/mollie
```

### Logging & Monitoring
```env
# Application Logging
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Monitoring
SENTRY_DSN=your-sentry-dsn
HEALTH_CHECK_PORT=3002
METRICS_PORT=3003
```

## Frontend Configuration (frontend/.env)

### API Configuration
```env
# Backend API
NUXT_PUBLIC_API_URL=http://localhost:3000
NUXT_PUBLIC_API_TIMEOUT=10000
NUXT_PUBLIC_API_RETRY_ATTEMPTS=3
```

### WebSocket Configuration
```env
# Real-time WebSocket
NUXT_PUBLIC_WS_URL=ws://localhost:3001
NUXT_PUBLIC_WS_RECONNECT_ATTEMPTS=5
NUXT_PUBLIC_WS_RECONNECT_INTERVAL=3000
```

### Application Settings
```env
# Application Configuration
NUXT_PUBLIC_APP_NAME=Wasplanning
NUXT_PUBLIC_APP_VERSION=1.0.0
NUXT_PUBLIC_APP_DESCRIPTION=Car Wash Planning System
NUXT_PUBLIC_DEFAULT_LOCALE=nl
NUXT_PUBLIC_SUPPORTED_LOCALES=nl,en

# Multi-location Features
NUXT_PUBLIC_ENABLE_MULTI_LOCATION=true
NUXT_PUBLIC_ENABLE_LOCATION_SELECTOR=true
NUXT_PUBLIC_ENABLE_CROSS_LOCATION_VIEWS=true
```

### Security Configuration
```env
# Security Headers
NUXT_PUBLIC_CSP_ENABLED=true
NUXT_PUBLIC_HSTS_ENABLED=true
NUXT_PUBLIC_REFERRER_POLICY=strict-origin-when-cross-origin
```

### Third-party Services
```env
# Analytics (Optional)
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
NUXT_PUBLIC_HOTJAR_ID=your-hotjar-id

# Error Tracking
NUXT_PUBLIC_SENTRY_DSN=your-frontend-sentry-dsn
```

## Mobile Configuration (mobile/.env)

### API Configuration
```env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=10000
```

### Application Settings
```env
# App Configuration
EXPO_PUBLIC_APP_NAME=Wasplanning
EXPO_PUBLIC_APP_SLUG=wasplanning
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_APP_SCHEME=wasplanning

# Multi-location Features
EXPO_PUBLIC_ENABLE_MULTI_LOCATION=true
EXPO_PUBLIC_ENABLE_LOCATION_FILTERING=true
EXPO_PUBLIC_DEFAULT_LOCATION_VIEW=user_assigned
```

### Platform-specific Settings
```env
# iOS Configuration
EXPO_PUBLIC_IOS_BUNDLE_ID=nl.wasplanning.mobile
EXPO_PUBLIC_IOS_BUILD_NUMBER=1

# Android Configuration
EXPO_PUBLIC_ANDROID_PACKAGE=nl.wasplanning.mobile
EXPO_PUBLIC_ANDROID_VERSION_CODE=1
```

### Device Features
```env
# Camera & Permissions
EXPO_PUBLIC_CAMERA_QUALITY=high
EXPO_PUBLIC_CAMERA_ASPECT_RATIO=16:9
EXPO_PUBLIC_PHOTO_COMPRESSION=0.8

# Push Notifications
EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true
EXPO_PUBLIC_NOTIFICATION_CHANNEL_ID=wasplanning-notifications
```

## Docker Configuration (docker/.env)

### PostgreSQL
```env
# PostgreSQL Container
POSTGRES_DB=wasplanning
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev123
POSTGRES_PORT=5432
POSTGRES_DATA_PATH=./data/postgres
```

### Redis
```env
# Redis Container
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DATA_PATH=./data/redis
```

### MinIO
```env
# MinIO Container
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_DATA_PATH=./data/minio
```

### Network Configuration
```env
# Docker Network
DOCKER_NETWORK_NAME=wasplanning-network
DOCKER_SUBNET=172.20.0.0/16
```

## Environment-Specific Configurations

### Development (.env.development)
```env
# Development Overrides
NODE_ENV=development
LOG_LEVEL=debug
DB_LOGGING=true
DB_SYNC=true
CORS_ORIGIN=*
THROTTLE_LIMIT=1000

# Multi-location Development Settings
ENABLE_MULTI_LOCATION=true
AUTO_CREATE_DEFAULT_LOCATION=true
ENABLE_LOCATION_SEEDING=true
```

### Production (.env.production)
```env
# Production Configuration
NODE_ENV=production
LOG_LEVEL=warn
DB_LOGGING=false
DB_SYNC=false
DB_SSL_MODE=require
CORS_ORIGIN=https://app.wasplanning.nl
THROTTLE_LIMIT=60
JWT_SECRET=your-production-jwt-secret-256-bits
MINIO_USE_SSL=true
REDIS_PASSWORD=your-redis-password

# Multi-location Production Settings
ENABLE_MULTI_LOCATION=true
MAX_LOCATIONS_PER_TENANT=50
ENABLE_LOCATION_ANALYTICS=true
ENABLE_CROSS_LOCATION_REPORTING=true
```

### Test (.env.test)
```env
# Test Environment
NODE_ENV=test
LOG_LEVEL=error
DATABASE_URL=postgresql://test:test123@localhost:5432/wasplanning_test
REDIS_URL=redis://localhost:6380
JWT_SECRET=test-jwt-secret
MINIO_BUCKET_NAME=wasplanning-test
```

## Security Best Practices

### Secret Management
```env
# Use strong secrets (256-bit minimum)
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
```

### Production Checklist
- [ ] Change all default passwords
- [ ] Use environment-specific JWT secrets
- [ ] Enable SSL/TLS for all services
- [ ] Configure proper CORS origins
- [ ] Set appropriate rate limits
- [ ] Enable database SSL connections
- [ ] Use secure session storage
- [ ] Configure proper logging levels
- [ ] Set up monitoring and alerting
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)

## Docker Compose Environment

### Development (docker-compose.yml)
```yaml
version: '3.8'
services:
  postgres:
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  
  redis:
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
  
  minio:
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
```

### Production (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    secrets:
      - jwt_secret
      - db_password
      - redis_password
```

## Environment Variable Validation

### Backend Validation (NestJS)
```typescript
// config/validation.ts
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsOptional()
  @IsBoolean()
  DB_LOGGING?: boolean;
}
```

### Frontend Validation (Nuxt)
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // Private keys (only available on server-side)
    jwtSecret: process.env.JWT_SECRET,
    
    // Public keys (exposed to client)
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
      wsUrl: process.env.NUXT_PUBLIC_WS_URL,
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Wasplanning',
    }
  }
})
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Confirm credentials are correct

2. **Redis Connection Failed**
   - Check REDIS_URL format
   - Verify Redis server is running
   - Confirm password if set

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration times
   - Verify token format

4. **MinIO Connection Failed**
   - Check MINIO_ENDPOINT and port
   - Verify credentials
   - Confirm SSL settings

5. **CORS Issues**
   - Check CORS_ORIGIN setting
   - Verify frontend URL matches
   - Ensure proper protocol (http/https)

### Debug Commands
```bash
# Check environment variables
printenv | grep -E "(DATABASE|REDIS|JWT|MINIO)"

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Test Redis connection
redis-cli -u $REDIS_URL ping

# Validate JWT secret
echo $JWT_SECRET | wc -c  # Should be 64+ characters
```

## Migration Guide

### From Development to Production
1. Copy `.env.example` to `.env.production`
2. Update all secrets and passwords
3. Change database URLs to production instances
4. Update CORS origins to production domains
5. Enable SSL/TLS for all services
6. Configure production logging levels
7. Set up monitoring and alerting

### Environment Variable Checklist
- [ ] All required variables are set
- [ ] No development values in production
- [ ] Secrets are properly generated
- [ ] Database connections tested
- [ ] External API keys configured
- [ ] Logging levels appropriate
- [ ] Security headers enabled
- [ ] Monitoring configured