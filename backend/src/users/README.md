# Users Module

This module handles user management within the multi-tenant Wasplanning system, providing CRUD operations, role-based access control, and tenant-aware user administration.

## Overview

The users module manages all user-related operations while maintaining strict tenant isolation. Users belong to specific tenants and have roles that determine their access levels within the system.

## Structure

```
users/
├── users.module.ts           # NestJS module definition
├── users.controller.ts       # REST API endpoints
├── users.controller.spec.ts  # Controller tests
├── users.service.ts          # Business logic implementation
├── users.service.spec.ts     # Service tests
├── dto/                      # Data Transfer Objects
│   ├── create-user.dto.ts    # User creation input
│   ├── update-user.dto.ts    # User update input
│   ├── reset-password.dto.ts # Password reset input
│   └── get-users-query.dto.ts # User filtering/pagination
└── interfaces/
    └── current-user.interface.ts # Current user context
```

## User Roles (Per Tenant)

The system defines 6 distinct roles with specific permissions:

1. **WERKPLAATS** (Workshop) - Submit wash requests only
2. **WASSERS** (Washers) - View queue, update wash status
3. **HAAL_BRENG_PLANNERS** (Pickup/Delivery Planners) - Manage return trips
4. **WASPLANNERS** (Wash Planners) - Manage queue and task assignments
5. **GARAGE_ADMIN** - Manage users and settings for their garage
6. **SUPER_ADMIN** - Manage all garages and global settings

## Key Features

### Multi-Tenant User Management
- **Tenant Isolation**: Users belong to specific tenants
- **Role-Based Access**: Permissions based on user roles
- **Cross-Tenant Admin**: Super admins can manage multiple tenants
- **Tenant-Specific Operations**: All operations respect tenant boundaries

### User Operations
- **Create Users**: With automatic password generation
- **Update Users**: Profile and role management
- **Password Management**: Reset and update passwords
- **User Status**: Activate/deactivate users
- **Filtering**: Search and filter users by various criteria

### Security Features
- **Password Hashing**: Secure bcrypt password storage
- **Role Validation**: Ensure users have appropriate permissions
- **Tenant Validation**: Verify user access to tenant resources
- **Audit Trail**: Track user creation and modifications

## API Endpoints

### GET /users
List users with filtering and pagination.

**Query Parameters:**
- `search` - Search by name or email
- `role` - Filter by user role
- `tenant` - Filter by tenant (super admin only)
- `status` - Filter by active/inactive status
- `page` - Pagination page number
- `limit` - Items per page

### GET /users/:id
Get specific user details.

### POST /users
Create a new user.

**Body:**
```typescript
{
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  tenant_id: string; // Super admin only
  password?: string;  // Optional, auto-generated if empty
  is_active: boolean;
}
```

### PATCH /users/:id
Update user information.

### POST /users/:id/reset-password
Reset user password.

**Body:**
```typescript
{
  new_password: string;
}
```

### PATCH /users/:id/activate
Activate a user account.

### PATCH /users/:id/deactivate  
Deactivate a user account.

## DTOs and Validation

### CreateUserDto
Validates user creation input:
- Email format validation
- Role validation against allowed values
- Password strength requirements (if provided)
- Required field validation

### UpdateUserDto
Validates user updates:
- Optional field updates
- Role change validation
- Prevents email modification
- Tenant ID protection

### GetUsersQueryDto
Handles filtering and pagination:
- Search term validation
- Role enum validation
- Pagination limits
- Sorting parameters

### ResetPasswordDto
Password reset validation:
- Password strength requirements
- Confirmation matching
- Security constraints

## Service Methods

### findAll(query, currentUser)
Returns paginated list of users with filtering:
- Applies tenant filtering for non-super admins
- Supports search across name and email
- Role and status filtering
- Respects pagination parameters

### findOne(id, currentUser)
Retrieves specific user:
- Validates tenant access permissions
- Returns user with tenant information
- Handles not found scenarios

### create(createUserDto, currentUser)
Creates new user:
- Validates tenant permissions
- Generates secure password if not provided
- Hashes password before storage
- Returns user data with temporary password

### update(id, updateUserDto, currentUser)
Updates existing user:
- Validates modification permissions
- Prevents unauthorized tenant changes
- Updates last modified timestamp
- Returns updated user data

### resetPassword(id, resetPasswordDto, currentUser)
Resets user password:
- Validates reset permissions
- Hashes new password
- Updates user record
- Logs password reset action

### activate/deactivate(id, currentUser)
Changes user status:
- Validates status change permissions
- Updates user active status
- Handles cascade effects
- Returns updated status

## Security Considerations

### Tenant Isolation
- Users can only access users within their tenant
- Super admins can access all tenants
- Strict validation of tenant boundaries

### Permission Validation
- Role-based operation permissions
- Tenant-aware access control
- Prevent privilege escalation

### Password Security
- Bcrypt hashing with salt rounds
- Automatic secure password generation
- Password strength enforcement
- Reset audit logging

## Integration Points

### Auth Module
- User authentication and JWT token generation
- Role-based access control
- Impersonation support for super admins

### Admin Module
- Tenant management integration
- Cross-tenant user administration
- Bulk user operations

### Common Module
- Pagination and filtering utilities
- Standardized response formats
- Validation decorators

## Testing

Comprehensive test suite covering:
- Controller endpoint testing
- Service method validation
- DTO validation testing
- Security permission testing
- Multi-tenant isolation testing

```bash
npm run test users
```

## Best Practices

1. **Tenant Context**: Always validate tenant access in operations
2. **Role Validation**: Verify user permissions before operations
3. **Password Security**: Use secure password generation and hashing
4. **Input Validation**: Validate all input through DTOs
5. **Error Handling**: Provide clear error messages
6. **Audit Logging**: Track user management operations
7. **Testing**: Maintain comprehensive test coverage

## Dependencies

- **@nestjs/common** - Framework decorators and utilities
- **@nestjs/typeorm** - Database integration
- **bcrypt** - Password hashing
- **class-validator** - DTO validation
- **class-transformer** - Data transformation
- Auth module entities (User, Tenant)
- Common module utilities