<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ t('subscription.title') }}</h1>
            <p class="mt-1 text-gray-600">{{ t('subscription.description') }}</p>
          </div>
          <div v-if="currentSubscription && !currentSubscription.cancelAtPeriodEnd">
            <Button
              @click="showCancelDialog = true"
              variant="outline"
              class="text-red-600 border-red-200 hover:bg-red-50"
            >
              {{ t('subscription.cancelSubscription') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">{{ t('common.loading') }}</span>
      </div>
    </div>

    <!-- Current Subscription -->
    <div v-else-if="currentSubscription" class="space-y-6">
      <!-- Subscription Overview -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.current.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.current.description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Plan Info -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <h3 class="font-semibold text-blue-900">{{ currentSubscription.plan.displayName }}</h3>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                {{ formatPrice(currentSubscription.billingInterval === 'month' 
                  ? currentSubscription.plan.priceMonthly 
                  : currentSubscription.plan.priceYearly / 12) }}
              </p>
              <p class="text-sm text-blue-700">
                {{ t(`subscription.billing.${currentSubscription.billingInterval}`) }}
              </p>
            </div>

            <!-- Status -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-semibold text-gray-900">{{ t('subscription.status.title') }}</h3>
              <div class="mt-1">
                <Badge :variant="getStatusVariant(currentSubscription.status)">
                  {{ t(`subscription.status.${currentSubscription.status}`) }}
                </Badge>
              </div>
              <p class="text-sm text-gray-600 mt-1">
                {{ t('subscription.renewsOn') }}: {{ formatDate(currentSubscription.currentPeriodEnd) }}
              </p>
            </div>

            <!-- Trial Info -->
            <div v-if="currentSubscription.trialEnd" class="bg-green-50 p-4 rounded-lg">
              <h3 class="font-semibold text-green-900">{{ t('subscription.trial.title') }}</h3>
              <p class="text-sm text-green-700 mt-1">
                {{ t('subscription.trial.endsOn') }}: {{ formatDate(currentSubscription.trialEnd) }}
              </p>
            </div>
          </div>

          <!-- Cancellation Notice -->
          <div v-if="currentSubscription.cancelAtPeriodEnd" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <AlertTriangle class="h-5 w-5 text-yellow-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">
                  {{ t('subscription.cancellation.title') }}
                </h3>
                <p class="mt-1 text-sm text-yellow-700">
                  {{ t('subscription.cancellation.message', { date: formatDate(currentSubscription.currentPeriodEnd) }) }}
                </p>
                <div class="mt-4">
                  <Button @click="reactivateSubscription" size="sm" variant="outline">
                    {{ t('subscription.reactivate') }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Usage Overview -->
      <Card v-if="usageData">
        <CardHeader>
          <CardTitle>{{ t('subscription.usage.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.usage.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Cars Washed -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">{{ t('subscription.usage.cars') }}</span>
                <span class="text-sm text-gray-500">
                  {{ usageData.usage.cars_washed }}
                  <span v-if="usageData.limits.cars.limit">/ {{ usageData.limits.cars.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.cars.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.cars.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.cars.percentage, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Active Users -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">{{ t('subscription.usage.users') }}</span>
                <span class="text-sm text-gray-500">
                  {{ usageData.usage.active_users }}
                  <span v-if="usageData.limits.users.limit">/ {{ usageData.limits.users.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.users.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.users.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.users.percentage, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Active Locations -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">{{ t('subscription.usage.locations') }}</span>
                <span class="text-sm text-gray-500">
                  {{ usageData.usage.active_locations }}
                  <span v-if="usageData.limits.locations.limit">/ {{ usageData.limits.locations.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.locations.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.locations.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.locations.percentage, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Usage Warnings -->
          <div v-if="usageData.warnings.warning || usageData.warnings.critical" class="mt-4">
            <div :class="[
              'border rounded-lg p-4',
              usageData.warnings.critical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            ]">
              <div class="flex">
                <AlertTriangle :class="[
                  'h-5 w-5',
                  usageData.warnings.critical ? 'text-red-400' : 'text-yellow-400'
                ]" />
                <div class="ml-3">
                  <h3 :class="[
                    'text-sm font-medium',
                    usageData.warnings.critical ? 'text-red-800' : 'text-yellow-800'
                  ]">
                    {{ usageData.warnings.critical ? t('subscription.usage.limitExceeded') : t('subscription.usage.approachingLimit') }}
                  </h3>
                  <ul :class="[
                    'mt-1 text-sm list-disc list-inside space-y-1',
                    usageData.warnings.critical ? 'text-red-700' : 'text-yellow-700'
                  ]">
                    <li v-for="message in usageData.warnings.messages" :key="message">
                      {{ message }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Available Plans -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.changePlan.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.changePlan.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="plan in availablePlans"
              :key="plan.id"
              :class="[
                'border rounded-lg p-4 cursor-pointer transition-all',
                plan.id === currentSubscription.planId 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              ]"
              @click="plan.id !== currentSubscription.planId && selectPlan(plan)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-gray-900">{{ plan.displayName }}</h3>
                  <p class="text-2xl font-bold text-gray-900 mt-1">
                    {{ formatPrice(plan.priceMonthly) }}
                  </p>
                  <p class="text-sm text-gray-600">{{ t('pricing.perMonth') }}</p>
                </div>
                <div v-if="plan.id === currentSubscription.planId">
                  <Badge variant="default">{{ t('subscription.current.badge') }}</Badge>
                </div>
              </div>
              
              <div class="mt-4 space-y-2">
                <div class="text-sm text-gray-600">
                  <div v-if="plan.maxCarsPerMonth">
                    {{ t('pricing.maxCars', { count: plan.maxCarsPerMonth.toLocaleString() }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedCars') }}</div>
                  
                  <div v-if="plan.maxUsers">
                    {{ t('pricing.maxUsers', { count: plan.maxUsers }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedUsers') }}</div>
                  
                  <div v-if="plan.maxLocations">
                    {{ t('pricing.maxLocations', { count: plan.maxLocations }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedLocations') }}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- No Subscription State -->
    <div v-else class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6 text-center">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          {{ t('subscription.noSubscription.title') }}
        </h2>
        <p class="text-gray-600 mb-6">
          {{ t('subscription.noSubscription.description') }}
        </p>
        <div class="space-y-4">
          <NuxtLink to="/pricing">
            <Button>{{ t('subscription.viewPlans') }}</Button>
          </NuxtLink>
          <p class="text-sm text-gray-500">
            {{ t('subscription.noSubscription.trialInfo') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Cancel Subscription Dialog -->
    <Dialog v-model:open="showCancelDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('subscription.cancel.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.cancel.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              {{ t('subscription.cancel.warning', { date: formatDate(currentSubscription?.currentPeriodEnd) }) }}
            </p>
          </div>
          
          <div class="space-y-2">
            <label class="flex items-center space-x-2">
              <input
                v-model="cancelImmediately"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700">
                {{ t('subscription.cancel.immediately') }}
              </span>
            </label>
            <p class="text-xs text-gray-500 ml-6">
              {{ t('subscription.cancel.immediatelyWarning') }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showCancelDialog = false" variant="outline">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="confirmCancellation" variant="destructive">
            {{ t('subscription.cancel.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Plan Change Dialog -->
    <Dialog v-model:open="showPlanChangeDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('subscription.changePlan.confirm.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.changePlan.confirm.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedPlan" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-blue-900">{{ selectedPlan.displayName }}</h3>
                <p class="text-blue-700">{{ formatPrice(selectedPlan.priceMonthly) }} {{ t('pricing.perMonth') }}</p>
              </div>
            </div>
          </div>
          
          <p class="text-sm text-gray-600">
            {{ t('subscription.changePlan.confirm.effective') }}
          </p>
        </div>

        <DialogFooter>
          <Button @click="showPlanChangeDialog = false" variant="outline">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="confirmPlanChange">
            {{ t('subscription.changePlan.confirm.button') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import type { SubscriptionPlan, Subscription, UsageData } from '~/types/subscriptions'

// Auth middleware
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

// i18n
const { t } = useI18n()

// Reactive state
const currentSubscription = ref<Subscription | null>(null)
const availablePlans = ref<SubscriptionPlan[]>([])
const usageData = ref<UsageData | null>(null)
const showCancelDialog = ref(false)
const showPlanChangeDialog = ref(false)
const cancelImmediately = ref(false)
const selectedPlan = ref<SubscriptionPlan | null>(null)

// Composables
const {
  loading,
  error,
  getCurrentSubscription,
  getPlans,
  updateSubscription,
  cancelSubscription,
  getCurrentUsage,
  formatPrice,
  getUsageWarningLevel,
} = useSubscriptions()

// SEO
useSeoMeta({
  title: computed(() => t('subscription.seoTitle')),
  description: computed(() => t('subscription.seoDescription')),
})

// Load data
const loadData = async () => {
  try {
    const [subscription, plans, usage] = await Promise.all([
      getCurrentSubscription(),
      getPlans(),
      getCurrentUsage().catch(() => null), // Usage might not be available without subscription
    ])
    
    currentSubscription.value = subscription
    availablePlans.value = plans
    if (usage) usageData.value = usage
  } catch (err) {
    console.error('Failed to load subscription data:', err)
  }
}

// Utility functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('nl-NL')
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default'
    case 'trialing': return 'secondary'
    case 'past_due': return 'destructive'
    case 'canceled': return 'outline'
    default: return 'secondary'
  }
}

// Actions
const selectPlan = (plan: SubscriptionPlan) => {
  selectedPlan.value = plan
  showPlanChangeDialog.value = true
}

const confirmPlanChange = async () => {
  if (!selectedPlan.value || !currentSubscription.value) return
  
  try {
    await updateSubscription(currentSubscription.value.id, {
      planName: selectedPlan.value.name,
    })
    
    showPlanChangeDialog.value = false
    await loadData() // Reload data
  } catch (err) {
    console.error('Failed to change plan:', err)
  }
}

const confirmCancellation = async () => {
  if (!currentSubscription.value) return
  
  try {
    await cancelSubscription(currentSubscription.value.id, cancelImmediately.value)
    showCancelDialog.value = false
    await loadData() // Reload data
  } catch (err) {
    console.error('Failed to cancel subscription:', err)
  }
}

const reactivateSubscription = async () => {
  if (!currentSubscription.value) return
  
  try {
    await updateSubscription(currentSubscription.value.id, {
      cancelAtPeriodEnd: false,
    })
    await loadData() // Reload data
  } catch (err) {
    console.error('Failed to reactivate subscription:', err)
  }
}

// Load data on mount
await loadData()
</script>