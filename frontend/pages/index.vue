<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <h1 class="text-4xl font-bold text-foreground mb-2">
          {{ t('app.name') }}
        </h1>
        <p class="text-lg text-muted-foreground">
          {{ t('home.subtitle') }}
        </p>
      </CardHeader>
      <CardContent class="text-center space-y-6">
        <p class="text-muted-foreground">
          {{ t('home.description') }}
        </p>
        
        <Button asChild class="w-full">
          <NuxtLink to="/login">
            {{ t('common.login') }}
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

const { t } = useI18n()

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Head meta
useHead({
  title: t('home.metaTitle'),
  meta: [
    { name: 'description', content: t('home.metaDescription') }
  ]
})
</script>