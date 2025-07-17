# Business Logic - Wasplanning Systeem

## Overview
This document consolidates all business logic for the Wasplanning system, a multi-tenant SaaS platform for coordinating car wash services in garages with pickup/delivery operations.

## Core Business Model

### Target Market
- Automotive garages with 5+ washers
- Garages offering pickup/delivery service
- Focus on efficiency gains through reduced coordination time
- ROI: Save 2-4 hours daily on manual coordination

### Pricing Structure
- **Gratis**: €0/month
  - Up to 50 cars/month
  - Up to 2 active users
  - 1 location
  - Basic features
  
- **Standaard**: €100/month
  - Up to 1500 cars/month
  - Up to 10 active users
  - Up to 3 locations
  - All features + reporting
  
- **Enterprise**: €400/month
  - Unlimited cars
  - Unlimited users
  - Unlimited locations
  - All features + custom integrations
  - Priority support + API access

- **Billing**: Monthly only
- **No setup fees**

## User Roles & Permissions

### 1. Super Admin (Cross-Tenant)
**Capabilities:**
- Create, update, delete tenants
- Manage all garages across all tenants
- Access all data across tenants
- Impersonate any user (except other super admins)
- Override all permission checks
- Manage global system settings
- View system-wide analytics
- Manage subscription plans and pricing

**Restrictions:**
- Cannot impersonate other super admins
- Cannot be impersonated
- Limited to system-level operations when impersonating

### 2. Garage Admin (Per Tenant)
**Capabilities:**
- Manage users within their tenant
- Configure garage settings
- View all wash requests and statistics
- Manage locations within subscription limits
- Configure business hours and capacity
- Access billing and subscription info
- Set garage-specific pricing

**Restrictions:**
- Cannot access other tenants
- Cannot exceed subscription limits
- Cannot create super admin users

### 3. Wasplanner (Per Tenant)
**Capabilities:**
- View and manage wash queue
- Assign tasks to washers
- Adjust priorities and schedules
- View washer availability
- Manage wash task workflow
- Access reporting for their location

**Restrictions:**
- Cannot manage users
- Cannot access billing
- Limited to assigned locations

### 4. Wasser (Per Tenant)
**Capabilities:**
- View assigned wash tasks
- Update task status (started, completed)
- Add notes to tasks
- View their own schedule
- Mark availability

**Restrictions:**
- Can only see assigned tasks
- Cannot reassign tasks
- Cannot access other washers' tasks

### 5. Haal/Breng Planner (Per Tenant)
**Capabilities:**
- View completed wash tasks ready for delivery
- Schedule return trips
- View delivery routes
- Track delivery status

**Restrictions:**
- Read-only access to wash tasks
- Cannot modify wash status
- Limited to delivery planning views

### 6. Werkplaats (Per Tenant)
**Capabilities:**
- Create wash requests
- View status of submitted requests
- Add vehicle and customer information
- Set priority/urgency

**Restrictions:**
- Cannot see other workshops' requests
- Cannot modify requests after submission
- No access to wash queue management

## Multi-Tenancy Architecture

### Tenant Isolation
- Complete data isolation at database level
- Row-Level Security (RLS) policies on all tenant-scoped tables
- Separate MinIO storage buckets per tenant
- Redis namespace isolation per tenant
- No cross-tenant data access (except Super Admin)

### Tenant Management
- Tenants represent garage companies/chains
- Each tenant can have multiple locations
- Tenant-specific branding and settings
- Independent user management per tenant
- Separate subscription and billing per tenant

## Subscription & Usage Management

### Usage Tracking
- **Cars Washed**: Count per calendar month
- **Active Users**: Users who logged in during billing period
- **Locations**: Physical garage locations

### Limit Enforcement
- Soft limits with warnings at 80% usage
- Hard stops at 100% for critical features
- Grace period for slight overages
- Automatic emails to admins near limits

### Billing Cycle
- Monthly billing on signup anniversary
- Prorated charges for plan changes
- Usage resets at start of each cycle
- Failed payment retry logic (3 attempts)

### Free Tier Management
- Start with free tier immediately
- Upgrade prompts when approaching limits
- Seamless upgrade to paid plans
- Usage tracking and notifications

## Wash Task Business Logic

### Task Status Flow
1. **Requested** - Initial request from workshop
2. **Queued** - Accepted into wash queue
3. **Assigned** - Assigned to specific washer
4. **In Progress** - Washer started the task
5. **Completed** - Wash finished
6. **Ready for Pickup** - Available for delivery planner
7. **Delivered** - Returned to workshop

### Current Location Tracking
- **Workshop** - Vehicle is at the workshop
- **Wash Area** - Vehicle is in the washing area
- **In Transit** - Vehicle being transported
- **Storage** - Temporary storage location
- **Update Authority**: Person who physically moves the vehicle updates the status

