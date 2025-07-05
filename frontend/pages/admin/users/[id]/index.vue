<template>
  <div class="space-y-6">
    <UserDetails
      v-if="user"
      :user="user"
      :loading="pending"
      :error="error"
      @edit="navigateTo(`/admin/users/${user.id}/edit`)"
      @back="navigateTo('/admin/users')"
    />
  </div>
</template>

<script setup lang="ts">
import type { UserWithoutPassword } from '~/types/users'
import UserDetails from '~/components/users/UserDetails.vue'

const route = useRoute()
const { getUser, pending, error } = useAdminUsers()

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// State
const user = ref<UserWithoutPassword | null>(null)

// Methods
const loadUser = async () => {
  const id = route.params.id as string
  const result = await getUser(id)
  if (result) {
    user.value = result
  }
}

// Load user on mount
onMounted(() => {
  loadUser()
})
</script>