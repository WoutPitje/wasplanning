# Frontend Technical Specification

## Nuxt 3 SSG Application

### Structure
```
├── composables/
│   ├── useAuth.ts
│   ├── useAdmin.ts
│   ├── useAdminUsers.ts
│   ├── useUsers.ts
│   ├── useImpersonation.ts
│   ├── useQueryFilters.ts
│   └── useLocale.ts
├── stores/
│   └── auth.ts
├── pages/
│   ├── admin/           # Super admin pages
│   │   ├── tenants/
│   │   ├── users/
│   │   └── settings.vue
│   ├── garage-admin/    # Garage admin pages
│   │   ├── users/
│   │   ├── dashboard.vue
│   │   └── settings.vue
│   ├── delivery/        # Delivery planner pages
│   ├── washer/          # Washer pages
│   ├── wasplanner/      # Wash planner pages
│   ├── workshop/        # Workshop pages
│   ├── login.vue
│   └── index.vue
```

### Key Components (Implemented)
- Role-based layouts and routing
- User management with impersonation
- Tenant/garage administration
- Multi-language support (Dutch/English)
- Responsive design (mobile-first)
- File upload with MinIO integration

### Planned Components
- Real-time task board (drag-drop)
- Dashboard with KPIs
- Location selector and management
- Multi-location task views
- Cross-location reporting dashboard

### Tech Stack
- **UI**: shadcn-vue + Radix Vue
- **Styling**: TailwindCSS + CSS variables
- **State**: Pinia with persistence
- **Forms**: VeeValidate + Zod
- **Tables**: shadcn-vue DataTable (built-in)
- **API**: $fetch with ofetch interceptors
- **Auth**: Custom JWT implementation (not @sidebase/nuxt-auth)
- **i18n**: @nuxtjs/i18n
- **PWA**: @vite-pwa/nuxt
- **Charts**: Chart.js
- **Dates**: date-fns
- **Icons**: Lucide icons
- **WebSockets**: Socket.io client

### Nuxt Config
```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    // '@sidebase/nuxt-auth' // Not used - custom JWT auth
  ],
  ssr: true,
  nitro: {
    prerender: {
      routes: ['/workshop', '/washer', '/planner']
    }
  }
})
```

### Frontend Testing
```
frontend/
├── test/
│   ├── unit/
│   │   ├── components/
│   │   └── composables/
│   └── e2e/
│       └── scenarios/
```

**Testing Stack**
- **Unit Tests**: Vitest + @vue/test-utils
- **Component**: @testing-library/vue
- **E2E**: Playwright
- **Visual**: Storybook (optional)

**Test Scripts**
```json
"test": "vitest",
"test:unit": "vitest run",
"test:e2e": "playwright test",
"test:coverage": "vitest run --coverage"
```

### CI/CD Testing
```yaml
# .github/workflows/test.yml
- Run linting (ESLint, Prettier)
- Run unit tests with coverage
- Run integration tests
- Run E2E tests on staging
- SonarQube analysis
```

### Environment Variables
```env
NUXT_PUBLIC_API_URL=http://localhost:3000
NUXT_PUBLIC_WS_URL=ws://localhost:3000
```