### Priority System
1. **Urgent** (Spoed) - Same day return required
2. **High** - Priority customer or time-sensitive
3. **Normal** - Standard turnaround time
4. **Low** - No specific deadline

### Assignment Logic
**Automatic Assignment Based On:**
- Washer availability and current workload
- Washer skills and certifications
- Vehicle type (small/large car settings)
- Priority level
- Return trip scheduling
- Location proximity

**Manual Override:**
- Planners can manually reassign tasks
- Reason required for audit trail
- Notification to affected washers

### Capacity Management
- Real-time availability tracking
- Skill-based capacity (interior, exterior, detailing)
- Time estimates based on vehicle size
- Buffer time for urgent requests
- Automatic redistribution when washer unavailable

## Vehicle Information

### Core Vehicle Data
- License plate (primary identifier)
- Make, model, year
- Size category (affects wash time)
- Color
- Customer/owner information
- Workshop source

### Additional Tracking
- **Internal Contact Person** - Contact person per wash request per vehicle
- **Vehicle Notes & Photos**:
  - Fuel status (needs refueling)
  - Damage reports with photos
  - Special handling instructions
  - Access restrictions (keys, codes)
  - Previous wash history
  - General notes field for any observations
  - Photo attachments for documentation

### Integration Points
- **WvA** - Pickup/delivery planning system
- **MOBO** - Workshop planning (future)
- **RDW API** - Automatic vehicle details (future)

## Inventory Management (Future Enhancement)

### Supplies Tracking
- Cleaning products inventory levels
- Equipment status (sponges, towels, machines)
- Automatic low-stock alerts
- Usage tracking per wash type
- Reorder suggestions based on usage patterns

### Cost Management
- Supply costs per wash
- Labor time tracking
- Cost allocation to work orders
- Profitability analysis per service type

## Financial Integration

### Billing to Workshops (Future)
- Cost calculation per wash service
- Integration with workshop billing systems
- Different rates for service types
- Currently handled via subscription model only

### Service Types
- Basic wash
- Premium wash
- Interior cleaning
- Full detail
- Showroom preparation
- Custom services

## Additional Services

### Idle Time Optimization
When washers have no assigned vehicles:
- Showroom dusting tasks
- Equipment maintenance
- Inventory counting
- Training activities
- General facility cleaning

### Task Queuing
- Automatic task suggestions during idle time
- Priority-based queue for additional services
- Manager approval for non-standard tasks

## Notifications & Escalations

### Real-time Updates
- WebSocket notifications for status changes
- Push notifications to mobile apps
- Email alerts for important events

### Escalation Rules
- Delays beyond SLA trigger alerts
- Capacity warnings to planners
- Urgent task notifications
- Failed delivery attempts

### Notification Targets
- Task assignee (washer)
- Planner responsible
- Workshop contact
- Delivery planner
- Garage admin (for major issues)

## Reporting & Analytics

### Operational Metrics
- Average wash time by type
- Washer productivity
- Queue wait times
- SLA compliance
- Capacity utilization

### Business Metrics
- Revenue per location
- Cost per wash
- Customer satisfaction
- Growth trends
- Subscription usage

### Custom Reports
- Exportable data (CSV, PDF)
- Scheduled reports
- Role-based access
- Historical comparisons

## Security & Compliance

### Data Protection
- GDPR compliance for EU operations
- Data retention policies
- Right to deletion
- Audit trails for all actions
- Encrypted sensitive data

### Access Control
- Role-based permissions
- IP whitelisting (Enterprise)
- 2FA for admin roles
- Session management
- API rate limiting

## System Integration

### API Access (Enterprise)
- RESTful API for external systems
- Webhook support for events
- OAuth2 authentication
- Rate limits per tier
- Custom integration support

### Standard Integrations
- Payment providers (TBD - considering Lemon Squeezy)
- SendGrid (email)
- MinIO (file storage)
- Redis (caching/queues)
- PostgreSQL (database)

## Business Rules Summary

1. **Tenant Isolation**: Absolute data separation between garages
2. **Subscription Limits**: Enforced based on plan with grace periods
3. **Role Hierarchy**: Permissions cascade down, never up
4. **Priority System**: Urgent tasks always take precedence
5. **Capacity Planning**: Never exceed washer capacity
6. **Cost Tracking**: All services must be billable
7. **Audit Trail**: Every action must be logged
8. **Real-time Updates**: All status changes instantly communicated
9. **SLA Compliance**: Time targets must be met or escalated
10. **Resource Optimization**: Minimize idle time, maximize throughput

## Future Enhancements
- AI-powered scheduling optimization
- Predictive maintenance alerts
- Customer portal for direct bookings
- Mobile app for customers
- Integration with major garage management systems
- Automated quality control checks
- Environmental compliance tracking
- Multi-language support beyond Dutch/English
- Trip linking for pickup/delivery coordination
- Advanced notification system for contact persons
- Direct billing integration with work orders