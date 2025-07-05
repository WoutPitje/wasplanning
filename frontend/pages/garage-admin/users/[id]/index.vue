<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <nav class="flex" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2">
            <li>
              <NuxtLink to="/garage-admin/users" class="text-sm text-muted-foreground hover:text-foreground">
                {{ t('users.title') }}
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <span class="mx-2 text-muted-foreground">/</span>
              <span class="text-sm text-foreground" v-if="user">
                {{ user.first_name }} {{ user.last_name }}
              </span>
            </li>
          </ol>
        </nav>
        <h2 class="mt-2 text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('users.details.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('users.details.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex gap-2 md:ml-4 md:mt-0">
        <NuxtLink :to="`/garage-admin/users/${route.params.id}/edit`">
          <Button>
            {{ t('common.edit') }}
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            {{ t('users.errors.loadFailed') }}
          </h3>
          <div class="mt-2 text-sm text-destructive/80">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- User Details -->
    <UserDetails
      v-else-if="user"
      :user="user"
      :loading="actionPending"
      @edit="router.push(`/garage-admin/users/${route.params.id}/edit`)"
      @toggle-status="handleToggleStatus"
      @reset-password="handleResetPassword"
    />

    <!-- Back button at bottom -->
    <div class="mt-6">
      <Button variant="outline" @click="navigateTo('/garage-admin/users')">
        {{ t('common.back') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import UserDetails from '~/components/users/UserDetails.vue'
import type { UserWithoutPassword, UpdateUserDto } from '~/types/users'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { getUser, updateUser, resetPassword, pending, error } = useUsers()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const user = ref<UserWithoutPassword | null>(null)
const actionPending = ref(false)

// Methods
const loadUser = async () => {
  const result = await getUser(route.params.id as string)
  if (result) {
    user.value = result
  }
}

const handleToggleStatus = async () => {
  if (!user.value) return
  
  actionPending.value = true
  const updateData: UpdateUserDto = {
    is_active: !user.value.is_active
  }
  
  const result = await updateUser(user.value.id, updateData)
  if (result) {
    user.value = result
  }
  actionPending.value = false
}

const handleResetPassword = async (password: string) => {
  if (!user.value) return
  
  actionPending.value = true
  await resetPassword(user.value.id, password)
  actionPending.value = false
}

// Load user on mount
onMounted(() => {
  loadUser()
})
</script>