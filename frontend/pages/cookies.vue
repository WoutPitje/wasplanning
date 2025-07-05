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

    <!-- Content -->
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-8">{{ t('cookies.title') }}</h1>
        
        <div class="prose prose-gray dark:prose-invert max-w-none">
          <p class="text-lg text-muted-foreground mb-8">
            {{ t('cookies.lastUpdated', { date: new Date('2024-01-01').toLocaleDateString(locale) }) }}
          </p>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.intro.title') }}</h2>
            <p>{{ t('cookies.intro.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.what.title') }}</h2>
            <p>{{ t('cookies.what.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.types.title') }}</h2>
            
            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">{{ t('cookies.types.necessary.title') }}</h3>
              <p class="mb-2">{{ t('cookies.types.necessary.description') }}</p>
              <div class="bg-muted rounded-lg p-4">
                <ul class="space-y-2">
                  <li><strong>{{ t('cookies.types.necessary.cookie1.name') }}</strong>: {{ t('cookies.types.necessary.cookie1.purpose') }}</li>
                  <li><strong>{{ t('cookies.types.necessary.cookie2.name') }}</strong>: {{ t('cookies.types.necessary.cookie2.purpose') }}</li>
                </ul>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">{{ t('cookies.types.functional.title') }}</h3>
              <p class="mb-2">{{ t('cookies.types.functional.description') }}</p>
              <div class="bg-muted rounded-lg p-4">
                <ul class="space-y-2">
                  <li><strong>{{ t('cookies.types.functional.cookie1.name') }}</strong>: {{ t('cookies.types.functional.cookie1.purpose') }}</li>
                  <li><strong>{{ t('cookies.types.functional.cookie2.name') }}</strong>: {{ t('cookies.types.functional.cookie2.purpose') }}</li>
                </ul>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-semibold mb-2">{{ t('cookies.types.analytics.title') }}</h3>
              <p class="mb-2">{{ t('cookies.types.analytics.description') }}</p>
              <div class="bg-muted rounded-lg p-4">
                <ul class="space-y-2">
                  <li><strong>{{ t('cookies.types.analytics.cookie1.name') }}</strong>: {{ t('cookies.types.analytics.cookie1.purpose') }}</li>
                  <li><strong>{{ t('cookies.types.analytics.cookie2.name') }}</strong>: {{ t('cookies.types.analytics.cookie2.purpose') }}</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.thirdParty.title') }}</h2>
            <p>{{ t('cookies.thirdParty.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.manage.title') }}</h2>
            <p class="mb-4">{{ t('cookies.manage.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> {{ t('cookies.manage.chrome') }}</li>
              <li><strong>Firefox:</strong> {{ t('cookies.manage.firefox') }}</li>
              <li><strong>Safari:</strong> {{ t('cookies.manage.safari') }}</li>
              <li><strong>Edge:</strong> {{ t('cookies.manage.edge') }}</li>
            </ul>
            <p class="mt-4">{{ t('cookies.manage.warning') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.consent.title') }}</h2>
            <p>{{ t('cookies.consent.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.updates.title') }}</h2>
            <p>{{ t('cookies.updates.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('cookies.contact.title') }}</h2>
            <p>{{ t('cookies.contact.intro') }}</p>
            <div class="mt-4 p-4 bg-muted rounded-lg">
              <p class="font-semibold">{{ t('app.name') }}</p>
              <p>{{ t('cookies.contact.email') }}: privacy@wasplanning.nl</p>
              <p>{{ t('cookies.contact.phone') }}: +31 (0)20 123 4567</p>
            </div>
          </section>
        </div>

        <div class="mt-12 pt-8 border-t">
          <Button variant="outline" asChild>
            <NuxtLink to="/">{{ t('common.back') }}</NuxtLink>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import LanguageSwitcher from '~/components/LanguageSwitcher.vue'

const { t, locale } = useI18n()

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Head meta
useHead({
  title: t('cookies.metaTitle'),
  meta: [
    { name: 'description', content: t('cookies.metaDescription') }
  ]
})
</script>