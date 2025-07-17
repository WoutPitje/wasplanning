# Locations Module Implementation Tasks

## ✅ Completed Tasks

### Backend Structure
- [x] Created locations module structure
- [x] Created Location entity with all fields
- [x] Created UserLocation entity for many-to-many relationship
- [x] Created DTOs (create, update, response, assign users)
- [x] Created LocationsService with business logic
- [x] Created LocationsController with all endpoints
- [x] Generated TypeORM migration
- [x] Added module to AppModule imports

### API Endpoints
- [x] POST /api/v1/locations - Create location
- [x] GET /api/v1/locations - List locations
- [x] GET /api/v1/locations/:id - Get location details
- [x] PATCH /api/v1/locations/:id - Update location
- [x] DELETE /api/v1/locations/:id - Soft delete location
- [x] PUT /api/v1/locations/:id/set-primary - Set as primary location
- [x] POST /api/v1/locations/:id/users - Assign users to location
- [x] DELETE /api/v1/locations/:id/users/:userId - Remove user from location
- [x] GET /api/v1/locations/:id/users - Get location users
- [x] GET /api/v1/locations/:id/statistics - Get location statistics

## 🚧 Pending Tasks

### Backend Enhancements
- [ ] Add location settings entity and service
- [ ] Implement actual statistics calculations
- [ ] Add queue size calculations from wash tasks
- [ ] Add available spots calculations
- [ ] Add caching with Redis
- [ ] Add unit tests for service
- [ ] Add e2e tests for controller
- [ ] Add seed data for development

### Frontend Implementation
- [ ] Create locations composable (useLocations)
- [ ] Create location list page (/garage-admin/locations)
- [ ] Create location detail page (/garage-admin/locations/:id)
- [ ] Create location create page (/garage-admin/locations/create)
- [ ] Create location edit page (/garage-admin/locations/:id/edit)
- [ ] Create user assignment page (/garage-admin/locations/:id/users)
- [ ] Create location components:
  - [ ] LocationList.vue
  - [ ] LocationCard.vue
  - [ ] LocationForm.vue
  - [ ] LocationCapacity.vue
  - [ ] BusinessHoursEditor.vue
  - [ ] UserLocationAssignment.vue

### Integration Tasks
- [ ] Update User entity to include location relations
- [ ] Update users module to handle location assignments
- [ ] Add location context to JWT token
- [ ] Add location-based access control to guards
- [ ] Update wash tasks module to include location_id
- [ ] Add location filtering to all relevant endpoints

### Migrations & Database
- [ ] Run migration to create tables
- [ ] Add RLS policies for tenant isolation
- [ ] Add indexes for performance optimization
- [ ] Create views for statistics

### i18n Translations
- [ ] Add Dutch translations for:
  - [ ] Location management UI
  - [ ] Location types
  - [ ] Business hours
  - [ ] Capacity indicators
  - [ ] Error messages
- [ ] Add English translations for the same

### Business Logic Implementation
- [ ] Enforce subscription limits on location creation
- [ ] Implement business hours validation
- [ ] Add holiday calendar support (future)
- [ ] Implement location-based queue management
- [ ] Add cross-location task routing (future)

### Documentation
- [ ] Update API documentation with location endpoints
- [ ] Add location management to user guide
- [ ] Document multi-location architecture
- [ ] Add troubleshooting guide

## 📝 Notes

### Dependencies
- Requires subscription module for limit checking
- Will be required by wash tasks module
- User module needs updates for location assignments

### Critical Path
1. Run migration to create tables
2. Update User entity with location relations
3. Implement frontend pages for basic CRUD
4. Add location assignment to user management
5. Integrate with wash tasks module

### Testing Checklist
- [ ] Test subscription limit enforcement
- [ ] Test primary location logic
- [ ] Test user assignment/removal
- [ ] Test soft delete behavior
- [ ] Test tenant isolation
- [ ] Test business hours validation
- [ ] Test capacity calculations

### Performance Considerations
- Add Redis caching for location data
- Consider denormalizing statistics
- Optimize user-location queries
- Add database indexes for common queries