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
        <h1 class="text-4xl font-bold mb-8">{{ t('privacy.title') }}</h1>
        
        <div class="prose prose-gray dark:prose-invert max-w-none">
          <p class="text-lg text-muted-foreground mb-8">
            {{ t('privacy.lastUpdated', { date: new Date('2024-01-01').toLocaleDateString(locale) }) }}
          </p>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.intro.title') }}</h2>
            <p>{{ t('privacy.intro.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.dataCollection.title') }}</h2>
            <p class="mb-4">{{ t('privacy.dataCollection.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('privacy.dataCollection.item1') }}</li>
              <li>{{ t('privacy.dataCollection.item2') }}</li>
              <li>{{ t('privacy.dataCollection.item3') }}</li>
              <li>{{ t('privacy.dataCollection.item4') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.dataUsage.title') }}</h2>
            <p class="mb-4">{{ t('privacy.dataUsage.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('privacy.dataUsage.item1') }}</li>
              <li>{{ t('privacy.dataUsage.item2') }}</li>
              <li>{{ t('privacy.dataUsage.item3') }}</li>
              <li>{{ t('privacy.dataUsage.item4') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.dataProtection.title') }}</h2>
            <p>{{ t('privacy.dataProtection.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.dataSharing.title') }}</h2>
            <p class="mb-4">{{ t('privacy.dataSharing.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('privacy.dataSharing.item1') }}</li>
              <li>{{ t('privacy.dataSharing.item2') }}</li>
              <li>{{ t('privacy.dataSharing.item3') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.cookies.title') }}</h2>
            <p>{{ t('privacy.cookies.content') }}</p>
            <p class="mt-4">
              <NuxtLink to="/cookies" class="text-primary hover:underline">
                {{ t('privacy.cookies.link') }}
              </NuxtLink>
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.rights.title') }}</h2>
            <p class="mb-4">{{ t('privacy.rights.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('privacy.rights.item1') }}</li>
              <li>{{ t('privacy.rights.item2') }}</li>
              <li>{{ t('privacy.rights.item3') }}</li>
              <li>{{ t('privacy.rights.item4') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.retention.title') }}</h2>
            <p>{{ t('privacy.retention.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('privacy.contact.title') }}</h2>
            <p>{{ t('privacy.contact.intro') }}</p>
            <div class="mt-4 p-4 bg-muted rounded-lg">
              <p class="font-semibold">{{ t('app.name') }}</p>
              <p>{{ t('privacy.contact.email') }}: privacy@wasplanning.nl</p>
              <p>{{ t('privacy.contact.phone') }}: +31 (0)20 123 4567</p>
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
  title: t('privacy.metaTitle'),
  meta: [
    { name: 'description', content: t('privacy.metaDescription') }
  ]
})
</script>