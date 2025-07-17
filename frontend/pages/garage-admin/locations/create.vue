<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('locations.form.createTitle') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('locations.form.createDescription') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <Button variant="outline" @click="navigateTo('/garage-admin/locations')">
          {{ t('common.cancel') }}
        </Button>
      </div>
    </div>

    <!-- Error Alert -->
    <Alert v-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Limit Reached Alert -->
    <Alert v-if="limitReached" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('locations.limitReached') }}</AlertTitle>
      <AlertDescription>
        {{ t('locations.limitReachedDescription') }}
        <NuxtLink to="/garage-admin/subscription" class="underline ml-1">
          {{ t('locations.upgradeSubscription') }}
        </NuxtLink>
      </AlertDescription>
    </Alert>

    <!-- Form -->
    <LocationForm
      v-if="!limitReached"
      :loading="pending"
      @submit="handleSubmit"
      @cancel="router.push('/garage-admin/locations')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import LocationForm from '~/components/locations/LocationForm.vue'
import type { CreateLocationDto } from '~/types/locations'

const { t } = useI18n()
const router = useRouter()
const { createLocation, getLocations, pending, error } = useLocations()
const { getCurrentSubscription } = useSubscriptions()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const limitReached = ref(false)

// Check subscription limits
const checkLocationLimit = async () => {
  try {
    // Get current locations count
    const locations = await getLocations({ active: true })
    
    // Get subscription info
    const subscription = await getCurrentSubscription()
    const limit = subscription?.usage?.locations?.limit || 1
    
    limitReached.value = locations.length >= limit
  } catch (err) {
    console.error('Failed to check location limit:', err)
    // Assume free tier limit
    const locations = await getLocations({ active: true })
    limitReached.value = locations.length >= 1
  }
}

// Methods
const handleSubmit = async (data: CreateLocationDto) => {
  try {
    const result = await createLocation(data)
    if (result) {
      router.push('/garage-admin/locations')
    }
  } catch (err) {
    // Error is handled by the composable
    console.error('Failed to create location:', err)
  }
}

// Check limits on mount
onMounted(() => {
  checkLocationLimit()
})
</script>