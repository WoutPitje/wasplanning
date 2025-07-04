# Database Schema - Entity Relationship Diagram

## Wasplanning System Entities

```mermaid
erDiagram
    TENANT {
        uuid id
        string name
        string slug
        string more_attributes
    }
    
    LOCATION {
        uuid id
        uuid tenant_id
        string name
        string address
        string more_attributes
    }
    
    USER {
        uuid id
        uuid tenant_id
        uuid location_id
        string email
        string more_attributes
    }
    
    USER_LOCATION_ASSIGNMENT {
        uuid id
        uuid user_id
        uuid location_id
        string more_attributes
    }
    
    VEHICLE {
        uuid id
        uuid tenant_id
        uuid location_id
        string license_plate
        string more_attributes
    }
    
    WASH_TASK {
        uuid id
        uuid tenant_id
        uuid location_id
        uuid vehicle_id
        string more_attributes
    }
    
    SUBSCRIPTION {
        uuid id
        uuid tenant_id
        string mollie_subscription_id
        string more_attributes
    }
    
    REFRESH_TOKEN {
        uuid id
        uuid user_id
        string token_hash
        string more_attributes
    }
    
    NOTIFICATION {
        uuid id
        uuid tenant_id
        uuid user_id
        string more_attributes
    }
    
    WASH_PHOTO {
        uuid id
        uuid tenant_id
        uuid wash_task_id
        string more_attributes
    }
    
    AUDIT_LOG {
        uuid id
        uuid tenant_id
        uuid user_id
        string more_attributes
    }
    
    TENANT_SETTINGS {
        uuid id
        uuid tenant_id
        string setting_key
        string more_attributes
    }
    
    %% Relationships
    TENANT ||--o{ LOCATION : "has"
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ VEHICLE : "owns"
    TENANT ||--o{ WASH_TASK : "manages"
    TENANT ||--o{ SUBSCRIPTION : "has"
    TENANT ||--o{ NOTIFICATION : "receives"
    TENANT ||--o{ WASH_PHOTO : "stores"
    TENANT ||--o{ AUDIT_LOG : "logs"
    TENANT ||--o{ TENANT_SETTINGS : "configures"
    
    LOCATION ||--o{ USER : "primary_location"
    LOCATION ||--o{ VEHICLE : "located_at"
    LOCATION ||--o{ WASH_TASK : "performed_at"
    LOCATION ||--o{ USER_LOCATION_ASSIGNMENT : "assigned_to"
    
    USER ||--o{ WASH_TASK : "assigned_to"
    USER ||--o{ WASH_TASK : "created_by"
    USER ||--o{ REFRESH_TOKEN : "owns"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "performs"
    USER ||--o{ USER_LOCATION_ASSIGNMENT : "has_access_to"
    
    VEHICLE ||--o{ WASH_TASK : "requires"
    
    WASH_TASK ||--o{ WASH_PHOTO : "documents"
```

## Entity Overview

### Core Entities (8)
- **TENANT** - Multi-tenant root entity
- **LOCATION** - Physical locations within each tenant
- **USER** - System users with roles (Werkplaats, Wassers, Planners, etc.)
- **USER_LOCATION_ASSIGNMENT** - Many-to-many relationship for user location access
- **VEHICLE** - Cars to be washed
- **WASH_TASK** - Wash jobs/assignments
- **SUBSCRIPTION** - Mollie payment subscriptions
- **REFRESH_TOKEN** - JWT refresh tokens

### Supporting Entities (4)
- **NOTIFICATION** - Real-time notifications system
- **WASH_PHOTO** - Before/after photos (MinIO storage)
- **AUDIT_LOG** - System audit trail
- **TENANT_SETTINGS** - Configurable garage settings

## Key Relationships

- All entities (except TENANT and REFRESH_TOKEN) are tenant-scoped
- LOCATION entities enable multi-location support within each tenant
- USER_LOCATION_ASSIGNMENT enables users to access multiple locations
- WASH_TASK is the central entity connecting users, vehicles, locations, and operations
- Complete tenant isolation ensures data separation between garages
- Location-based access control provides fine-grained permissions
- Row-Level Security policies enforce tenant and location boundaries at database level