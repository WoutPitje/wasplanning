# Deployment Guide

## Production Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx/Traefik]
    end
    
    subgraph "Application Tier"
        API1[NestJS API Instance 1]
        API2[NestJS API Instance 2]
        WEB[Nuxt Static Site]
    end
    
    subgraph "Data Tier"
        DB[(PostgreSQL)]
        REDIS[(Redis Cluster)]
        S3[(S3/MinIO)]
    end
    
    subgraph "Mobile"
        IOS[iOS App]
        ANDROID[Android App]
    end
    
    LB --> API1
    LB --> API2
    LB --> WEB
    
    API1 --> DB
    API1 --> REDIS
    API1 --> S3
    
    API2 --> DB
    API2 --> REDIS
    API2 --> S3
    
    IOS --> LB
    ANDROID --> LB
```

## Docker Deployment

### Production docker-compose.yml
```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
      - web

  api:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis

  web:
    build: ./frontend
    environment:
      NUXT_PUBLIC_API_URL: ${API_URL}

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/wasplanning
DB_NAME=wasplanning
DB_USER=wasplanning_user
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=very_secure_jwt_secret_key_here

# Storage
MINIO_USER=admin
MINIO_PASSWORD=secure_minio_password

# API
API_URL=https://api.wasplanning.nl
```

## Cloud Deployment Options

### Option 1: VPS/Dedicated Server
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and setup
git clone https://github.com/yourusername/wasplanning.git
cd wasplanning
cp .env.example .env
# Edit .env with production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.wasplanning.nl -d app.wasplanning.nl
```

### Option 2: AWS/Azure/GCP
- **API**: App Service / Elastic Beanstalk / Cloud Run
- **Database**: RDS PostgreSQL / Azure Database / Cloud SQL
- **Cache**: ElastiCache Redis / Azure Cache / Memorystore
- **Storage**: S3 / Blob Storage / Cloud Storage
- **Frontend**: CloudFront + S3 / CDN + Storage

### Option 3: Kubernetes
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wasplanning-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wasplanning-api
  template:
    metadata:
      labels:
        app: wasplanning-api
    spec:
      containers:
      - name: api
        image: wasplanning/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Mobile App Deployment

### iOS App Store
```bash
# Configure EAS
npx eas configure

# Build for iOS
npx eas build --platform ios --profile production

# Submit to App Store
npx eas submit --platform ios
```

### Google Play Store
```bash
# Build for Android
npx eas build --platform android --profile production

# Submit to Play Store
npx eas submit --platform android
```

### EAS Configuration (eas.json)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Monitoring & Maintenance

### Health Checks
```typescript
// backend/src/health/health.controller.ts
@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    () => this.http.pingCheck('api', 'http://localhost:3000'),
    () => this.db.pingCheck('database'),
    () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
  ]);
}
```

### Logging
- **Backend**: Winston + structured logging
- **Frontend**: Sentry for error tracking
- **Infrastructure**: ELK Stack or Datadog

### Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# File storage backup
aws s3 sync s3://wasplanning-files s3://wasplanning-backup
```

### Scaling Considerations
- **Horizontal**: Multiple API instances behind load balancer
- **Database**: Read replicas for reporting
- **Cache**: Redis cluster for high availability
- **CDN**: Static assets via CloudFront/CloudFlare
- **Auto-scaling**: Based on CPU/memory metrics

## CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh ${{ secrets.DEPLOY_HOST }} "cd /opt/wasplanning && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
```

## Security Considerations

- **HTTPS**: Force SSL/TLS for all communications
- **API Rate Limiting**: Prevent abuse
- **Database**: Encrypted at rest and in transit
- **Secrets**: Use environment variables, never commit
- **CORS**: Restrict origins in production
- **Firewall**: Only necessary ports open
- **Updates**: Regular security patches