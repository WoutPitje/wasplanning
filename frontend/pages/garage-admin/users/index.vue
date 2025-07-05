<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('users.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('garageAdmin.users.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <NuxtLink :to="`/garage-admin/users/create`">
          <Button>
            {{ t('users.addNew') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="w-full sm:w-48">
        <Label for="roleFilter">{{ t('users.filters.role') }}</Label>
        <Select v-model="selectedRole">
          <SelectTrigger>
            <SelectValue :placeholder="t('users.filters.allRoles')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('users.filters.allRoles') }}</SelectItem>
            <SelectItem v-for="role in availableRoles" :key="role" :value="role">
              {{ t(`roles.${role}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex-1">
        <Label for="search">{{ t('users.search') }}</Label>
        <Input
          v-model="searchQuery"
          :placeholder="t('users.search')"
          class="w-full"
        />
      </div>
    </div>

    <!-- Users List -->
    <UsersList
      :users="users"
      :loading="pending"
      :error="error"
      :available-roles="availableRoles"
      @view="viewUser"
      @edit="editUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import UsersList from '~/components/users/UsersList.vue'
import type { UserWithoutPassword, UserFilters } from '~/types/users'
import { UserRole } from '~/types/auth'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { getUsers, pending, error } = useUsers()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const users = ref<UserWithoutPassword[]>([])

// Available roles for garage admin
const availableRoles = [
  UserRole.WERKPLAATS,
  UserRole.WASSERS,
  UserRole.HAAL_BRENG_PLANNERS,
  UserRole.WASPLANNERS,
  UserRole.GARAGE_ADMIN
]

// Query parameter sync
const { filters, updateFilter } = useQueryFilters({
  search: '',
  role: 'all'
})

// Use filters from query params
const searchQuery = computed({
  get: () => filters.search,
  set: (value) => updateFilter('search', value)
})

const selectedRole = computed({
  get: () => filters.role,
  set: (value) => updateFilter('role', value)
})

// Watch for filter changes and reload data
watch([searchQuery, selectedRole], () => {
  loadUsers()
}, { immediate: false })

// Methods
const loadUsers = async () => {
  // Build filters object - always filter by tenant for garage admin
  const userFilters: UserFilters = {
    tenant: authStore.tenant?.id,
    ...(searchQuery.value && { search: searchQuery.value }),
    ...(selectedRole.value !== 'all' && { role: selectedRole.value }),
    page: 1,
    limit: 20
  }
  
  const result = await getUsers(userFilters)
  users.value = result.data // Extract data array from paginated response
}

const viewUser = async (user: UserWithoutPassword) => {
  console.log('viewUser called with:', user)
  await navigateTo(`/garage-admin/users/${user.id}`)
}

const editUser = async (user: UserWithoutPassword) => {
  console.log('editUser called with:', user)
  await navigateTo(`/garage-admin/users/${user.id}/edit`)
}

// Load users on mount
onMounted(() => {
  loadUsers()
})
</script>