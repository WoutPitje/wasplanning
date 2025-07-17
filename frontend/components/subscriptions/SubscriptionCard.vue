<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>{{ subscription.plan_display_name }}</CardTitle>
          <CardDescription>
            {{ formatPrice(subscription.price_cents) }} {{ t('subscription.perMonth') }}
          </CardDescription>
        </div>
        <div class="flex flex-col items-end gap-2">
          <Badge :variant="getStatusVariant(subscription.status)">
            {{ t(`subscription.status.${subscription.status.toUpperCase()}`) }}
          </Badge>
          <Badge v-if="subscription.cancel_at_period_end" variant="secondary">
            {{ t('subscription.scheduledCancel') }}
          </Badge>
        </div>
      </div>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Billing Period -->
      <div>
        <p class="text-sm font-medium mb-1">{{ t('subscription.billingPeriod') }}</p>
        <p class="text-sm text-muted-foreground">
          {{ formatDate(subscription.current_period_start) }} - {{ formatDate(subscription.current_period_end) }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ t('subscription.daysRemaining', { days: subscription.days_remaining }) }}
        </p>
      </div>

      <!-- Quick Usage Stats -->
      <div>
        <p class="text-sm font-medium mb-2">{{ t('subscription.quickUsage') }}</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2 rounded-lg bg-muted">
            <p class="text-xs text-muted-foreground">{{ t('subscription.cars') }}</p>
            <p class="font-semibold">
              {{ subscription.usage.cars_washed.current.toLocaleString() }}
              <span class="text-xs text-muted-foreground">
                / {{ subscription.usage.cars_washed.limit?.toLocaleString() ?? '∞' }}
              </span>
            </p>
          </div>
          <div class="p-2 rounded-lg bg-muted">
            <p class="text-xs text-muted-foreground">{{ t('subscription.users') }}</p>
            <p class="font-semibold">
              {{ subscription.usage.active_users.current }}
              <span class="text-xs text-muted-foreground">
                / {{ subscription.usage.active_users.limit ?? '∞' }}
              </span>
            </p>
          </div>
          <div class="p-2 rounded-lg bg-muted">
            <p class="text-xs text-muted-foreground">{{ t('subscription.locations') }}</p>
            <p class="font-semibold">
              {{ subscription.usage.locations.current }}
              <span class="text-xs text-muted-foreground">
                / {{ subscription.usage.locations.limit ?? '∞' }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 pt-2">
        <Button 
          v-if="!subscription.cancel_at_period_end"
          variant="outline" 
          size="sm"
          class="flex-1"
          @click="$emit('manage-plan')"
        >
          {{ t('subscription.changePlan') }}
        </Button>
        <Button 
          v-else
          variant="outline" 
          size="sm"
          class="flex-1"
          @click="$emit('reactivate')"
        >
          {{ t('subscription.keepPlan') }}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          @click="$emit('view-details')"
        >
          {{ t('subscription.viewDetails') }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { Subscription } from '~/types/subscriptions'

interface Props {
  subscription: Subscription
}

defineProps<Props>()
defineEmits<{
  'manage-plan': []
  'reactivate': []
  'view-details': []
}>()

const { t } = useI18n()

// Methods
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    past_due: 'destructive',
    canceled: 'secondary',
    incomplete: 'outline'
  }
  return variants[status.toLowerCase()] || 'default'
}

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>