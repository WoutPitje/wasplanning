// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      appName: 'Wasplanning',
      appVersion: '1.0.0',
    }
  },
  i18n: {
    locales: ['nl', 'en'],
    defaultLocale: 'nl',
    vueI18n: './i18n.config.ts',
    bundle: {
      optimizeTranslationDirective: false
    }
  },
  pinia: {
    storesDirs: ['./stores/**'],
  },
  nitro: {
    prerender: {
      routes: ['/workshop', '/washer', '/planner']
    }
  },
  // Disable SSR for admin routes to prevent hydration issues
  routeRules: {
    '/admin/**': { ssr: false }
  }
})