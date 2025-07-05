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
              <NuxtLink :to="`/garage-admin/users/${route.params.id}`" class="text-sm text-muted-foreground hover:text-foreground" v-if="user">
                {{ user.first_name }} {{ user.last_name }}
              </NuxtLink>
            </li>
            <li class="flex items-center">
              <span class="mx-2 text-muted-foreground">/</span>
              <span class="text-sm text-foreground">
                {{ t('common.edit') }}
              </span>
            </li>
          </ol>
        </nav>
        <h2 class="mt-2 text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('users.form.editTitle') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('users.form.userInfoDescription') }}
        </p>
      </div>
      <div class="mt-4 flex gap-2 md:ml-4 md:mt-0">
        <Button variant="outline" @click="openPasswordDialog">
          {{ t('users.actions.resetPassword') }}
        </Button>
        <Button
          v-if="user?.is_active"
          variant="destructive"
          @click="toggleStatus"
        >
          {{ t('users.actions.deactivate') }}
        </Button>
        <Button
          v-else-if="user"
          variant="default"
          @click="toggleStatus"
        >
          {{ t('users.actions.activate') }}
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loadingUser" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            {{ t('users.errors.loadFailed') }}
          </h3>
          <div class="mt-2 text-sm text-destructive/80">
            {{ loadError }}
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <UserForm
      v-else-if="user"
      :user="user"
      :tenant-id="authStore.tenant?.id"
      :loading="pending"
      :available-roles="availableRoles"
      @submit="handleSubmit"
      @cancel="router.push(`/garage-admin/users/${route.params.id}`)"
    />

    <!-- Password Reset Dialog -->
    <Dialog v-model:open="passwordDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('users.dialog.resetPasswordTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('users.dialog.resetPasswordDescription', { name: user?.first_name + ' ' + user?.last_name }) }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handlePasswordReset" class="space-y-4">
          <div class="space-y-2">
            <Label for="newPassword">{{ t('users.dialog.newPassword') }}</Label>
            <Input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              :placeholder="t('users.dialog.newPasswordPlaceholder')"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="confirmPassword">{{ t('users.dialog.confirmPassword') }}</Label>
            <Input
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              type="password"
              :placeholder="t('users.dialog.confirmPasswordPlaceholder')"
              required
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" @click="passwordDialogOpen = false">
              {{ t('users.dialog.cancel') }}
            </Button>
            <Button type="submit" :disabled="pending">
              {{ t('users.dialog.resetButton') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import UserForm from '~/components/users/UserForm.vue'
import type { UserWithoutPassword, UpdateUserDto } from '~/types/users'
import { UserRole } from '~/types/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { getUser, updateUser, resetPassword, pending, error } = useUsers()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const user = ref<UserWithoutPassword | null>(null)
const loadingUser = ref(true)
const loadError = ref<string | null>(null)
const passwordDialogOpen = ref(false)
const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// Available roles for garage admin
const availableRoles = [
  UserRole.WERKPLAATS,
  UserRole.WASSERS,
  UserRole.HAAL_BRENG_PLANNERS,
  UserRole.WASPLANNERS,
  UserRole.GARAGE_ADMIN
]

// Methods
const loadUser = async () => {
  loadingUser.value = true
  loadError.value = null
  
  const result = await getUser(route.params.id as string)
  if (result) {
    user.value = result
  } else {
    loadError.value = error.value || 'Failed to load user'
  }
  
  loadingUser.value = false
}

const handleSubmit = async (data: UpdateUserDto) => {
  if (!user.value) return
  
  const result = await updateUser(user.value.id, data)
  if (result) {
    router.push(`/garage-admin/users/${user.value.id}`)
  }
}

const openPasswordDialog = () => {
  passwordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogOpen.value = true
}

const handlePasswordReset = async () => {
  if (!user.value) return
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    // Error handling
    return
  }
  
  const success = await resetPassword(user.value.id, passwordForm.value.newPassword)
  if (success) {
    passwordDialogOpen.value = false
  }
}

const toggleStatus = async () => {
  if (!user.value) return
  
  const updateData: UpdateUserDto = {
    is_active: !user.value.is_active
  }
  
  const result = await updateUser(user.value.id, updateData)
  if (result) {
    user.value = result
  }
}

// Load user on mount
onMounted(() => {
  loadUser()
})
</script>