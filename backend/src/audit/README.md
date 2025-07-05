# Audit Module

The Audit module provides comprehensive logging of all user actions within the Wasplanning system for security, compliance, and debugging purposes.

## Overview

The audit logging system tracks all significant user actions and system events, providing:
- Complete activity history with timestamps
- User identification and IP tracking
- Resource tracking (what was affected)
- Additional context through details field
- Multi-tenant isolation
- Non-blocking operation (failures don't affect main application)

## Architecture

### Components

1. **AuditLog Entity** (`entities/audit-log.entity.ts`)
   - Main database entity for storing audit logs
   - Indexes for performance on common queries
   - Tenant isolation through tenant_id

2. **AuditService** (`audit.service.ts`)
   - Core service for logging actions
   - Query and filtering capabilities
   - Statistics generation
   - CSV export functionality

3. **AuditController** (`audit.controller.ts`)
   - REST endpoints for viewing logs
   - Role-based access control
   - Export functionality

4. **DTOs** (`dto/`)
   - `AuditQueryDto`: Query parameters for filtering logs
   - Validation rules for input

## Usage

### Logging an Action

Inject the `AuditService` into your controller or service:

```typescript
constructor(private readonly auditService: AuditService) {}
```

Log actions after successful operations:

```typescript
await this.auditService.logAction({
  tenant_id: req.user.tenant.id,
  user_id: req.user.id,
  action: 'user.created',
  resource_type: 'user',
  resource_id: newUser.id,
  details: {
    email: newUser.email,
    role: newUser.role,
  },
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});
```

### Action Naming Convention

Use a consistent `resource.action` format:
- `auth.login` - User logged in
- `auth.logout` - User logged out
- `user.created` - New user created
- `user.updated` - User information updated
- `user.deactivated` - User deactivated
- `tenant.created` - New tenant created
- `file.uploaded` - File uploaded
- `vehicle.wash_requested` - Wash request created

### Querying Audit Logs

The service provides several methods for retrieving audit logs:

```typescript
// Get paginated logs with filters
const logs = await auditService.getAuditLogs({
  page: 1,
  limit: 20,
  user_id: 'user-123',
  action: 'user.created',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
}, tenantId);

// Get specific user's activity
const activity = await auditService.getUserActivity(userId, tenantId, limit);

// Get statistics
const stats = await auditService.getAuditStats(tenantId, days);

// Export as CSV
const csvBuffer = await auditService.exportAuditLogsAsCsv(query, tenantId);
```

## API Endpoints

### GET /audit
Get paginated audit logs with optional filters.

**Access**: SUPER_ADMIN, GARAGE_ADMIN

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `user_id` (string): Filter by user ID
- `action` (string): Filter by action type
- `resource_type` (string): Filter by resource type
- `start_date` (string): Start date filter (ISO format)
- `end_date` (string): End date filter (ISO format)
- `sort` (string): Sort field (created_at, action, resource_type)
- `order` (string): Sort order (ASC, DESC)

**Response**:
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "pages": 5
}
```

### GET /audit/stats
Get audit log statistics for the last 7 days.

**Access**: SUPER_ADMIN, GARAGE_ADMIN

**Response**:
```json
[
  { "action": "auth.login", "count": "150" },
  { "action": "user.created", "count": "25" }
]
```

### GET /audit/users/:userId
Get recent activity for a specific user.

**Access**: SUPER_ADMIN, GARAGE_ADMIN

**Response**: Array of audit log entries

### GET /audit/export
Export audit logs as CSV file.

**Access**: SUPER_ADMIN, GARAGE_ADMIN

**Query Parameters**: Same as GET /audit

**Response**: CSV file download

## Database Schema

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

## Multi-Tenant Isolation

All audit log queries are automatically filtered by tenant_id to ensure complete isolation between tenants. The tenant_id is extracted from the authenticated user's JWT token.

## Error Handling

The audit logging system is designed to be non-blocking:
- Logging failures are caught and logged to console
- Main application flow continues even if audit logging fails
- This ensures audit system issues don't impact user operations

## Performance Considerations

1. **Indexes**: Proper indexes on commonly queried fields
2. **Pagination**: All queries support pagination to limit result sets
3. **Async Operations**: Logging is done asynchronously
4. **Query Optimization**: QueryBuilder used for complex queries

## Testing

The module includes comprehensive tests:

### Unit Tests (`*.spec.ts`)
- Service logic testing
- Mocked dependencies
- Edge case handling

### E2E Tests (`test/audit.e2e-spec.ts`)
- Full integration testing
- Role-based access verification
- Tenant isolation validation
- Export functionality

Run tests:
```bash
# Unit tests
npm run test audit

# E2E tests
npm run test:e2e audit
```

## Security Considerations

1. **Access Control**: Only SUPER_ADMIN and GARAGE_ADMIN roles can view logs
2. **Tenant Isolation**: Users can only see logs from their own tenant
3. **IP Tracking**: Client IP addresses are logged for security analysis
4. **No PII in Actions**: Action names shouldn't contain sensitive data
5. **Immutable Logs**: No update or delete operations on audit logs

## Future Enhancements

1. **Retention Policies**: Automatic cleanup of old logs
2. **Real-time Notifications**: Alert on specific actions
3. **Advanced Analytics**: Dashboards and reports
4. **External Integration**: Send to SIEM systems
5. **Compression**: Archive old logs to reduce storage

## Examples

### Adding Audit Logging to a New Feature

```typescript
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto, @Request() req) {
    const vehicle = await this.vehiclesService.create(createVehicleDto);
    
    // Log the action
    await this.auditService.logAction({
      tenant_id: req.user.tenant.id,
      user_id: req.user.id,
      action: 'vehicle.created',
      resource_type: 'vehicle',
      resource_id: vehicle.id,
      details: {
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });
    
    return vehicle;
  }
}
```

### Viewing Logs in Frontend

```typescript
// composables/useAuditLogs.ts
const { getAuditLogs, exportAuditLogs } = useAuditLogs();

// Get filtered logs
const logs = await getAuditLogs({
  action: 'user.created',
  start_date: '2024-01-01',
  page: 1,
  limit: 50,
});

// Export as CSV
await exportAuditLogs({
  start_date: '2024-01-01',
  end_date: '2024-12-31',
});
```