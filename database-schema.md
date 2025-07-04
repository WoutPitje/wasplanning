# Database Schema - Entity Relationship Diagram

## Wasplanning System Entities

```mermaid
erDiagram
    TENANT {
        uuid id
        string name
        string slug
        etc
    }
    
    USER {
        uuid id
        uuid tenant_id
        string email
        etc
    }
    
    VEHICLE {
        uuid id
        uuid tenant_id
        string license_plate
        etc
    }
    
    WASH_TASK {
        uuid id
        uuid tenant_id
        uuid vehicle_id
        etc
    }
    
    SUBSCRIPTION {
        uuid id
        uuid tenant_id
        string mollie_subscription_id
        etc
    }
    
    REFRESH_TOKEN {
        uuid id
        uuid user_id
        string token_hash
        etc
    }
    
    NOTIFICATION {
        uuid id
        uuid tenant_id
        uuid user_id
        etc
    }
    
    WASH_PHOTO {
        uuid id
        uuid tenant_id
        uuid wash_task_id
        etc
    }
    
    AUDIT_LOG {
        uuid id
        uuid tenant_id
        uuid user_id
        etc
    }
    
    TENANT_SETTINGS {
        uuid id
        uuid tenant_id
        string setting_key
        etc
    }
    
    %% Relationships
    TENANT ||--o{ USER : "has"
    TENANT ||--o{ VEHICLE : "owns"
    TENANT ||--o{ WASH_TASK : "manages"
    TENANT ||--o{ SUBSCRIPTION : "has"
    TENANT ||--o{ NOTIFICATION : "receives"
    TENANT ||--o{ WASH_PHOTO : "stores"
    TENANT ||--o{ AUDIT_LOG : "logs"
    TENANT ||--o{ TENANT_SETTINGS : "configures"
    
    USER ||--o{ WASH_TASK : "assigned_to"
    USER ||--o{ WASH_TASK : "created_by"
    USER ||--o{ REFRESH_TOKEN : "owns"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "performs"
    
    VEHICLE ||--o{ WASH_TASK : "requires"
    
    WASH_TASK ||--o{ WASH_PHOTO : "documents"
```

## Entity Overview

### Core Entities (6)
- **TENANT** - Multi-tenant root entity
- **USER** - System users with roles (Werkplaats, Wassers, Planners, etc.)
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
- WASH_TASK is the central entity connecting users, vehicles, and operations
- Complete tenant isolation ensures data separation between garages
- Row-Level Security policies enforce tenant boundaries at database level