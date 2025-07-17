<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ location?.name || t('locations.details.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('locations.details.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex gap-2 md:ml-4 md:mt-0">
        <Button variant="outline" @click="navigateTo('/garage-admin/locations')">
          {{ t('common.back') }}
        </Button>
        <Button @click="navigateTo(`/garage-admin/locations/${locationId}/edit`)">
          {{ t('common.edit') }}
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Location Details -->
    <template v-else-if="location">
      <LocationCard
        :location="location"
        :users="locationUsers"
        :show-users="true"
        :show-manage-users="true"
        @manage-users="showUsersDialog = true"
      />

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <Button
          v-if="location.is_active"
          variant="destructive"
          @click="handleDelete"
          :disabled="deleting"
        >
          {{ t('locations.actions.deactivate') }}
        </Button>
      </div>
    </template>

    <!-- User Assignment Dialog -->
    <LocationUsersDialog
      :open="showUsersDialog"
      :location="location"
      :available-users="availableUsers"
      :assigned-user-ids="assignedUserIds"
      :saving="assigningUsers"
      @update:open="showUsersDialog = $event"
      @save="handleAssignUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import LocationCard from '~/components/locations/LocationCard.vue'
import LocationUsersDialog from '~/components/locations/LocationUsersDialog.vue'
import type { LocationResponseDto } from '~/types/locations'
import type { UserWithoutPassword } from '~/types/users'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { 
  getLocation, 
  getLocationUsers, 
  deleteLocation, 
  assignUsersToLocation,
  pending, 
  error 
} = useLocations()
const { getUsers } = useUsers()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// Route params
const locationId = computed(() => route.params.id as string)

// State
const location = ref<LocationResponseDto | null>(null)
const locationUsers = ref<any[]>([])
const availableUsers = ref<UserWithoutPassword[]>([])
const showUsersDialog = ref(false)
const deleting = ref(false)
const assigningUsers = ref(false)

// Computed
const assignedUserIds = computed(() => 
  locationUsers.value.map(lu => lu.user?.id || lu.id).filter(Boolean)
)

// Methods
const loadLocation = async () => {
  location.value = await getLocation(locationId.value)
}

const loadLocationUsers = async () => {
  try {
    const users = await getLocationUsers(locationId.value)
    locationUsers.value = users
  } catch (err) {
    console.error('Failed to load location users:', err)
  }
}

const loadAvailableUsers = async () => {
  try {
    const result = await getUsers({ limit: 100 })
    availableUsers.value = result.data
  } catch (err) {
    console.error('Failed to load available users:', err)
  }
}

const handleDelete = async () => {
  if (!confirm(t('locations.confirmDelete'))) return
  
  deleting.value = true
  try {
    const success = await deleteLocation(locationId.value)
    if (success) {
      router.push('/garage-admin/locations')
    }
  } finally {
    deleting.value = false
  }
}

const handleAssignUsers = async (userIds: string[]) => {
  assigningUsers.value = true
  try {
    const success = await assignUsersToLocation(locationId.value, userIds)
    if (success) {
      showUsersDialog.value = false
      await loadLocationUsers()
    }
  } finally {
    assigningUsers.value = false
  }
}

// Load data on mount
onMounted(async () => {
  await loadLocation()
  if (location.value) {
    await Promise.all([
      loadLocationUsers(),
      loadAvailableUsers()
    ])
  }
})
</script>