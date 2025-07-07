# WasPlanning Security Configuration Guide

## Table of Contents
1. [Security Overview](#security-overview)
2. [Infrastructure Security](#infrastructure-security)
3. [Application Security](#application-security)
4. [Data Security](#data-security)
5. [Authentication & Authorization](#authentication--authorization)
6. [Network Security](#network-security)
7. [Monitoring & Incident Response](#monitoring--incident-response)
8. [Compliance](#compliance)
9. [Security Checklist](#security-checklist)

## Security Overview

WasPlanning implements multiple layers of security to protect customer data and ensure system integrity:

- **Defense in Depth**: Multiple security layers from network to application
- **Zero Trust**: Verify everything, trust nothing
- **Least Privilege**: Minimal access rights for all components
- **Data Isolation**: Complete tenant separation at all levels

## Infrastructure Security

### Server Hardening

1. **Operating System**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Use SSH keys only
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

2. **Docker Security**
```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Use user namespaces
echo '{"userns-remap": "default"}' | sudo tee /etc/docker/daemon.json

# Limit container resources
# See docker-compose.prod.yml for resource limits

# Regular security scanning
docker scan backend:latest
```

3. **File System Security**
```bash
# Secure sensitive directories
chmod 700 /opt/wasplanning
chmod 600 /opt/wasplanning/.env.production

# Enable file integrity monitoring
sudo apt install aide
sudo aideinit
```

## Application Security

### API Security

1. **Rate Limiting**
```typescript
// backend/src/main.ts
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter limits for auth endpoints
app.use(
  '/api/v1/auth/*',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per 15 minutes
    skipSuccessfulRequests: true,
  })
);
```

2. **Input Validation**
```typescript
// Use class-validator for all DTOs
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

3. **CORS Configuration**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

4. **Security Headers**
```typescript
// backend/src/main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Frontend Security

1. **Content Security Policy**
```javascript
// frontend/nuxt.config.ts
export default defineNuxtConfig({
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'https:'],
        'script-src': ["'self'", "'nonce-{{nonce}}'"],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-site',
      permissionsPolicy: {
        camera: ['none'],
        microphone: ['none'],
        geolocation: ['self'],
      },
    },
  },
});
```

2. **XSS Prevention**
- Always use Vue's template syntax for rendering
- Never use `v-html` with user input
- Sanitize all user-generated content
- Use DOMPurify for HTML sanitization when needed

## Data Security

### Database Security

1. **Encryption at Rest**
```sql
-- Enable encryption for PostgreSQL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
```

2. **Row-Level Security**
```sql
-- Enable RLS for all tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation ON users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

3. **Database Backups**
- Automated daily backups
- Encrypted backup storage
- Regular restore testing
- Off-site backup replication

### File Storage Security

1. **MinIO Configuration**
```bash
# Enable encryption
mc admin config set myminio encryption_sse_s3 enable

# Set up access policies
mc admin policy add myminio tenant-policy tenant-policy.json

# Enable versioning
mc version enable myminio/wasplanning-files
```

2. **Per-Tenant Isolation**
- Separate buckets per tenant
- IAM policies for bucket access
- Signed URLs for file access
- Automatic file virus scanning

## Authentication & Authorization

### JWT Security

1. **Token Configuration**
```typescript
// Strong secret keys (min 256 bits)
JWT_SECRET=<64-character-random-string>
REFRESH_TOKEN_SECRET=<64-character-random-string>

// Short-lived access tokens
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

2. **Password Security**
```typescript
// bcrypt with high cost factor
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
```

3. **Multi-Factor Authentication** (Future)
```typescript
// TOTP implementation
import { authenticator } from 'otplib';

// Generate secret
const secret = authenticator.generateSecret();

// Verify token
const isValid = authenticator.verify({ token, secret });
```

### Role-Based Access Control

```typescript
// Guards for role checking
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  // Admin-only endpoints
}
```

## Network Security

### SSL/TLS Configuration

1. **Nginx SSL Config**
```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

2. **Certificate Management**
```bash
# Automated Let's Encrypt renewal
0 0 * * * /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Firewall Rules

```bash
# iptables rules
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s <admin-ip> -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

## Monitoring & Incident Response

### Security Monitoring

1. **Log Collection**
```yaml
# Collect security-relevant logs
- Authentication attempts
- Authorization failures
- API errors (4xx, 5xx)
- Database queries
- File access
```

2. **Alerting Rules**
```yaml
- Multiple failed login attempts
- Unusual API usage patterns
- Privilege escalation attempts
- Data exfiltration patterns
- Service availability issues
```

3. **Incident Response Plan**
```markdown
1. Detection & Analysis
   - Identify the incident
   - Determine scope and impact
   - Preserve evidence

2. Containment
   - Isolate affected systems
   - Prevent further damage
   - Maintain business operations

3. Eradication
   - Remove threat
   - Patch vulnerabilities
   - Update security controls

4. Recovery
   - Restore systems
   - Verify functionality
   - Monitor for recurrence

5. Post-Incident
   - Document lessons learned
   - Update procedures
   - Improve defenses
```

## Compliance

### GDPR Compliance

1. **Data Protection**
- Encryption in transit and at rest
- Data minimization
- Purpose limitation
- Regular data audits

2. **User Rights**
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability

3. **Privacy by Design**
- Data protection impact assessments
- Privacy-preserving defaults
- Transparent data processing

### Security Auditing

```bash
# Regular security scans
npm audit
docker scan
trivy image backend:latest

# Dependency updates
npm update
npm audit fix

# Code analysis
npm run lint:security
```

## Security Checklist

### Pre-Deployment
- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] SSL certificates valid
- [ ] Firewall rules configured
- [ ] Backup system tested
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented

### Post-Deployment
- [ ] Penetration testing completed
- [ ] Security scan passed
- [ ] Access logs reviewed
- [ ] User permissions audited
- [ ] Backup restoration tested
- [ ] Monitoring dashboards operational
- [ ] Team security training completed

### Ongoing
- [ ] Weekly dependency updates
- [ ] Monthly security reviews
- [ ] Quarterly penetration tests
- [ ] Annual security audit
- [ ] Continuous security training

## Security Contacts

- **Security Team**: security@wasplanning.nl
- **Incident Response**: incident@wasplanning.nl
- **Data Protection Officer**: dpo@wasplanning.nl

---

Remember: Security is not a one-time task but an ongoing process. Stay vigilant and keep improving!