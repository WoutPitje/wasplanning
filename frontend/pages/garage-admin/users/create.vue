<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('users.form.createTitle') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('users.form.userInfoDescription') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <Button variant="outline" @click="navigateTo('/garage-admin/users')">
          {{ t('common.cancel') }}
        </Button>
      </div>
    </div>

    <!-- Form -->
    <UserForm
      :tenant-id="authStore.tenant?.id"
      :loading="pending"
      :available-roles="availableRoles"
      @submit="handleSubmit"
      @cancel="router.push('/garage-admin/users')"
    />

    <!-- Temporary Password Dialog -->
    <TemporaryPasswordDialog
      v-model:open="tempPasswordDialogOpen"
      :password="temporaryPassword"
      @update:open="handlePasswordDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import UserForm from '~/components/users/UserForm.vue'
import TemporaryPasswordDialog from '~/components/users/TemporaryPasswordDialog.vue'
import type { CreateUserDto } from '~/types/users'
import { UserRole } from '~/types/auth'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { createUser, pending } = useUsers()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const tempPasswordDialogOpen = ref(false)
const temporaryPassword = ref('')

// Available roles for garage admin
const availableRoles = [
  UserRole.WERKPLAATS,
  UserRole.WASSERS,
  UserRole.HAAL_BRENG_PLANNERS,
  UserRole.WASPLANNERS,
  UserRole.GARAGE_ADMIN
]

// Methods
const handleSubmit = async (data: CreateUserDto) => {
  const result = await createUser(data)
  if (result) {
    if (result.temporary_password) {
      temporaryPassword.value = result.temporary_password
      tempPasswordDialogOpen.value = true
    } else {
      router.push('/garage-admin/users')
    }
  }
}

const handlePasswordDialogClose = (value: boolean) => {
  tempPasswordDialogOpen.value = value
  if (!value) {
    router.push('/garage-admin/users')
  }
}
</script>