# Claude Rules - Wasplanning Systeem

## Project Context
Dutch car wash planning system for garages with pickup/delivery service. Coordinates between workshop, washers, and delivery planners.

## FIXED Technical Decisions (DO NOT SUGGEST CHANGES)

### Tech Stack
- **Backend**: NestJS + TypeScript + PostgreSQL + TypeORM + Redis + MinIO
- **Frontend**: Nuxt 3 + Vue 3 + shadcn-vue + Pinia + TailwindCSS  
- **Mobile**: Expo + React Native + Zustand + NativeWind
- **Real-time**: Socket.io
- **Storage**: MinIO (S3-compatible)
- **Auth**: JWT with role-based access

### Multi-Tenancy (MANDATORY)
- **Complete tenant isolation** at database level
- **Row-Level Security** policies for all tenant-scoped tables
- **Tenant context** in JWT tokens and all API requests
- **Tenant-specific** Redis namespacing and MinIO buckets
- **Cross-tenant admin** dashboard for garage chain management

### User Roles (6 Fixed Roles - Per Tenant)
1. **Werkplaats** - Submit wash requests only
2. **Wassers** - View queue, update wash status  
3. **Haal/Breng Planners** - View completion status for return trips
4. **Wasplanners** - Manage queue and task assignments
5. **Garage Admin** - Manage users and settings for their garage
6. **Super Admin** - Manage all garages and global settings

### Integration Plan
1. First: WvA (pickup/delivery planning) 
2. Later: MOBO (workshop planning)
3. Future: RDW API for vehicle details

## Code Conventions

### Backend (NestJS)
- Use modules for features (auth, users, vehicles, wash-tasks, notifications)
- All endpoints require Swagger decorators
- DTOs with class-validator for input validation
- TypeORM entities with UUID primary keys
- snake_case database naming
- Redis for caching/queues, MinIO for files

### Frontend (Nuxt 3)  
- shadcn-vue components ONLY
- Pinia stores for global state
- Composables for shared logic
- TailwindCSS for styling
- $fetch for API calls
- TypeScript everywhere

### Mobile (Expo)
- Expo Router for navigation
- NativeWind (TailwindCSS syntax)
- Zustand for state management
- TypeScript for all components

## Development Environment
- Monorepo with backend/, frontend/, mobile/
- `npm run dev` starts all backend services + web app
- `npm run dev:mobile` starts Expo separately
- PostgreSQL:5432, Redis:6379, MinIO:9000, API:3000, Web:3001

## Business Logic Rules
- **Automatic assignment** based on capacity + skills + return trip priority
- **Real-time updates** via WebSocket for all status changes
- **Priority system**: Urgent (same day return) > Normal > No deadline
- **Delay escalation**: Alert delivery planners when wash runs late
- **Auto-redistribution**: Reassign tasks when washers unavailable

## Language & Naming
- **Code**: English (variables, functions, comments)
- **UI**: Dutch (labels, messages, user-facing text)
- **API**: English endpoints (/api/v1/wash-tasks)
- **Database**: English table/column names (wash_tasks, created_at)

## File Organization
```
backend/src/modules/[feature]/
frontend/pages/[role]/
mobile/app/(tabs)/
```

## Testing Requirements
- Jest (backend) + Vitest (frontend) + Detox (mobile)
- Minimum 80% code coverage
- E2E tests with Playwright
- No unit tests for simple getters/setters

## When Helping
1. Always reference the technical documentation files first
2. Use established patterns from existing code
3. Follow the monorepo structure
4. Suggest improvements within the chosen tech stack
5. Keep Dutch context for UI/business logic
6. Don't suggest alternative frameworks or major architecture changes

## Pricing Context
- Target: €49-99/month per garage location
- No setup fees, 30-day free trial
- Focus on garages with 5+ washers and pickup/delivery service
- ROI through reduced manual coordination time