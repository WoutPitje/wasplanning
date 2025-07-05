<template>
  <div class="space-y-6">

    <!-- User Information -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('users.details.userInfo') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.name') }}</dt>
            <dd class="mt-1 text-sm">{{ user.first_name }} {{ user.last_name }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.email') }}</dt>
            <dd class="mt-1 text-sm">{{ user.email }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.role') }}</dt>
            <dd class="mt-1">
              <Badge :variant="getRoleBadgeVariant(user.role)">{{ t(`roles.${user.role}`) }}</Badge>
            </dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.status') }}</dt>
            <dd class="mt-1">
              <Badge :variant="user.is_active ? 'success' : 'destructive'">
                {{ t(`users.status.${user.is_active ? 'active' : 'inactive'}`) }}
              </Badge>
            </dd>
          </div>
          <div v-if="showTenant">
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.tenant') }}</dt>
            <dd class="mt-1 text-sm">{{ user.tenant?.display_name || user.tenant?.name }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.createdAt') }}</dt>
            <dd class="mt-1 text-sm">{{ formatDate(user.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.lastLogin') }}</dt>
            <dd class="mt-1 text-sm">{{ user.last_login ? formatDate(user.last_login) : t('users.status.never') }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-muted-foreground">{{ t('users.details.updatedAt') }}</dt>
            <dd class="mt-1 text-sm">{{ formatDate(user.updated_at) }}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <!-- Password Reset Dialog -->
    <Dialog v-model:open="passwordDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('users.dialog.resetPasswordTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('users.dialog.resetPasswordDescription', { name: user.first_name + ' ' + user.last_name }) }}
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
            <Button type="submit" :disabled="loading">
              {{ t('users.dialog.resetButton') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nl, enUS } from 'date-fns/locale'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import type { UserWithoutPassword } from '~/types/users'
import { UserRole } from '~/types/auth'

interface Props {
  user: UserWithoutPassword
  loading?: boolean
  showTenant?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showTenant: false
})

const emit = defineEmits<{
  edit: []
  toggleStatus: []
  resetPassword: [password: string]
}>()

const { t, locale } = useI18n()

// State
const passwordDialogOpen = ref(false)
const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

// Methods
const formatDate = (dateString: string) => {
  const dateLocale = locale.value === 'nl' ? nl : enUS
  return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: dateLocale })
}

const openPasswordDialog = () => {
  passwordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  passwordDialogOpen.value = true
}

const handlePasswordReset = () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    // Error will be handled by parent
    return
  }
  
  emit('resetPassword', passwordForm.value.newPassword)
  passwordDialogOpen.value = false
}

const toggleStatus = () => {
  emit('toggleStatus')
}

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'brand'
    case UserRole.GARAGE_ADMIN:
      return 'info'
    case UserRole.WASPLANNERS:
      return 'warning'
    case UserRole.WASSERS:
      return 'success'
    case UserRole.HAAL_BRENG_PLANNERS:
      return 'secondary'
    case UserRole.WERKPLAATS:
    default:
      return 'outline'
  }
}
</script>