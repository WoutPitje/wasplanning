<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div v-if="showTenantFilter" class="w-full sm:w-64">
        <Label for="tenantFilter" class="sr-only">{{ t('users.filters.tenant') }}</Label>
        <Select v-model="selectedTenantId">
          <SelectTrigger>
            <SelectValue :placeholder="t('users.filters.allTenants')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('users.filters.allTenants') }}</SelectItem>
            <SelectItem v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
              {{ tenant.display_name || tenant.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="w-full sm:w-48">
        <Label for="roleFilter" class="sr-only">{{ t('users.filters.role') }}</Label>
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
        <Label for="search" class="sr-only">{{ t('users.search') }}</Label>
        <Input
          v-model="searchQuery"
          :placeholder="t('users.search')"
          class="w-full"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
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

    <!-- Users table -->
    <Card v-else>
      <CardContent class="p-0">
        <div v-if="users.length > 0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('users.table.name') }}</TableHead>
                <TableHead>{{ t('users.table.email') }}</TableHead>
                <TableHead v-if="showTenantColumn">{{ t('users.table.tenant') }}</TableHead>
                <TableHead>{{ t('users.table.role') }}</TableHead>
                <TableHead>{{ t('users.table.status') }}</TableHead>
                <TableHead>{{ t('users.table.lastLogin') }}</TableHead>
                <TableHead class="text-right">{{ t('users.table.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in users" :key="user.id">
                <TableCell class="font-medium">
                  {{ user.first_name }} {{ user.last_name }}
                </TableCell>
                <TableCell>{{ user.email }}</TableCell>
                <TableCell v-if="showTenantColumn">
                  <Badge variant="outline">
                    {{ user.tenant?.display_name || user.tenant?.name }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="getRoleBadgeVariant(user.role)">
                    {{ t(`roles.${user.role.toLowerCase()}`) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.is_active ? 'success' : 'destructive'">
                    {{ t(`users.status.${user.is_active ? 'active' : 'inactive'}`) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ user.last_login ? formatDate(user.last_login) : t('users.status.never') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                
                    <Button
                      variant="default"
                      size="sm"
                      @click="() => $emit('view', user)"
                    >
                      {{ t('users.actions.viewDetails') }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div v-else class="text-center py-12">
          <p class="text-sm text-muted-foreground">{{ t('users.noUsers') }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('users.noUsersDescription') }}</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nl, enUS } from 'date-fns/locale'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { UserWithoutPassword } from '~/types/users'
import type { Tenant } from '~/types/admin'
import { UserRole } from '~/types/auth'

interface Props {
  users: UserWithoutPassword[]
  tenants?: Tenant[]
  loading?: boolean
  error?: string | null
  showTenantFilter?: boolean
  showTenantColumn?: boolean
  availableRoles?: UserRole[]
}

const props = withDefaults(defineProps<Props>(), {
  tenants: () => [],
  loading: false,
  error: null,
  showTenantFilter: false,
  showTenantColumn: false,
  availableRoles: () => [
    'werkplaats',
    'wassers',
    'haal_breng_planners',
    'wasplanners',
    'garage_admin',
    'super_admin'
  ]
})

defineEmits<{
  view: [user: UserWithoutPassword]
  edit: [user: UserWithoutPassword]
}>()

const { t, locale } = useI18n()

// Query parameter sync
const { filters, updateFilter } = useQueryFilters({
  search: '',
  tenant: 'all',
  role: 'all'
})

// Use filters from query params
const searchQuery = computed({
  get: () => filters.search,
  set: (value) => updateFilter('search', value)
})

const selectedTenantId = computed({
  get: () => filters.tenant,
  set: (value) => updateFilter('tenant', value)
})

const selectedRole = computed({
  get: () => filters.role,
  set: (value) => updateFilter('role', value)
})

// Emit filter changes to parent
watch([searchQuery, selectedTenantId, selectedRole], () => {
  // Parent component should handle filtering through API
})

// Methods
const formatDate = (dateString: string) => {
  const dateLocale = locale.value === 'nl' ? nl : enUS
  return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: dateLocale })
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