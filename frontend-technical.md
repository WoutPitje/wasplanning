# Frontend Technical Specification

## Nuxt 3 SSG Application

### Structure
```
├── composables/
│   ├── useAuth.ts
│   ├── useWashTasks.ts
│   └── useNotifications.ts
├── stores/
│   ├── auth.ts
│   ├── tasks.ts
│   └── vehicles.ts
├── pages/
│   ├── workshop/
│   ├── washer/
│   └── planner/
```

### Key Components
- Role-based layouts
- Real-time task board (drag-drop)
- Mobile-responsive washer interface
- Dashboard with KPIs

### Tech Stack
- **UI**: shadcn-vue + Radix Vue
- **Styling**: TailwindCSS + CSS variables
- **State**: Pinia with persistence
- **Forms**: VeeValidate + Zod
- **Tables**: shadcn-vue DataTable (built-in)
- **API**: $fetch with ofetch interceptors
- **Auth**: @sidebase/nuxt-auth
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
    '@sidebase/nuxt-auth'
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