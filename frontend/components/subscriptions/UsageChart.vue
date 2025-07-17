<template>
  <div class="space-y-4">
    <!-- Chart Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{{ t('subscription.usage.overview') }}</h3>
      <div class="text-sm text-muted-foreground">
        {{ t('subscription.usage.period') }}: {{ formatDate(periodStart) }} - {{ formatDate(periodEnd) }}
      </div>
    </div>

    <!-- Usage Charts -->
    <div class="grid gap-4 md:grid-cols-3">
      <!-- Cars Washed Chart -->
      <Card>
        <CardContent class="p-6">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Car class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">{{ t('subscription.usage.cars_washed') }}</span>
              </div>
              <Badge :variant="getUsageVariant(usage.cars_washed)">
                {{ getUsagePercentage(usage.cars_washed) }}%
              </Badge>
            </div>
            
            <div class="space-y-1">
              <Progress :value="getUsagePercentage(usage.cars_washed)" :class="getProgressClass(usage.cars_washed)" />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{{ usage.cars_washed.current.toLocaleString() }}</span>
                <span>{{ usage.cars_washed.limit ? usage.cars_washed.limit.toLocaleString() : t('subscription.unlimited') }}</span>
              </div>
            </div>

            <!-- Circular Chart for Desktop -->
            <div class="hidden md:block mt-4">
              <svg class="w-full h-32" viewBox="0 0 100 100">
                <!-- Background Circle -->
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="8"
                  class="text-muted"
                />
                <!-- Progress Circle -->
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  :stroke="getChartColor(usage.cars_washed)"
                  stroke-width="8"
                  :stroke-dasharray="`${getCircleProgress(usage.cars_washed)} 251.2`"
                  transform="rotate(-90 50 50)"
                  class="transition-all duration-500"
                />
                <!-- Center Text -->
                <text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="fill-current text-lg font-semibold">
                  {{ getUsagePercentage(usage.cars_washed) }}%
                </text>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Active Users Chart -->
      <Card>
        <CardContent class="p-6">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Users class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">{{ t('subscription.usage.active_users') }}</span>
              </div>
              <Badge :variant="getUsageVariant(usage.active_users)">
                {{ getUsagePercentage(usage.active_users) }}%
              </Badge>
            </div>
            
            <div class="space-y-1">
              <Progress :value="getUsagePercentage(usage.active_users)" :class="getProgressClass(usage.active_users)" />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{{ usage.active_users.current }}</span>
                <span>{{ usage.active_users.limit ?? t('subscription.unlimited') }}</span>
              </div>
            </div>

            <!-- Circular Chart for Desktop -->
            <div class="hidden md:block mt-4">
              <svg class="w-full h-32" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" class="text-muted" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  :stroke="getChartColor(usage.active_users)"
                  stroke-width="8"
                  :stroke-dasharray="`${getCircleProgress(usage.active_users)} 251.2`"
                  transform="rotate(-90 50 50)"
                  class="transition-all duration-500"
                />
                <text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="fill-current text-lg font-semibold">
                  {{ getUsagePercentage(usage.active_users) }}%
                </text>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Locations Chart -->
      <Card>
        <CardContent class="p-6">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">{{ t('subscription.usage.locations') }}</span>
              </div>
              <Badge :variant="getUsageVariant(usage.locations)">
                {{ getUsagePercentage(usage.locations) }}%
              </Badge>
            </div>
            
            <div class="space-y-1">
              <Progress :value="getUsagePercentage(usage.locations)" :class="getProgressClass(usage.locations)" />
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>{{ usage.locations.current }}</span>
                <span>{{ usage.locations.limit ?? t('subscription.unlimited') }}</span>
              </div>
            </div>

            <!-- Circular Chart for Desktop -->
            <div class="hidden md:block mt-4">
              <svg class="w-full h-32" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" class="text-muted" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  :stroke="getChartColor(usage.locations)"
                  stroke-width="8"
                  :stroke-dasharray="`${getCircleProgress(usage.locations)} 251.2`"
                  transform="rotate(-90 50 50)"
                  class="transition-all duration-500"
                />
                <text x="50" y="50" text-anchor="middle" dominant-baseline="central" class="fill-current text-lg font-semibold">
                  {{ getUsagePercentage(usage.locations) }}%
                </text>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Usage Alerts -->
    <div v-if="hasUsageAlerts" class="space-y-2">
      <Alert v-if="hasLimitExceeded" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>{{ t('subscription.usage.limitExceeded') }}</AlertTitle>
        <AlertDescription>
          {{ t('subscription.usage.limitExceededDescription') }}
        </AlertDescription>
      </Alert>
      
      <Alert v-else-if="hasHighUsage" variant="secondary">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>{{ t('subscription.usage.highUsage') }}</AlertTitle>
        <AlertDescription>
          {{ t('subscription.usage.highUsageDescription') }}
        </AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { Car, Users, MapPin, AlertCircle, AlertTriangle } from 'lucide-vue-next'

interface UsageItem {
  current: number
  limit: number | null
  percentage: number
}

interface Props {
  usage: {
    cars_washed: UsageItem
    active_users: UsageItem
    locations: UsageItem
  }
  periodStart: string
  periodEnd: string
}

const props = defineProps<Props>()
const { t } = useI18n()

// Computed properties
const hasLimitExceeded = computed(() => {
  return Object.values(props.usage).some(item => 
    item.limit !== null && item.current > item.limit
  )
})

const hasHighUsage = computed(() => {
  // Don't show high usage warning if only locations is at/near limit
  const itemsNearLimit = Object.entries(props.usage).filter(([key, item]) => 
    item.limit !== null && item.percentage >= 80
  )
  
  // If only locations is near/at limit, don't show warning
  if (itemsNearLimit.length === 1 && itemsNearLimit[0][0] === 'locations') {
    return false
  }
  
  return itemsNearLimit.length > 0
})

const hasUsageAlerts = computed(() => hasLimitExceeded.value || hasHighUsage.value)

// Methods
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short'
  })
}

const getUsagePercentage = (item: UsageItem): number => {
  if (!item.limit || item.limit === 0) return 0
  return Math.min(100, Math.round((item.current / item.limit) * 100))
}

const getUsageVariant = (item: UsageItem): 'default' | 'secondary' | 'destructive' => {
  const percentage = getUsagePercentage(item)
  if (percentage >= 100) return 'destructive'
  if (percentage >= 80) return 'secondary'
  return 'default'
}

const getProgressClass = (item: UsageItem): string => {
  const percentage = getUsagePercentage(item)
  if (percentage >= 100) return '[&>*]:bg-destructive'
  if (percentage >= 80) return '[&>*]:bg-yellow-500'
  return ''
}

const getChartColor = (item: UsageItem): string => {
  const percentage = getUsagePercentage(item)
  if (percentage >= 100) return 'hsl(var(--destructive))'
  if (percentage >= 80) return 'rgb(234 179 8)' // yellow-500
  return 'hsl(var(--primary))'
}

const getCircleProgress = (item: UsageItem): number => {
  const percentage = getUsagePercentage(item)
  // Circle circumference is 2 * PI * r = 2 * 3.14159 * 40 = 251.2
  return (percentage / 100) * 251.2
}
</script>