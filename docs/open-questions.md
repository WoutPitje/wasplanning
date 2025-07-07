# Open Questions & Missing Elements - Wasplanning System

## Critical Business Questions

### 1. Vehicle Time Estimation
- **Question**: How do we calculate wash time for small vs large vehicles?
- **Missing**: Specific time allocations (e.g., small car = 30 min, large car = 45 min?)
- **Impact**: Affects capacity planning and scheduling

### 2. Workshop Billing Integration
- **Question**: How exactly do costs get passed to workshop work orders?
- **Missing**: 
  - Integration method with existing workshop systems
  - Invoice format and frequency
  - Payment terms and collection process
  - How to handle disputes or corrections

### 3. Washer Skills & Certifications
- **Question**: What specific skills/certifications do washers have?
- **Missing**:
  - Skill categories (interior, exterior, detailing, special coatings?)
  - How skills affect assignment logic
  - Training/certification tracking

### 4. SLA Definitions
- **Question**: What are the specific Service Level Agreements?
- **Missing**:
  - Time targets per priority level
  - Escalation thresholds
  - Penalty/compensation for missed SLAs

### 5. Return Trip Coordination
- **Question**: How do we optimize delivery planning with wash completion?
- **Missing**:
  - Algorithm for batching return trips
  - Communication between washers and delivery planners
  - Handling of delays and rescheduling

## Technical Implementation Questions

### 6. Inventory Management System
- **Question**: Build or integrate with existing inventory system?
- **Missing**:
  - Minimum stock levels per product
  - Supplier management
  - Automatic reordering thresholds
  - Cost allocation formula

### 7. Quality Control
- **Question**: How do we ensure wash quality standards?
- **Missing**:
  - Quality checklist per service type
  - Photo documentation requirements
  - Customer feedback integration
  - Rework process

### 8. Multi-Location Logistics
- **Question**: How do we handle vehicles between multiple locations?
- **Missing**:
  - Transfer protocols
  - Location capacity balancing
  - Cross-location washer assignments

## Business Process Gaps

### 9. Damage Handling
- **Question**: What's the complete process for vehicle damage?
- **Missing**:
  - Damage documentation requirements
  - Liability determination
  - Insurance claim process
  - Customer notification workflow

### 10. Peak Time Management
- **Question**: How do we handle rush periods?
- **Missing**:
  - Overflow protocols
  - Temporary worker integration
  - Priority override rules
  - Customer communication for delays

### 11. Cancellations & Changes
- **Question**: How do we handle last-minute changes?
- **Missing**:
  - Cancellation policies
  - Rescheduling rules
  - Impact on capacity planning
  - Notification chains

## Integration Questions

### 12. RDW API Details
- **Question**: What vehicle data do we pull and when?
- **Missing**:
  - API call triggers
  - Data fields mapping
  - Handling of API failures
  - Data update frequency

### 13. WvA Integration Specifics
- **Question**: What data do we exchange with the pickup/delivery system?
- **Missing**:
  - API endpoints needed
  - Real-time vs batch updates
  - Conflict resolution
  - Data ownership

## Financial Questions

### 14. Pricing Flexibility
- **Question**: Can garages set custom prices per service?
- **Missing**:
  - Price override permissions
  - Discount authorization levels
  - Bulk pricing rules
  - Seasonal adjustments

### 15. Cost Components
- **Question**: What's included in wash cost calculations?
- **Missing**:
  - Labor cost calculation
  - Material cost allocation
  - Overhead distribution
  - Profit margin settings

## Operational Details

### 16. Showroom & Idle Tasks
- **Question**: Who defines and approves additional tasks?
- **Missing**:
  - Task creation permissions
  - Priority vs regular wash tasks
  - Time tracking for non-wash activities
  - Billing for additional services

### 17. Emergency Protocols
- **Question**: How do we handle urgent/emergency situations?
- **Missing**:
  - Emergency contact lists
  - Override authorization
  - After-hours procedures
  - Critical customer definitions

## Reporting Needs

### 18. Custom Report Requirements
- **Question**: What specific reports do different roles need?
- **Missing**:
  - Report templates per role
  - Data retention periods
  - Export format preferences
  - Scheduling requirements

### 19. KPI Definitions
- **Question**: What are the key performance indicators?
- **Missing**:
  - Target values per KPI
  - Calculation methods
  - Review frequencies
  - Action thresholds

## User Experience Questions

### 20. Mobile App Priorities
- **Question**: Which features are critical for mobile?
- **Missing**:
  - Offline capability requirements
  - Photo upload specifications
  - Push notification preferences
  - Device support matrix

## Next Steps Needed

1. **Workshop Session**: Meet with actual users to define SLAs and time estimates
2. **Integration Analysis**: Technical review of WvA and workshop systems
3. **Financial Model**: Detailed cost calculation methodology
4. **Process Documentation**: Step-by-step workflows for edge cases
5. **Pilot Program**: Test with one garage to refine requirements