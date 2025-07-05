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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import UsersList from '~/components/users/UsersList.vue'
import type { UserWithoutPassword } from '~/types/users'
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

// Methods
const loadUsers = async () => {
  const result = await getUsers({ tenant_id: authStore.tenant?.id })
  users.value = result // getUsers returns empty array on error, not null
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