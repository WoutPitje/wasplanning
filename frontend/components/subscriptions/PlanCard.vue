<template>
  <Card :class="{ 'ring-2 ring-primary': current }">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>{{ plan.display_name }}</CardTitle>
        <Badge v-if="current" variant="default">{{ t('subscription.current') }}</Badge>
      </div>
      <CardDescription>
        <span class="text-2xl font-bold">{{ formatPrice(plan.price_cents) }}</span>
        <span class="text-muted-foreground">{{ t('subscription.perMonth') }}</span>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-3">
        <div class="space-y-2">
          <div class="flex items-center text-sm">
            <Users class="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{{ plan.max_active_users === null ? t('subscription.unlimited') : plan.max_active_users }} {{ t('subscription.users') }}</span>
          </div>
          <div class="flex items-center text-sm">
            <Car class="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{{ plan.max_cars_per_month === null ? t('subscription.unlimited') : plan.max_cars_per_month }} {{ t('subscription.vehicles') }}</span>
          </div>
          <div class="flex items-center text-sm">
            <MapPin class="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{{ plan.max_locations === null ? t('subscription.unlimited') : plan.max_locations }} {{ t('subscription.locations') }}</span>
          </div>
        </div>
        
        <div class="pt-3 border-t">
          <ul class="space-y-1">
            <li v-for="(enabled, feature) in plan.features" :key="feature" v-show="enabled" class="flex items-center text-sm">
              <Check class="h-4 w-4 mr-2 text-green-600" />
              <span>{{ t(`subscription.features.${feature}`) }}</span>
            </li>
          </ul>
        </div>
        
        <Button 
          v-if="!current" 
          class="w-full mt-4"
          :variant="canDowngrade ? 'default' : 'secondary'"
          :disabled="!canDowngrade"
          @click="$emit('select')"
        >
          {{ t('subscription.changeTo') }} {{ plan.display_name }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Users, Car, MapPin, Check } from 'lucide-vue-next'
import type { SubscriptionPlan } from '~/types/subscriptions'

interface Props {
  plan: SubscriptionPlan
  current?: boolean
  canDowngrade?: boolean
}

defineProps<Props>()
defineEmits<{
  select: []
}>()

const { t } = useI18n()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(price / 100)
}
</script>