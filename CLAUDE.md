# Claude Rules - Wasplanning Systeem

## Project Context
Dutch car wash planning system for garages with pickup/delivery service. Coordinates between workshop, washers, and delivery planners.

## Important TypeORM Migration Notes
- Use `ts-node` to run TypeORM CLI commands to avoid TypeScript enum issues
- Entity columns with `nullable: true` should NOT use union types like `string | null`
- Just use the base type (e.g., `string`) - TypeORM handles null values internally
- Migration data-source.ts should be in the root backend directory, not in src/
- Use relative paths in data-source.ts entities/migrations arrays, not __dirname

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
- **shadcn-vue components ONLY** - Never use other UI libraries
- **Pinia stores** for global state management (auth, user data)
- **Composables** for shared logic and API requests (`composables/`)
- **TailwindCSS** for styling - no other CSS frameworks
- **$fetch** for API calls within composables
- **TypeScript everywhere** - all files must be .ts/.vue with types
- **Pages structure**: `/pages/[role]/` for role-based routing
- **Components**: Reusable UI components in `/components/ui/`
- **Types**: Shared TypeScript interfaces in `/types/`
- **Mobile Responsive** - All components must work on mobile devices (320px+)

### Mobile (Expo)
- Expo Router for navigation
- NativeWind (TailwindCSS syntax)
- Zustand for state management
- TypeScript for all components

## Development Environment
- Monorepo with backend/, frontend/, mobile/
- `npm run dev` starts all backend services + web app
- `npm run dev:mobile` starts Expo separately
- PostgreSQL:5432, Redis:6379, MinIO:9000, API:3001, Web:3000

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

## Impersonation Feature
- **Only SUPER_ADMIN** can impersonate other users
- **API Endpoints**:
  - `POST /auth/impersonate/:userId` - Start impersonating
  - `POST /auth/stop-impersonation` - Return to original user
- **Security Restrictions**:
  - Cannot impersonate another SUPER_ADMIN
  - Cannot impersonate inactive users
  - Cannot perform nested impersonation
  - Certain actions blocked while impersonating (password changes, user deletion, tenant management)
- **JWT Structure** during impersonation:
  ```typescript
  {
    id: string,              // Impersonated user's ID
    email: string,           // Impersonated user's email
    role: string,            // Impersonated user's role
    tenant: {...},           // Impersonated user's tenant
    impersonator_id: string, // Original SUPER_ADMIN's ID
    is_impersonating: true   // Impersonation flag
  }
  ```
- **Frontend Implementation** (TODO):
  - Add impersonation types to auth.ts
  - Create useImpersonation composable
  - Add visual indicator in header
  - Add impersonate button in user management

## i18n Implementation (MANDATORY)
- **All UI text** must use i18n translations - NO hardcoded strings
- **Import** `import { useI18n } from 'vue-i18n'` in every component
- **Setup** `const { t } = useI18n()` in script setup
- **Use** `{{ t('key.path') }}` in templates
- **Placeholders** `:placeholder="t('key.path')"`
- **Email addresses** avoid @ symbols in translations (use descriptive text)
- **Computed labels** Use `computed(() => t('key'))` for reactive translations
- **Translation structure**:
  - Common keys: `common.save`, `common.cancel`
  - Page-specific: `[role].[page].[element]`
  - Nested sections: `admin.tenants.form.title`
- **Default locale**: Dutch (nl)
- **Supported locales**: Dutch (nl), English (en)
- **Config location**: `frontend/i18n/i18n.config.ts`
- **Never hardcode** Dutch or English text in components

## File Organization
```
backend/src/modules/[feature]/
frontend/
├── pages/[role]/              # Role-based page routing
├── components/ui/             # Reusable shadcn-vue components
├── composables/               # API requests and shared logic
├── stores/                    # Pinia stores for global state
├── types/                     # TypeScript type definitions
├── lib/                       # Utility functions
└── assets/css/                # Global styles
mobile/app/(tabs)/
```

## Frontend API Patterns
- **Composables**: Use `useApi()` composables for all API calls
- **Error Handling**: Consistent error handling in composables
- **Loading States**: Reactive loading/error states in composables
- **Type Safety**: Full TypeScript coverage for API responses
- **Caching**: Use Nuxt's built-in request caching where appropriate

## UI/UX Patterns

### Mobile Responsiveness (MANDATORY)
- **All components** must be fully responsive from 320px width
- **Tables**: Use horizontal scroll on mobile or switch to card layout
- **Forms**: Stack inputs vertically on mobile (single column)
- **Navigation**: Hamburger menu on mobile devices
- **Touch targets**: Minimum 44x44px for clickable elements
- **Text**: Readable font sizes (min 14px on mobile)
- **Spacing**: Appropriate padding/margins for touch devices
- **Breakpoints**: Use Tailwind's responsive prefixes (sm:, md:, lg:)

### Button Positioning
- **List/Index pages**: 
  - "New/Create" button in top right header
  - Action buttons in table rows (View Details only, edit via detail page)
- **Detail/View pages**:
  - "Edit" button in top right header
  - "Back" button at bottom left
  - No action cards - keep details clean
- **Create/Edit Forms**:
  - For Edit: Action buttons (Reset Password, Activate/Deactivate) in top right header
  - "Cancel" button at bottom left
  - "Save/Submit" button at bottom right
  - Form buttons use `justify-between` flex layout
  - On mobile: Stack buttons vertically with full width

### Password Handling
- **Empty passwords**: When creating users, if password field is empty, remove it from request body
- **Backend behavior**: Backend auto-generates secure temporary password when not provided
- **Display**: Show temporary password in dialog after successful creation

## Testing Requirements
- Jest (backend) + Vitest (frontend) + Detox (mobile)
- Minimum 80% code coverage
- Unit tests for logic and composables only
- No unit tests for simple getters/setters or UI components

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