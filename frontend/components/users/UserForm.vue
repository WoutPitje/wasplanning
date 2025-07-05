<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>{{ t('users.form.userInfo') }}</CardTitle>
        <CardDescription>{{ t('users.form.userInfoDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="firstName">{{ t('users.dialog.firstName') }}</Label>
            <Input
              id="firstName"
              v-model="formData.first_name"
              :placeholder="t('users.dialog.firstNamePlaceholder')"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="lastName">{{ t('users.dialog.lastName') }}</Label>
            <Input
              id="lastName"
              v-model="formData.last_name"
              :placeholder="t('users.dialog.lastNamePlaceholder')"
              required
            />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label for="email">{{ t('users.dialog.email') }}</Label>
          <Input
            id="email"
            v-model="formData.email"
            type="email"
            :placeholder="t('users.dialog.emailPlaceholder')"
            :disabled="isEditing"
            required
          />
          <p v-if="isEditing" class="text-sm text-muted-foreground">
            {{ t('users.form.emailCannotBeChanged') }}
          </p>
        </div>
        
        <div v-if="showTenantSelect" class="space-y-2">
          <Label for="tenant">{{ t('users.dialog.tenant') }}</Label>
          <Select v-model="formData.tenant_id" :disabled="isEditing" required>
            <SelectTrigger>
              <SelectValue :placeholder="t('users.dialog.selectTenant')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
                {{ tenant.display_name || tenant.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="isEditing" class="text-sm text-muted-foreground">
            {{ t('users.form.tenantCannotBeChanged') }}
          </p>
        </div>
        
        <div class="space-y-2">
          <Label for="role">{{ t('users.dialog.role') }}</Label>
          <Select v-model="formData.role" required>
            <SelectTrigger>
              <SelectValue :placeholder="t('users.dialog.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in availableRoles" :key="role" :value="role">
                {{ t(`roles.${role}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div v-if="!isEditing" class="space-y-2">
          <Label for="password">{{ t('users.dialog.password') }}</Label>
          <Input
            id="password"
            v-model="formData.password"
            type="password"
            :placeholder="t('users.dialog.passwordPlaceholder')"
          />
          <p class="text-sm text-muted-foreground">{{ t('users.dialog.passwordHelp') }}</p>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            v-model:checked="formData.is_active"
          />
          <Label for="isActive">{{ t('users.dialog.isActive') }}</Label>
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-between">
      <Button type="button" variant="outline" @click="$emit('cancel')">
        {{ t('common.cancel') }}
      </Button>
      <Button type="submit" :disabled="loading">
        <span v-if="loading">{{ t('common.loading') }}</span>
        <span v-else>{{ isEditing ? t('users.dialog.update') : t('users.dialog.submit') }}</span>
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { CreateUserDto, UpdateUserDto, UserWithoutPassword } from '~/types/users'
import type { Tenant } from '~/types/admin'
import { UserRole } from '~/types/auth'

interface Props {
  user?: UserWithoutPassword | null
  tenants?: Tenant[]
  tenantId?: string
  loading?: boolean
  showTenantSelect?: boolean
  availableRoles?: UserRole[]
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  tenants: () => [],
  loading: false,
  showTenantSelect: false,
  availableRoles: () => [
    UserRole.WERKPLAATS,
    UserRole.WASSERS,
    UserRole.HAAL_BRENG_PLANNERS,
    UserRole.WASPLANNERS,
    UserRole.GARAGE_ADMIN
  ]
})

const emit = defineEmits<{
  submit: [data: CreateUserDto | UpdateUserDto]
  cancel: []
}>()

const { t } = useI18n()

// Computed
const isEditing = computed(() => !!props.user)

// Form data
const formData = ref<Partial<CreateUserDto>>({
  first_name: '',
  last_name: '',
  email: '',
  role: UserRole.WERKPLAATS,
  password: '',
  is_active: true,
  tenant_id: props.tenantId || props.tenants[0]?.id || ''
})

// Watch for user prop changes
watch(() => props.user, (user) => {
  if (user) {
    formData.value = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      tenant_id: user.tenant.id
    }
  } else {
    formData.value = {
      first_name: '',
      last_name: '',
      email: '',
      role: UserRole.WERKPLAATS,
      password: '',
      is_active: true,
      tenant_id: props.tenantId || props.tenants[0]?.id || ''
    }
  }
}, { immediate: true })

// Methods
const handleSubmit = () => {
  if (isEditing.value) {
    // Update user - only send fields that can be updated
    const updateData: UpdateUserDto = {
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      role: formData.value.role,
      is_active: formData.value.is_active
    }
    emit('submit', updateData)
  } else {
    // Create user - ensure password is not sent if empty (backend will generate)
    const createData = { ...formData.value }
    if (!createData.password || createData.password.trim() === '') {
      delete createData.password
    }
    emit('submit', createData as CreateUserDto)
  }
}
</script>