# Locations Module

## Overview
The Locations module manages physical garage locations for the Wasplanning system. This is a simplified implementation focusing on the core multi-tenant, multi-location architecture where each garage (tenant) can operate multiple physical locations based on their subscription plan.

## Features

### Core Functionality
- **Location Management**: Create, read, update, and soft-delete locations
- **Multi-tenant Isolation**: Complete data separation between garages  
- **Subscription Limits**: Enforce location limits based on subscription plan
- **User Assignment**: Manage which users have access to which locations

## Database Schema

### locations
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR NOT NULL,
  address VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_locations
```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, location_id)
);
```

## API Endpoints

### Location Management
- `GET /api/v1/locations` - List all locations for tenant
- `GET /api/v1/locations/:id` - Get location details
- `POST /api/v1/locations` - Create new location (check subscription limits)
- `PATCH /api/v1/locations/:id` - Update location
- `DELETE /api/v1/locations/:id` - Soft delete location
- `POST /api/v1/locations/:id/users` - Assign users to location
- `DELETE /api/v1/locations/:id/users/:userId` - Remove user from location

## DTOs

### CreateLocationDto
```typescript
{
  name: string; // Required, min 2 chars
  address?: string; // Optional
}
```

### UpdateLocationDto
- Same as CreateLocationDto but all fields optional

### LocationResponseDto
```typescript
{
  id: string;
  name: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### AssignUsersDto
```typescript
{
  user_ids: string[]; // Array of user IDs to assign
}
```

## Business Rules

### Location Creation
1. **Subscription Limits**:
   - Free: Maximum 1 location
   - Standard: Maximum 3 locations
   - Enterprise: Unlimited locations

### Location Deletion
1. **Soft Delete Only**: Set is_active = false
2. **Historical Data**: Preserve for reporting

### User Assignment Rules
1. **Access Control**: Users can only access assigned locations
2. **Role-Based**:
   - Garage Admin: Access to all tenant locations
   - Other roles: Only assigned locations

## Integration Points

### Subscription Module
- Check location limits before creation
- Track location count for usage
- Enforce limits based on plan

### Users Module
- User-location assignments
- Access control enforcement

## Security Considerations

1. **Tenant Isolation**: Strict separation of data
2. **Location Access**: Validate user has access to location
3. **Audit Trail**: Log all location changes

## Future Enhancements

1. **Extended Properties**: Business hours, capacity, coordinates
2. **Primary Location**: Designate main location
3. **Location Types**: Main, branch, mobile
4. **Geographic Features**: Map integration
5. **Analytics**: Location performance comparison