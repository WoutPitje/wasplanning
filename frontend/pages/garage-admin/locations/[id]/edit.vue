<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('locations.form.editTitle') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('locations.form.editDescription') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <Button variant="outline" @click="navigateTo(`/garage-admin/locations/${locationId}`)">
          {{ t('common.cancel') }}
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Error Alert -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Form -->
    <LocationForm
      v-else-if="location"
      :location="location"
      :loading="pending"
      @submit="handleSubmit"
      @cancel="router.push(`/garage-admin/locations/${locationId}`)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import LocationForm from '~/components/locations/LocationForm.vue'
import type { UpdateLocationDto, LocationResponseDto } from '~/types/locations'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { getLocation, updateLocation, pending, error } = useLocations()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// Route params
const locationId = computed(() => route.params.id as string)

// State
const location = ref<LocationResponseDto | null>(null)
const loading = ref(true)

// Methods
const loadLocation = async () => {
  loading.value = true
  try {
    location.value = await getLocation(locationId.value)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (data: UpdateLocationDto) => {
  const result = await updateLocation(locationId.value, data)
  if (result) {
    router.push(`/garage-admin/locations/${locationId.value}`)
  }
}

// Load location on mount
onMounted(() => {
  loadLocation()
})
</script>