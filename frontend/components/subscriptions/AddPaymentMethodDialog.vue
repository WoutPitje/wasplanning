<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>{{ t('subscription.paymentMethods.addTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('subscription.paymentMethods.addDescription') }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex-1 overflow-y-auto py-4">
        <Alert v-if="error" variant="destructive" class="mb-4">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        
        <div v-if="!clientSecret" class="text-center py-8">
          <Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">{{ t('common.loading') }}</p>
        </div>
        
        <div v-else id="payment-element" class="min-h-[300px]" />
      </div>
      
      <DialogFooter class="flex-shrink-0">
        <Button variant="outline" @click="dialogOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button :disabled="loading || !stripe" @click="handleSubmit">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin mr-2" />
          {{ t('subscription.paymentMethods.addButton') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const { t } = useI18n()
const { createSetupIntent, addPaymentMethod } = useSubscriptions()

// State
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})
const loading = ref(false)
const error = ref<string | null>(null)
const clientSecret = ref<string | null>(null)
declare global {
  interface Window {
    Stripe: any
  }
}

const stripe = ref<any>(null)
const elements = ref<any>(null)
const paymentElement = ref<any>(null)

// Initialize Stripe
const initializeStripe = async () => {
  if (!dialogOpen.value) return
  
  error.value = null
  
  // Get setup intent
  const setupIntent = await createSetupIntent()
  if (!setupIntent) {
    error.value = t('subscription.paymentMethods.setupError')
    return
  }
  
  clientSecret.value = setupIntent.client_secret
  
  // Initialize Stripe
  const config = useRuntimeConfig()
  if (typeof window !== 'undefined' && window.Stripe) {
    stripe.value = window.Stripe(config.public.stripePublishableKey)
    
    elements.value = stripe.value.elements({
      clientSecret: clientSecret.value,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0f172a',
        }
      }
    })
    
    await nextTick()
    
    const paymentElementDiv = document.getElementById('payment-element')
    if (paymentElementDiv) {
      paymentElement.value = elements.value.create('payment', {
        // Exclude iDEAL from payment methods
        wallets: {
          applePay: 'never',
          googlePay: 'never'
        }
      })
      paymentElement.value.mount('#payment-element')
    }
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!stripe.value || !elements.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // Confirm setup
    const { error: stripeError, setupIntent } = await stripe.value.confirmSetup({
      elements: elements.value,
      redirect: 'if_required'
    })
    
    if (stripeError) {
      error.value = stripeError.message
      return
    }
    
    // Add payment method to backend
    const paymentMethod = await addPaymentMethod({
      payment_method_id: setupIntent.payment_method
    })
    
    if (paymentMethod) {
      emit('success')
      dialogOpen.value = false
    }
  } catch (err: any) {
    error.value = err.message || t('subscription.paymentMethods.addError')
  } finally {
    loading.value = false
  }
}

// Cleanup on close
watch(dialogOpen, (open) => {
  if (open) {
    initializeStripe()
  } else {
    if (paymentElement.value) {
      paymentElement.value.destroy()
    }
    clientSecret.value = null
    error.value = null
  }
})

// Load Stripe script
onMounted(() => {
  if (typeof window !== 'undefined' && !window.Stripe) {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    document.head.appendChild(script)
  }
})
</script>