# Customers Module

## Overview
The Customers module manages customer (klanten) information for the Wasplanning system. This module provides a multi-tenant customer management system where each garage (tenant) has its own isolated customer database.

## Features

### Core Functionality
- **Customer Management**: Create, read, update, and soft-delete customers
- **Multi-tenant Isolation**: Complete data separation between garages
- **Contact Information**: Store multiple contact methods per customer
- **Vehicle Association**: Link customers to their vehicles
- **Notes & History**: Track customer preferences and service history
- **Search & Filter**: Find customers by name, phone, email, or license plate

### Customer Types
- **Private Customers**: Individual car owners
- **Business Customers**: Companies with fleets
- **Workshop Customers**: Partner workshops sending vehicles

## Database Schema

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Basic Information
  customer_type ENUM('private', 'business', 'workshop') NOT NULL DEFAULT 'private',
  company_name VARCHAR(255), -- For business/workshop customers
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(2) DEFAULT 'NL',
  
  -- Business Information
  vat_number VARCHAR(50), -- For business customers
  chamber_of_commerce VARCHAR(50), -- KvK number
  
  -- Preferences & Notes
  preferred_contact_method ENUM('email', 'phone', 'mobile', 'whatsapp'),
  notes TEXT,
  internal_notes TEXT, -- Not visible to customer
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Indexes
  INDEX idx_customers_tenant (tenant_id),
  INDEX idx_customers_email (tenant_id, email),
  INDEX idx_customers_phone (tenant_id, phone),
  INDEX idx_customers_name (tenant_id, last_name, first_name),
  INDEX idx_customers_company (tenant_id, company_name),
  
  -- Constraints
  UNIQUE KEY unique_email_per_tenant (tenant_id, email),
  CHECK (
    (customer_type = 'private' AND first_name IS NOT NULL AND last_name IS NOT NULL) OR
    (customer_type IN ('business', 'workshop') AND company_name IS NOT NULL)
  )
);
```

### customer_contacts (Future Enhancement)
```sql
-- For managing multiple contact persons per business customer
CREATE TABLE customer_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(100), -- e.g., "Workshop Manager", "Fleet Manager"
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Customer Management
- `GET /api/v1/customers` - List all customers (paginated, filterable)
- `GET /api/v1/customers/:id` - Get customer details
- `POST /api/v1/customers` - Create new customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Soft delete customer
- `GET /api/v1/customers/search` - Search customers
- `GET /api/v1/customers/:id/vehicles` - Get customer's vehicles
- `GET /api/v1/customers/:id/history` - Get service history

### Query Parameters
- `?search=` - Search by name, email, phone, or company
- `?type=` - Filter by customer type (private/business/workshop)
- `?active=` - Filter by active status
- `?sort=` - Sort by name, created_at, etc.
- `?page=` & `?limit=` - Pagination

## DTOs

### CreateCustomerDto
```typescript
{
  customer_type: 'private' | 'business' | 'workshop';
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  vat_number?: string;
  chamber_of_commerce?: string;
  preferred_contact_method?: 'email' | 'phone' | 'mobile' | 'whatsapp';
  notes?: string;
  internal_notes?: string;
}
```

### UpdateCustomerDto
- Same as CreateCustomerDto but all fields optional
- Cannot change customer_type after creation

### CustomerResponseDto
```typescript
{
  id: string;
  customer_type: string;
  display_name: string; // Computed: "Company Name" or "First Last"
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address: {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  vat_number?: string;
  chamber_of_commerce?: string;
  preferred_contact_method?: string;
  notes?: string;
  internal_notes?: string; // Only for authorized users
  vehicle_count: number;
  last_service_date?: Date;
  total_services: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## Business Rules

### Customer Creation
1. **Private customers** must have first_name and last_name
2. **Business/Workshop customers** must have company_name
3. Email must be unique within tenant (if provided)
4. Phone numbers are formatted but not validated
5. Default country is 'NL' (Netherlands)

### Customer Deletion
1. Soft delete only (is_active = false)
2. Cannot delete if has active wash tasks
3. Associated vehicles remain but show customer as "Inactive"
4. Historical data preserved for reporting

### Access Control
1. **Werkplaats**: Can create and view customers they created
2. **Wassers**: View only, no modifications
3. **Wasplanners**: Full CRUD on all customers
4. **Garage Admin**: Full CRUD + view internal notes
5. **Super Admin**: Cross-tenant access

### Data Validation
1. Email format validation (if provided)
2. Phone numbers: Accept various formats, store normalized
3. VAT number format validation for business customers
4. Postal code format validation (Dutch format)

## Integration Points

### Vehicle Module
- Customers linked to vehicles via vehicle.customer_id
- One customer can have multiple vehicles
- Vehicles can exist without customer (walk-ins)

### Wash Tasks Module
- Wash tasks reference customer for billing/contact
- Customer preferences applied to wash tasks
- Service history tracked per customer

### Notifications Module
- Send notifications based on preferred_contact_method
- Customer-specific notification preferences

## Search Implementation

### Full-text Search
Search across multiple fields:
- first_name + last_name (for private)
- company_name (for business/workshop)
- email
- phone/mobile
- Associated vehicle license plates

### Filters
- Customer type
- Active/inactive status
- Has vehicles
- Last service date range
- Created date range

## Frontend Implementation

### Pages
- `/garage-admin/customers` - Customer list
- `/garage-admin/customers/create` - New customer form
- `/garage-admin/customers/:id` - Customer details
- `/garage-admin/customers/:id/edit` - Edit customer

### Components
- `CustomerList.vue` - Searchable/filterable list
- `CustomerForm.vue` - Create/edit form
- `CustomerCard.vue` - Summary card
- `CustomerSearch.vue` - Quick search widget
- `CustomerVehicles.vue` - Associated vehicles

### Composables
- `useCustomers()` - Customer CRUD operations
- `useCustomerSearch()` - Search functionality

## Security Considerations

1. **Tenant Isolation**: RLS policies ensure cross-tenant data access is impossible
2. **PII Protection**: Customer data encrypted at rest
3. **Audit Trail**: All modifications logged
4. **GDPR Compliance**: 
   - Right to access (export customer data)
   - Right to deletion (soft delete + data anonymization)
   - Data minimization (only collect necessary data)

## Future Enhancements

1. **Multiple Contact Persons**: For business customers
2. **Customer Portal**: Self-service for customers
3. **Communication History**: Track all interactions
4. **Loyalty Program**: Points/rewards system
5. **Credit Management**: Payment terms for business customers
6. **Import/Export**: Bulk customer management
7. **Duplicate Detection**: Prevent duplicate customers
8. **Address Validation**: Integration with postal code API

## Migration Notes

### From Existing System
1. Map old customer fields to new schema
2. Detect and merge duplicates
3. Normalize phone numbers
4. Set appropriate customer_type based on data
5. Generate customer IDs for vehicle associations