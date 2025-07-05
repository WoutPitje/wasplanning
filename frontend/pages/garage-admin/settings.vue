<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">{{ t('garageAdmin.settings.title') }}</h2>
      <p class="text-muted-foreground">{{ t('garageAdmin.settings.subtitle') }}</p>
    </div>
    
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">{{ t('garageAdmin.settings.generalSettings') }}</h3>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('garageAdmin.settings.placeholder') }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})
</script>