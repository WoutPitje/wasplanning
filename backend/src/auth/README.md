# Auth Module

## Overview
The Auth module provides multi-tenant authentication and authorization for the Wasplanning system. It implements JWT-based authentication with role-based access control (RBAC) and tenant isolation.

## Features
- JWT authentication with access and refresh tokens
- Multi-tenant support with tenant context in JWT payload
- Role-based access control (6 user roles)
- Password hashing with bcrypt
- Guards for authentication and authorization
- Tenant isolation at the request level

## User Roles
1. **WERKPLAATS** - Workshop staff (submit wash requests)
2. **WASSERS** - Washers (view queue, update status)
3. **HAAL_BRENG_PLANNERS** - Pickup/delivery planners
4. **WASPLANNERS** - Wash planners (manage queue)
5. **GARAGE_ADMIN** - Garage administrators
6. **SUPER_ADMIN** - System administrators (cross-tenant access)

## API Endpoints

### Public Endpoints
- `POST /auth/login` - User authentication
  - Body: `{ email: string, password: string }`
  - Returns: `{ access_token, refresh_token, user }`

- `POST /auth/refresh` - Refresh access token
  - Body: `{ refresh_token: string }`
  - Returns: `{ access_token, refresh_token, user }`

### Protected Endpoints
- `GET /auth/profile` - Get current user profile
  - Requires: Bearer token
  - Returns: User profile with tenant information

## Guards

### JwtAuthGuard
- Validates JWT tokens on protected routes
- Checks `@Public()` decorator to skip validation
- Usage: `@UseGuards(JwtAuthGuard)`

### LocalAuthGuard
- Validates email/password for login
- Used only on login endpoint
- Usage: `@UseGuards(LocalAuthGuard)`

### RolesGuard
- Checks if user has required roles
- Super admin bypasses all role checks
- Usage: `@Roles(UserRole.GARAGE_ADMIN)` with `@UseGuards(RolesGuard)`

### TenantGuard
- Ensures tenant isolation
- Adds tenant context to requests
- Super admin can access all tenants
- Usage: `@UseGuards(TenantGuard)`

## Decorators

### @Public()
- Marks endpoints as publicly accessible
- Bypasses JWT authentication
- Usage: `@Public()` on controller method

### @Roles(...roles)
- Specifies required roles for endpoint
- Multiple roles = OR condition
- Usage: `@Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)`

### @CurrentUser()
- Injects authenticated user into controller
- Usage: `@CurrentUser() user`

## Entities

### Tenant
- Represents a garage/organization
- Fields: id, name, display_name, logo_url, settings, is_active
- Relations: Has many users

### User
- Represents system users
- Fields: id, email, password, first_name, last_name, role, is_active, last_login
- Relations: Belongs to tenant
- Passwords are hashed with bcrypt (12 rounds)

## JWT Payload Structure
```typescript
{
  sub: string;        // User ID
  email: string;      // User email
  role: string;       // User role
  tenantId: string;   // Tenant ID
  tenantName: string; // Tenant name
}
```

## Usage Examples

### Protected Route with Role Check
```typescript
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  @Get()
  @Roles(UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  async findAll() {
    // Only garage admins and wash planners can access
  }
}
```

### Getting Current User
```typescript
@Get('my-tasks')
@UseGuards(JwtAuthGuard)
async getMyTasks(@CurrentUser() user) {
  // user contains full user object with tenant
  const tenantId = user.tenant.id;
}
```

### Multi-Tenant Isolation
```typescript
@Get(':tenantId/users')
@UseGuards(JwtAuthGuard, TenantGuard)
async getTenantUsers(@Param('tenantId') tenantId: string) {
  // TenantGuard ensures user can only access their tenant
  // Super admin can access any tenant
}
```

## Testing

### Unit Tests
- Run: `npm test`
- Coverage: ~100% for all auth components
- Mocks: Database repositories and JWT service

### E2E Tests
- Run: `npm run test:e2e`
- Requires: PostgreSQL test database
- Tests: Full authentication flow, multi-tenancy, role-based access

### Test Database Setup
```bash
# Create test database and run migrations
npm run test:setup

# Run E2E tests
npm run test:e2e
```

## Security Considerations
- Passwords hashed with bcrypt (12 salt rounds)
- JWT secrets should be strong and unique per environment
- Tokens expire after 7 days (configurable)
- Refresh tokens expire after 30 days
- Tenant isolation enforced at guard level
- Super admin access logged for audit

## Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

## Migration Notes
- Entity columns with `nullable: true` should not use union types
- Use base types only (e.g., `string` not `string | null`)
- Run migrations with: `npm run migration:run`
- Create new migration: `npm run migration:create -- src/migrations/MigrationName`