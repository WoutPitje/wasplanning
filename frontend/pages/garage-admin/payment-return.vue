<template>
  <div class="container mx-auto py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="inline-flex items-center gap-3">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <span class="text-lg">{{ t('garageAdmin.payment.processing') }}</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-6">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ t('garageAdmin.payment.error.title') }}</AlertTitle>
          <AlertDescription>
            {{ error }}
          </AlertDescription>
        </Alert>
        
        <div class="flex gap-4">
          <Button @click="navigateTo('/garage-admin/subscription')" variant="outline">
            <ArrowLeft class="h-4 w-4 mr-2" />
            {{ t('garageAdmin.payment.backToSubscription') }}
          </Button>
          <Button @click="retryPayment" v-if="paymentId">
            {{ t('garageAdmin.payment.retry') }}
          </Button>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="space-y-6">
        <Alert>
          <CheckCircle2 class="h-4 w-4 text-green-600" />
          <AlertTitle>{{ t('garageAdmin.payment.success.title') }}</AlertTitle>
          <AlertDescription>
            {{ successMessage }}
          </AlertDescription>
        </Alert>

        <div class="text-center">
          <p class="text-muted-foreground mb-4">
            {{ t('garageAdmin.payment.success.redirecting') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)
const successMessage = ref('')
const paymentId = computed(() => {
  // Mollie returns the payment ID as 'id' parameter
  return (route.query.paymentId || route.query.id) as string | undefined
})
const action = computed(() => route.query.action as string | undefined)

const processPaymentReturn = async () => {
  console.log('Payment return URL:', window.location.href)
  console.log('Query params:', route.query)
  console.log('Payment ID:', paymentId.value)
  
  let finalPaymentId = paymentId.value
  let finalAction = action.value
  
  // If no payment ID in URL, try to get it from pending payment
  if (!finalPaymentId) {
    try {
      const pendingPayment = await $fetch<any>(`${config.public.apiUrl}/subscriptions/pending-payment`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })
      
      if (pendingPayment && pendingPayment.paymentId) {
        console.log('Found pending payment:', pendingPayment)
        finalPaymentId = pendingPayment.paymentId
        finalAction = pendingPayment.action || action.value
      }
    } catch (err) {
      console.error('Failed to fetch pending payment:', err)
    }
  }
  
  if (!finalPaymentId) {
    error.value = t('garageAdmin.payment.error.missingPaymentId')
    loading.value = false
    return
  }

  try {
    // First, check the payment status with Mollie
    const paymentStatus = await $fetch<any>(`${config.public.apiUrl}/payments/${finalPaymentId}/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    }).catch(() => null)

    // If payment is not paid, show error
    if (paymentStatus && paymentStatus.status !== 'paid') {
      error.value = t('garageAdmin.payment.error.notPaid')
      loading.value = false
      return
    }

    let endpoint = ''
    
    // Determine which endpoint to call based on action
    if (finalAction === 'new') {
      endpoint = `/subscriptions/complete-new/${finalPaymentId}`
    } else if (finalAction === 'change') {
      endpoint = `/subscriptions/complete-change/${finalPaymentId}`
    } else {
      // Try to determine from payment metadata or default to new
      endpoint = `/subscriptions/complete-new/${finalPaymentId}`
    }

    const response = await $fetch(`${config.public.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })

    success.value = true
    
    // Set appropriate success message
    if (finalAction === 'change') {
      successMessage.value = t('garageAdmin.payment.success.planChanged')
    } else {
      successMessage.value = t('garageAdmin.payment.success.subscriptionCreated')
    }

    // Redirect to subscription page after 2 seconds
    setTimeout(() => {
      navigateTo('/garage-admin/subscription')
    }, 2000)
  } catch (err: any) {
    console.error('Payment processing error:', err)
    
    if (err.data?.statusCode === 400 && err.data?.message?.includes('already processed')) {
      // Payment was already processed, redirect to subscription page
      success.value = true
      successMessage.value = t('garageAdmin.payment.success.alreadyProcessed')
      setTimeout(() => {
        navigateTo('/garage-admin/subscription')
      }, 2000)
    } else {
      error.value = err.data?.message || t('garageAdmin.payment.error.processingFailed')
    }
  } finally {
    loading.value = false
  }
}

const retryPayment = () => {
  // Redirect back to subscription page to retry
  navigateTo('/garage-admin/subscription')
}

// Process payment on mount
onMounted(() => {
  // Log the current URL for debugging
  console.log('Payment return URL:', window.location.href)
  console.log('Full query params:', window.location.search)
  console.log('Route query:', route.query)
  console.log('Payment ID from route:', paymentId.value)
  console.log('Action:', action.value)
  
  // Also check if Mollie appended payment info to URL path
  const urlParts = window.location.pathname.split('/')
  console.log('URL path parts:', urlParts)
  
  processPaymentReturn()
})

// Set page metadata
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth'],
  requiresAuth: true,
  allowedRoles: ['GARAGE_ADMIN', 'SUPER_ADMIN']
})
</script>