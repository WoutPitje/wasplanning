<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/wasplanning-logo.png" alt="Wasplanning Logo" class="h-10 w-10 object-contain" />
          <span class="text-xl font-bold">
            {{ t('app.name') }}
          </span>
        </NuxtLink>
        
        <div class="flex items-center gap-4">
          <LanguageSwitcher />
          <Button asChild>
            <NuxtLink to="/login">{{ t('common.login') }}</NuxtLink>
          </Button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
          <h1 class="text-4xl font-bold tracking-tight mb-4">
            {{ t('docs.title') }}
          </h1>
          <p class="text-xl text-muted-foreground">
            {{ t('docs.subtitle') }}
          </p>
        </div>

        <!-- Table of Contents -->
        <Card class="mb-8">
          <CardHeader>
            <CardTitle>{{ t('docs.toc.title') }}</CardTitle>
          </CardHeader>
          <CardContent>
            <nav class="space-y-2">
              <a href="#system-overview" class="block text-primary hover:underline">
                {{ t('docs.toc.systemOverview') }}
              </a>
              <a href="#authentication" class="block text-primary hover:underline">
                {{ t('docs.toc.authentication') }}
              </a>
              <a href="#multi-tenancy" class="block text-primary hover:underline">
                {{ t('docs.toc.multiTenancy') }}
              </a>
              <a href="#api-documentation" class="block text-primary hover:underline">
                {{ t('docs.toc.apiDocumentation') }}
              </a>
              <a href="#getting-started" class="block text-primary hover:underline">
                {{ t('docs.toc.gettingStarted') }}
              </a>
            </nav>
          </CardContent>
        </Card>

        <!-- System Overview -->
        <section id="system-overview" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">{{ t('docs.systemOverview.title') }}</h2>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-lg mb-6">{{ t('docs.systemOverview.description') }}</p>
            
            <h3 class="text-xl font-semibold mb-4">{{ t('docs.systemOverview.architecture.title') }}</h3>
            <ul class="list-disc pl-6 mb-6 space-y-2">
              <li>{{ t('docs.systemOverview.architecture.backend') }}</li>
              <li>{{ t('docs.systemOverview.architecture.frontend') }}</li>
              <li>{{ t('docs.systemOverview.architecture.database') }}</li>
              <li>{{ t('docs.systemOverview.architecture.storage') }}</li>
              <li>{{ t('docs.systemOverview.architecture.cache') }}</li>
            </ul>

            <h3 class="text-xl font-semibold mb-4">{{ t('docs.systemOverview.features.title') }}</h3>
            <ul class="list-disc pl-6 mb-6 space-y-2">
              <li>{{ t('docs.systemOverview.features.multiTenant') }}</li>
              <li>{{ t('docs.systemOverview.features.rbac') }}</li>
              <li>{{ t('docs.systemOverview.features.realtime') }}</li>
              <li>{{ t('docs.systemOverview.features.api') }}</li>
              <li>{{ t('docs.systemOverview.features.security') }}</li>
            </ul>
          </div>
        </section>

        <!-- Authentication -->
        <section id="authentication" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">{{ t('docs.authentication.title') }}</h2>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-lg mb-6">{{ t('docs.authentication.description') }}</p>
            
            <h3 class="text-xl font-semibold mb-4">{{ t('docs.authentication.jwt.title') }}</h3>
            <p class="mb-4">{{ t('docs.authentication.jwt.description') }}</p>
            
            <Card class="mb-6">
              <CardHeader>
                <CardTitle class="text-lg">{{ t('docs.authentication.jwt.structure') }}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre class="bg-muted p-4 rounded text-sm overflow-x-auto"><code>{
  "id": "user-uuid",
  "email": "user@garage.nl",
  "role": "GARAGE_ADMIN",
  "tenant": {
    "id": "tenant-uuid",
    "name": "garage-amsterdam"
  },
  "iat": 1234567890,
  "exp": 1234567890
}</code></pre>
              </CardContent>
            </Card>

            <h3 class="text-xl font-semibold mb-4">{{ t('docs.authentication.roles.title') }}</h3>
            <div class="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle class="text-base">SUPER_ADMIN</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground">{{ t('docs.authentication.roles.superAdmin') }}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle class="text-base">GARAGE_ADMIN</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground">{{ t('docs.authentication.roles.garageAdmin') }}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle class="text-base">WASPLANNER</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground">{{ t('docs.authentication.roles.wasplanner') }}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle class="text-base">WERKPLAATS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground">{{ t('docs.authentication.roles.werkplaats') }}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <!-- Multi-Tenancy -->
        <section id="multi-tenancy" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">{{ t('docs.multiTenancy.title') }}</h2>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-lg mb-6">{{ t('docs.multiTenancy.description') }}</p>
            
            <h3 class="text-xl font-semibold mb-4">{{ t('docs.multiTenancy.isolation.title') }}</h3>
            <ul class="list-disc pl-6 mb-6 space-y-2">
              <li>{{ t('docs.multiTenancy.isolation.database') }}</li>
              <li>{{ t('docs.multiTenancy.isolation.storage') }}</li>
              <li>{{ t('docs.multiTenancy.isolation.cache') }}</li>
              <li>{{ t('docs.multiTenancy.isolation.api') }}</li>
            </ul>

            <h3 class="text-xl font-semibold mb-4">{{ t('docs.multiTenancy.security.title') }}</h3>
            <p class="mb-4">{{ t('docs.multiTenancy.security.description') }}</p>
            
            <Alert class="mb-6">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>{{ t('docs.multiTenancy.security.alertTitle') }}</AlertTitle>
              <AlertDescription>
                {{ t('docs.multiTenancy.security.alertDescription') }}
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <!-- API Documentation -->
        <section id="api-documentation" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">{{ t('docs.api.title') }}</h2>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-lg mb-6">{{ t('docs.api.description') }}</p>
            
            <div class="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <ExternalLink class="h-5 w-5" />
                    {{ t('docs.api.swagger.title') }}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground mb-4">
                    {{ t('docs.api.swagger.description') }}
                  </p>
                  <Button asChild class="w-full">
                    <a :href="apiDocsUrl" target="_blank" class="inline-flex items-center justify-center">
                      {{ t('docs.api.swagger.button') }}
                      <ExternalLink class="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle class="flex items-center gap-2">
                    <Code class="h-5 w-5" />
                    {{ t('docs.api.endpoints.title') }}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p class="text-sm text-muted-foreground mb-4">
                    {{ t('docs.api.endpoints.description') }}
                  </p>
                  <div class="space-y-2 text-xs">
                    <div class="flex items-center gap-2">
                      <Badge variant="outline" class="bg-green-50 text-green-600">POST</Badge>
                      <code>/api/v1/auth/login</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline" class="bg-blue-50 text-blue-600">GET</Badge>
                      <code>/api/v1/users</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline" class="bg-blue-50 text-blue-600">GET</Badge>
                      <code>/api/v1/admin/tenants</code>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline" class="bg-blue-50 text-blue-600">GET</Badge>
                      <code>/api/v1/audit</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <h3 class="text-xl font-semibold mb-4 mt-8">{{ t('docs.api.authentication.title') }}</h3>
            <p class="mb-4">{{ t('docs.api.authentication.description') }}</p>
            
            <Card class="mb-6">
              <CardHeader>
                <CardTitle class="text-lg">{{ t('docs.api.authentication.example') }}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre class="bg-muted p-4 rounded text-sm overflow-x-auto"><code>Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</code></pre>
              </CardContent>
            </Card>

            <h3 class="text-xl font-semibold mb-4">{{ t('docs.api.rateLimiting.title') }}</h3>
            <p class="mb-4">{{ t('docs.api.rateLimiting.description') }}</p>
            <ul class="list-disc pl-6 mb-6 space-y-2">
              <li>{{ t('docs.api.rateLimiting.global') }}</li>
              <li>{{ t('docs.api.rateLimiting.perTenant') }}</li>
              <li>{{ t('docs.api.rateLimiting.auth') }}</li>
            </ul>
          </div>
        </section>

        <!-- Getting Started -->
        <section id="getting-started" class="mb-12">
          <h2 class="text-3xl font-bold mb-6">{{ t('docs.gettingStarted.title') }}</h2>
          
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <p class="text-lg mb-6">{{ t('docs.gettingStarted.description') }}</p>
            
            <h3 class="text-xl font-semibold mb-4">{{ t('docs.gettingStarted.steps.title') }}</h3>
            <ol class="list-decimal pl-6 mb-6 space-y-4">
              <li>
                <strong>{{ t('docs.gettingStarted.steps.step1.title') }}</strong><br>
                <span class="text-muted-foreground">{{ t('docs.gettingStarted.steps.step1.description') }}</span>
              </li>
              <li>
                <strong>{{ t('docs.gettingStarted.steps.step2.title') }}</strong><br>
                <span class="text-muted-foreground">{{ t('docs.gettingStarted.steps.step2.description') }}</span>
              </li>
              <li>
                <strong>{{ t('docs.gettingStarted.steps.step3.title') }}</strong><br>
                <span class="text-muted-foreground">{{ t('docs.gettingStarted.steps.step3.description') }}</span>
              </li>
              <li>
                <strong>{{ t('docs.gettingStarted.steps.step4.title') }}</strong><br>
                <span class="text-muted-foreground">{{ t('docs.gettingStarted.steps.step4.description') }}</span>
              </li>
            </ol>

            <h3 class="text-xl font-semibold mb-4">{{ t('docs.gettingStarted.support.title') }}</h3>
            <p class="mb-4">{{ t('docs.gettingStarted.support.description') }}</p>
            
            <div class="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline">
                <a href="mailto:info@wasplanning.nl" class="inline-flex items-center justify-center">
                  <Mail class="mr-2 h-4 w-4" />
                  {{ t('docs.gettingStarted.support.email') }}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a :href="apiDocsUrl" target="_blank" class="inline-flex items-center justify-center">
                  <ExternalLink class="mr-2 h-4 w-4" />
                  {{ t('docs.gettingStarted.support.swagger') }}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Footer -->
    <footer class="border-t py-12 bg-muted/50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center gap-2 mb-4 md:mb-0">
            <img src="/wasplanning-logo.png" alt="Wasplanning Logo" class="h-8 w-8 object-contain" />
            <span class="font-bold">{{ t('app.name') }}</span>
          </div>
          <div class="text-sm text-muted-foreground">
            © 2024 {{ t('app.name') }}. {{ t('landing.footer.rights') }}
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import LanguageSwitcher from '~/components/LanguageSwitcher.vue'
import { 
  ExternalLink,
  Code,
  Mail,
  AlertCircle
} from 'lucide-vue-next'

const { t } = useI18n()
const { getApiUrl } = useApi()

// Dynamic API docs URL
const apiDocsUrl = getApiUrl('/api/docs')

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Head meta
useHead({
  title: t('docs.metaTitle'),
  meta: [
    { name: 'description', content: t('docs.metaDescription') },
    { property: 'og:title', content: t('docs.metaTitle') },
    { property: 'og:description', content: t('docs.metaDescription') },
    { property: 'og:type', content: 'website' }
  ]
})
</script>