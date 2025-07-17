<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('locations.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('locations.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <NuxtLink :to="`/garage-admin/locations/create`">
          <Button>
            {{ t('locations.addNew') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Subscription Limit Warning -->
    <Alert v-if="showLimitWarning" variant="default">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('locations.limitWarning') }}</AlertTitle>
      <AlertDescription>
        {{ t('locations.limitWarningDescription', { 
          current: locations.length, 
          limit: subscriptionLimit 
        }) }}
      </AlertDescription>
    </Alert>

    <!-- Search -->
    <div class="flex-1 max-w-sm">
      <Label for="search" class="sr-only">{{ t('locations.search') }}</Label>
      <Input
        v-model="searchQuery"
        :placeholder="t('locations.searchPlaceholder')"
        class="w-full"
      />
    </div>

    <!-- Locations Table -->
    <LocationsList
      :locations="filteredLocations"
      :loading="pending"
      :error="error"
      @view="viewLocation"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import LocationsList from '~/components/locations/LocationsList.vue'
import type { LocationResponseDto } from '~/types/locations'

const { t } = useI18n()
const router = useRouter()
const { getLocations, pending, error } = useLocations()
const { getCurrentSubscription } = useSubscriptions()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const locations = ref<LocationResponseDto[]>([])
const searchQuery = ref('')
const subscriptionLimit = ref<number | null>(null)

// Computed
const filteredLocations = computed(() => {
  const query = searchQuery.value.toLowerCase()
  if (!query) return locations.value

  return locations.value.filter(location => {
    return location.name.toLowerCase().includes(query) ||
           (location.address && location.address.toLowerCase().includes(query))
  })
})

const showLimitWarning = computed(() => {
  if (!subscriptionLimit.value) return false
  return locations.value.length >= subscriptionLimit.value * 0.8
})

// Methods
const loadLocations = async () => {
  try {
    locations.value = await getLocations({ active: true })
  } catch (err) {
    console.error('Failed to load locations:', err)
  }
}

const loadSubscriptionInfo = async () => {
  try {
    const subscription = await getCurrentSubscription()
    subscriptionLimit.value = subscription?.usage?.locations?.limit || 1
  } catch (err) {
    // Default to free tier limit
    subscriptionLimit.value = 1
  }
}

const viewLocation = async (location: LocationResponseDto) => {
  await navigateTo(`/garage-admin/locations/${location.id}`)
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadLocations(),
    loadSubscriptionInfo()
  ])
})
</script>