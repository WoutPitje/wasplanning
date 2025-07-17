<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">{{ t('subscription.title') }}</h2>
      <p class="text-muted-foreground">{{ t('subscription.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Card v-for="i in 3" :key="i">
        <CardHeader>
          <div class="h-4 bg-muted rounded w-1/4 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div class="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error && !showPaymentMethodError" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') }}</AlertTitle>
      <AlertDescription>
        {{ error }}
        <span v-if="error.includes('Forbidden')">
          <br />{{ t('subscription.errors.forbidden') }}
        </span>
      </AlertDescription>
    </Alert>

    <!-- Payment Method Required Alert -->
    <Alert v-if="showPaymentMethodError" variant="destructive" class="mb-6">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('subscription.paymentMethodRequired.title') }}</AlertTitle>
      <AlertDescription>
        <div class="space-y-2">
          <p>{{ t('subscription.paymentMethodRequired.description') }}</p>
          <Button size="sm" variant="outline" @click="handleAddPaymentMethodFromError">
            <Plus class="h-4 w-4 mr-2" />
            {{ t('subscription.paymentMethodRequired.addButton') }}
          </Button>
        </div>
      </AlertDescription>
    </Alert>

    <!-- Subscription Content -->
    <div v-else class="grid grid-cols-1 gap-6">
      <!-- Current Plan -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.currentPlan') }}</CardTitle>
          <CardDescription>{{ t('subscription.currentPlanDescription') }}</CardDescription>
        </CardHeader>
        <CardContent v-if="subscription">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">{{ subscription.plan_display_name }}</h3>
                <p class="text-sm text-muted-foreground">
                  {{ formatPrice(subscription.price_cents) }} {{ t('subscription.perMonth') }}
                </p>
              </div>
              <Badge :variant="getStatusVariant(subscription.status)">
                {{ t(`subscription.status.${subscription.status.toUpperCase()}`) }}
              </Badge>
            </div>
            
            <!-- Grace Period Warning -->
            <Alert v-if="subscription.grace_period_end && isInGracePeriod" variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <AlertTitle>{{ t('subscription.gracePeriod.title') }}</AlertTitle>
              <AlertDescription>
                {{ t('subscription.gracePeriod.description', { date: formatDate(subscription.grace_period_end) }) }}
              </AlertDescription>
            </Alert>

            <!-- Pending Cancellation Warning -->
            <Alert v-if="subscription.cancel_at_period_end" variant="secondary">
              <Info class="h-4 w-4" />
              <AlertTitle>{{ t('subscription.pendingCancellation.title') }}</AlertTitle>
              <AlertDescription>
                <div class="space-y-2">
                  <p>{{ t('subscription.pendingCancellation.description', { date: formatDate(subscription.cancel_at || subscription.current_period_end) }) }}</p>
                  <Button size="sm" variant="outline" @click="handleReactivateSubscription">
                    {{ t('subscription.pendingCancellation.cancelDowngrade') }}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <!-- Billing Period -->
            <div class="pt-2 border-t">
              <p class="text-sm text-muted-foreground">
                {{ t('subscription.billingPeriod') }}:
                {{ formatDate(subscription.current_period_start) }} - {{ formatDate(subscription.current_period_end) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Usage Overview -->
      <UsageChart 
        v-if="subscription"
        :usage="subscription.usage"
        :period-start="subscription.current_period_start"
        :period-end="subscription.current_period_end"
      />

      <!-- Quick Actions -->
      <Card>
        <CardContent class="p-6">
          <h3 class="font-semibold mb-2">{{ t('subscription.invoices.title') }}</h3>
          <p class="text-sm text-muted-foreground mb-4">{{ t('subscription.invoicesDescription') }}</p>
          <Button variant="outline" class="w-full" @click="navigateToInvoices">
            {{ t('subscription.viewInvoices') }}
          </Button>
        </CardContent>
      </Card>

      <!-- Available Plans -->
      <div>
        <h3 class="text-lg font-semibold mb-4">{{ t('subscription.availablePlans') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PlanCard
            v-for="plan in plans"
            :key="plan.id"
            :plan="plan"
            :current="subscription?.plan_name === plan.name"
            :can-downgrade="canChangeToPlan(plan)"
            @select="handlePlanChange(plan)"
          />
        </div>
      </div>

      <!-- Payment Methods -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{{ t('subscription.paymentMethods.title') }}</CardTitle>
              <CardDescription>{{ t('subscription.paymentMethods.description') }}</CardDescription>
            </div>
            <Button size="sm" @click="showAddPaymentMethod = true">
              <Plus class="h-4 w-4 mr-2" />
              {{ t('subscription.paymentMethods.add') }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="paymentMethods.length === 0" class="text-center py-8 text-muted-foreground">
            {{ t('subscription.paymentMethods.empty') }}
          </div>
          <div v-else class="space-y-2">
            <PaymentMethodItem
              v-for="method in paymentMethods"
              :key="method.id"
              :method="method"
              @set-default="handleSetDefault"
              @delete="handleDeletePaymentMethod"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Cancel Subscription -->
      <Card v-if="subscription && subscription.status !== 'CANCELED' && !subscription.cancel_at_period_end">
        <CardHeader>
          <CardTitle>{{ t('subscription.cancel.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.cancel.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" @click="showCancelDialog = true">
            {{ t('subscription.cancel.button') }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Add Payment Method Dialog -->
    <AddPaymentMethodDialog
      v-model:open="showAddPaymentMethod"
      @success="handlePaymentMethodAdded"
    />

    <!-- Change Plan Dialog -->
    <ChangePlanDialog
      v-model:open="showChangePlanDialog"
      :plan="selectedPlan"
      :current-plan="currentSubscriptionPlan"
      @confirm="confirmPlanChange"
    />

    <!-- Cancel Subscription Dialog -->
    <CancelSubscriptionDialog
      v-model:open="showCancelDialog"
      @confirm="handleCancelSubscription"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { Progress } from '~/components/ui/progress'
import { AlertCircle, Plus, Info } from 'lucide-vue-next'
import PlanCard from '~/components/subscriptions/PlanCard.vue'
import PaymentMethodItem from '~/components/subscriptions/PaymentMethodItem.vue'
import AddPaymentMethodDialog from '~/components/subscriptions/AddPaymentMethodDialog.vue'
import ChangePlanDialog from '~/components/subscriptions/ChangePlanDialog.vue'
import CancelSubscriptionDialog from '~/components/subscriptions/CancelSubscriptionDialog.vue'
import UsageChart from '~/components/subscriptions/UsageChart.vue'
import type { Subscription, SubscriptionPlan, PaymentMethod, UsageResponse } from '~/types/subscriptions'

const { t } = useI18n()
const { 
  getSubscription, 
  getPlans, 
  getPaymentMethods,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  pending,
  error,
  clearError
} = useSubscriptions()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const subscription = ref<Subscription | null>(null)
const plans = ref<SubscriptionPlan[]>([])
const usage = ref<any[]>([])
const paymentMethods = ref<PaymentMethod[]>([])
const showAddPaymentMethod = ref(false)
const showChangePlanDialog = ref(false)
const showCancelDialog = ref(false)
const selectedPlan = ref<SubscriptionPlan | null>(null)
const locationUsage = ref({ current: 0, limit: 1 })
const showPaymentMethodError = ref(false)

// Computed
const loading = computed(() => pending.value)
const isInGracePeriod = computed(() => {
  if (!subscription.value?.grace_period_end) return false
  return new Date(subscription.value.grace_period_end) > new Date()
})

const currentSubscriptionPlan = computed(() => {
  if (!subscription.value || !plans.value.length) return undefined
  return plans.value.find(p => p.name === subscription.value?.plan_name)
})

const showLocationLimitWarning = computed(() => {
  if (!locationUsage.value.limit) return false
  return locationUsage.value.current >= locationUsage.value.limit * 0.8
})

// Methods
const loadData = async () => {
  const [sub, planList, methods] = await Promise.all([
    getSubscription(),
    getPlans(),
    getPaymentMethods()
  ])
  
  subscription.value = sub
  plans.value = planList
  
  // Transform usage data from subscription object
  if (sub && sub.usage && typeof sub.usage === 'object') {
    const usageData = sub.usage
    usage.value = [
      {
        feature: 'cars_washed',
        usage: usageData.cars_washed.current,
        limit: usageData.cars_washed.limit || -1,
        percentage: usageData.cars_washed.percentage
      },
      {
        feature: 'active_users',
        usage: usageData.active_users.current,
        limit: usageData.active_users.limit || -1,
        percentage: usageData.active_users.percentage
      },
      {
        feature: 'locations',
        usage: usageData.locations.current,
        limit: usageData.locations.limit || -1,
        percentage: usageData.locations.percentage
      }
    ]
    
    // Set location usage for warning
    locationUsage.value = {
      current: usageData.locations.current,
      limit: usageData.locations.limit || 1
    }
  } else {
    usage.value = []
  }
  
  paymentMethods.value = methods
}

const getPlanName = (tier: string) => {
  const names = {
    FREE: t('subscription.plans.free'),
    STANDARD: t('subscription.plans.standard'),
    ENTERPRISE: t('subscription.plans.enterprise')
  }
  return names[tier as keyof typeof names] || tier
}

const getStatusVariant = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    PAST_DUE: 'destructive',
    CANCELED: 'secondary',
    INCOMPLETE: 'outline',
    // Handle lowercase versions from backend
    active: 'default',
    past_due: 'destructive',
    canceled: 'secondary',
    incomplete: 'outline'
  }
  return variants[status] || 'default'
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(price / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('nl-NL')
}

const canChangeToPlan = (plan: SubscriptionPlan) => {
  if (!subscription.value) return false
  // Can always upgrade, but not downgrade if there are active resources exceeding limits
  return true // This should check actual usage vs plan limits
}

const handlePlanChange = (plan: SubscriptionPlan) => {
  selectedPlan.value = plan
  showChangePlanDialog.value = true
}

const confirmPlanChange = async () => {
  if (!selectedPlan.value) return
  
  // Reset error state
  showPaymentMethodError.value = false
  
  // For downgrades to free plan, always schedule for end of period
  const isDowngradeToFree = selectedPlan.value.name === 'free' && 
                           currentSubscriptionPlan.value && 
                           currentSubscriptionPlan.value.price_cents > 0
  
  const result = await changePlan({ 
    plan_id: selectedPlan.value.id,
    immediate: !isDowngradeToFree  // false for free plan downgrades
  })
  
  if (result) {
    showChangePlanDialog.value = false
    selectedPlan.value = null
    
    // Check the result first before reloading
    if ('requires_action' in result && result.requires_action && result.client_secret) {
      // Handle payment authentication
      alert(t('subscription.payment.authenticationRequired'))
    } else if ('status' in result && result.status === 'incomplete') {
      // Only show payment method dialog if the result indicates incomplete
      showAddPaymentMethod.value = true
      alert(t('subscription.payment.paymentMethodRequired'))
    }
    
    // Always reload data to get the updated subscription
    await loadData()
  } else if (error.value) {
    // Handle specific error for missing payment method
    if (error.value.toLowerCase().includes('payment method')) {
      showChangePlanDialog.value = false
      selectedPlan.value = null
      showPaymentMethodError.value = true
      // Clear the general error since we're showing a specific one
      clearError()
      // Scroll to top to show the error
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

const handleCancelSubscription = async () => {
  const success = await cancelSubscription()
  if (success) {
    await loadData()
    showCancelDialog.value = false
  }
}

const handleReactivateSubscription = async () => {
  const success = await reactivateSubscription()
  if (success) {
    await loadData()
  }
}

const handleSetDefault = async (id: string) => {
  const success = await setDefaultPaymentMethod(id)
  if (success) {
    await getPaymentMethods().then(methods => {
      paymentMethods.value = methods
    })
  }
}

const handleDeletePaymentMethod = async (id: string) => {
  const success = await deletePaymentMethod(id)
  if (success) {
    paymentMethods.value = paymentMethods.value.filter(m => m.id !== id)
  }
}

const handlePaymentMethodAdded = async () => {
  await getPaymentMethods().then(methods => {
    paymentMethods.value = methods
  })
  showAddPaymentMethod.value = false
  showPaymentMethodError.value = false
}

const handleAddPaymentMethodFromError = () => {
  showPaymentMethodError.value = false
  showAddPaymentMethod.value = true
}

const navigateToInvoices = () => {
  navigateTo('/garage-admin/subscription/invoices')
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>