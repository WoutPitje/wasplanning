<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('delivery.schedule.completedWashes') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('delivery.schedule.completedWashesDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('delivery.schedule.returnPlanning') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('delivery.schedule.returnPlanningDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('delivery.schedule.urgentDeliveries') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('delivery.schedule.urgentDeliveriesDescription') }}</p>
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