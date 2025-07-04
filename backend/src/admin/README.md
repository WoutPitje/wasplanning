# Admin Module

## Overview
The Admin module provides cross-tenant management capabilities for Super Administrators in the Wasplanning system. It enables Super Admins to create, manage, and monitor tenants (garages) across the entire platform.

## Features
- Tenant creation with automatic admin user generation
- Complete tenant CRUD operations
- Tenant statistics and monitoring
- Cross-tenant access (Super Admin only)
- Tenant lifecycle management (activation/deactivation)

## Access Control
- **Super Admin Only**: All endpoints require `SUPER_ADMIN` role
- **Cross-Tenant**: Super Admins can manage all tenants regardless of their own tenant affiliation
- **Protected Routes**: All endpoints use JWT authentication with role-based guards

## API Endpoints

### Tenant Management
- `POST /admin/tenants` - Create new tenant with admin user
  - Body: `CreateTenantDto` (name, display_name, logo_url, admin details)
  - Returns: Created tenant + admin user with temporary password
  - Auto-generates secure temporary password for garage admin

- `GET /admin/tenants` - List all tenants
  - Returns: Array of all tenants (basic info only)
  - Ordered by creation date (newest first)

- `GET /admin/tenants/:id` - Get tenant details with users
  - Returns: Full tenant info including user list (passwords excluded)
  - Includes all tenant users for management overview

- `GET /admin/tenants/:id/stats` - Get tenant statistics
  - Returns: User counts, role distribution, activity metrics
  - Useful for monitoring tenant health and usage

- `PATCH /admin/tenants/:id` - Update tenant
  - Body: `UpdateTenantDto` (display_name, logo_url, is_active, settings)
  - Returns: Updated tenant information

- `DELETE /admin/tenants/:id` - Deactivate tenant
  - Soft delete: Sets `is_active = false`
  - Preserves data for potential reactivation
  - Returns: Confirmation message

## DTOs

### CreateTenantDto
```typescript
{
  name: string;              // Unique tenant identifier (slug)
  display_name: string;      // Human-readable name
  logo_url?: string;         // Optional logo URL
  admin_email: string;       // Admin user email
  admin_first_name: string;  // Admin first name
  admin_last_name: string;   // Admin last name
}
```

### UpdateTenantDto
```typescript
{
  display_name?: string;     // Update display name
  logo_url?: string;         // Update logo URL
  is_active?: boolean;       // Activate/deactivate tenant
  settings?: object;         // Tenant-specific settings
}
```

### CreateTenantResponseDto
```typescript
{
  tenant: Tenant;            // Created tenant object
  admin_user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    temporary_password: string;  // 12-character secure password
  };
  instructions: string;      // Setup instructions for garage admin
}
```

## Business Logic

### Tenant Creation Flow
1. **Validation**: Check tenant name and admin email uniqueness
2. **Tenant Creation**: Create tenant record with basic info
3. **Admin User Creation**: Generate garage admin user with temporary password
4. **Password Generation**: 12-character secure password (uppercase, lowercase, numbers, symbols)
5. **Response**: Return tenant info + admin credentials + setup instructions

### Temporary Password Generation
- 12 characters long
- Mixed case letters, numbers, and symbols
- Excludes confusing characters (0, O, I, l)
- Pattern: `[A-HJ-NP-Za-hj-np-z2-9!@#$%]+`

### Tenant Statistics
- **total_users**: Count of all users in tenant
- **active_users**: Count of active users only
- **users_by_role**: Breakdown by UserRole enum
- **created_at**: Tenant creation timestamp
- **last_updated**: Most recent tenant modification

## Guards and Security

### Authentication Guards
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
```

### Route Protection
- **JwtAuthGuard**: Validates JWT token and extracts user info
- **RolesGuard**: Ensures user has SUPER_ADMIN role
- **@ApiBearerAuth()**: Swagger security documentation

### Data Validation
- **UUID Validation**: All tenant IDs validated with `ParseUUIDPipe`
- **DTO Validation**: Input validation with class-validator decorators
- **Uniqueness Checks**: Prevent duplicate tenant names and admin emails

## Usage Examples

### Create New Garage
```typescript
POST /admin/tenants
Authorization: Bearer <super_admin_token>
{
  "name": "garage-amsterdam-west",
  "display_name": "Garage Amsterdam West",
  "logo_url": "https://example.com/logo.png",
  "admin_email": "admin@garage-amsterdam-west.nl",
  "admin_first_name": "Piet",
  "admin_last_name": "Janssen"
}
```

### Monitor Tenant Activity
```typescript
GET /admin/tenants/550e8400-e29b-41d4-a716-446655440000/stats
Authorization: Bearer <super_admin_token>

Response:
{
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_name": "garage-amsterdam-west",
  "total_users": 8,
  "active_users": 7,
  "users_by_role": {
    "GARAGE_ADMIN": 1,
    "WASSERS": 3,
    "WERKPLAATS": 2,
    "WASPLANNERS": 1,
    "HAAL_BRENG_PLANNERS": 1
  }
}
```

## Testing

### Unit Tests
- **Service Tests**: Complete coverage of TenantsService methods
- **Controller Tests**: HTTP endpoint testing with mocked services
- **Error Handling**: ConflictException and NotFoundException scenarios
- **Security Tests**: Role and guard validation

### E2E Tests
- **Full Integration**: Real database operations with test tenant creation
- **Authentication Flow**: Super admin login and token usage
- **CRUD Operations**: Complete create, read, update, delete testing
- **Validation Testing**: UUID validation, uniqueness constraints
- **Cleanup**: Automatic test data cleanup after each test

### Running Tests
```bash
# Unit tests
npm test -- admin

# E2E tests
npm run test:e2e -- --testNamePattern="Admin"

# Coverage report
npm run test:cov -- admin
```

## Error Handling

### Validation Errors
- **400 Bad Request**: Invalid UUID format, missing required fields
- **409 Conflict**: Duplicate tenant name or admin email
- **404 Not Found**: Tenant not found for read/update/delete operations

### Authentication Errors
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions (non-Super Admin)

## Integration with Auth Module

### Dependencies
- **AuthService**: Used for creating admin users with proper password hashing
- **User/Tenant Entities**: Shared entity definitions
- **UserRole Enum**: Role validation and assignment

### Multi-Tenant Architecture
- **Tenant Isolation**: Each tenant operates independently
- **Cross-Tenant Access**: Super Admins can access all tenants
- **Tenant Context**: Admin users created with proper tenant association

## Environment Configuration

### Required Variables
```env
# Database connection (shared with main app)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=wasplanning
DATABASE_PASSWORD=wasplanning_dev
DATABASE_NAME=wasplanning

# JWT configuration (shared with auth module)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Future Enhancements

### Planned Features
- **Tenant Templates**: Predefined configurations for different garage types
- **Bulk Operations**: Create multiple tenants from CSV import
- **Usage Analytics**: Detailed tenant usage and performance metrics
- **Billing Integration**: Connect with payment processing for subscription management
- **Tenant Migration**: Tools for moving data between environments

### API Versioning
- Current version: `/admin/tenants`
- Future version: `/api/v2/admin/tenants`
- Backward compatibility maintained for one major version

## Migration Notes
- Tenant `id` fields use UUID format
- All timestamps in UTC
- Soft delete pattern: `is_active` field instead of hard deletion
- Foreign key constraints maintain data integrity
- Index on `tenant.name` for unique constraint and fast lookups