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
        <h1 class="text-4xl font-bold mb-8">{{ t('terms.title') }}</h1>
        
        <div class="prose prose-gray dark:prose-invert max-w-none">
          <p class="text-lg text-muted-foreground mb-8">
            {{ t('terms.lastUpdated', { date: new Date('2024-01-01').toLocaleDateString(locale) }) }}
          </p>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.acceptance.title') }}</h2>
            <p>{{ t('terms.acceptance.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.serviceDescription.title') }}</h2>
            <p>{{ t('terms.serviceDescription.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.userAccounts.title') }}</h2>
            <p class="mb-4">{{ t('terms.userAccounts.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('terms.userAccounts.item1') }}</li>
              <li>{{ t('terms.userAccounts.item2') }}</li>
              <li>{{ t('terms.userAccounts.item3') }}</li>
              <li>{{ t('terms.userAccounts.item4') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.acceptableUse.title') }}</h2>
            <p class="mb-4">{{ t('terms.acceptableUse.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('terms.acceptableUse.item1') }}</li>
              <li>{{ t('terms.acceptableUse.item2') }}</li>
              <li>{{ t('terms.acceptableUse.item3') }}</li>
              <li>{{ t('terms.acceptableUse.item4') }}</li>
              <li>{{ t('terms.acceptableUse.item5') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.payment.title') }}</h2>
            <p class="mb-4">{{ t('terms.payment.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('terms.payment.item1') }}</li>
              <li>{{ t('terms.payment.item2') }}</li>
              <li>{{ t('terms.payment.item3') }}</li>
              <li>{{ t('terms.payment.item4') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.intellectualProperty.title') }}</h2>
            <p>{{ t('terms.intellectualProperty.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.dataProtection.title') }}</h2>
            <p>{{ t('terms.dataProtection.content') }}</p>
            <p class="mt-4">
              <NuxtLink to="/privacy" class="text-primary hover:underline">
                {{ t('terms.dataProtection.link') }}
              </NuxtLink>
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.liability.title') }}</h2>
            <p>{{ t('terms.liability.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.termination.title') }}</h2>
            <p class="mb-4">{{ t('terms.termination.intro') }}</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>{{ t('terms.termination.item1') }}</li>
              <li>{{ t('terms.termination.item2') }}</li>
              <li>{{ t('terms.termination.item3') }}</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.changes.title') }}</h2>
            <p>{{ t('terms.changes.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.governing.title') }}</h2>
            <p>{{ t('terms.governing.content') }}</p>
          </section>

          <section class="mb-8">
            <h2 class="text-2xl font-semibold mb-4">{{ t('terms.contact.title') }}</h2>
            <p>{{ t('terms.contact.intro') }}</p>
            <div class="mt-4 p-4 bg-muted rounded-lg">
              <p class="font-semibold">{{ t('app.name') }}</p>
              <p>{{ t('terms.contact.email') }}: legal@wasplanning.nl</p>
              <p>{{ t('terms.contact.phone') }}: +31 (0)20 123 4567</p>
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
  title: t('terms.metaTitle'),
  meta: [
    { name: 'description', content: t('terms.metaDescription') }
  ]
})
</script>