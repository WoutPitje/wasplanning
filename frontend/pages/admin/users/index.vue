<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('users.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('users.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <Label for="tenantFilter">{{ t('users.filters.tenant') }}</Label>
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
      <div>
        <Label for="roleFilter">{{ t('users.filters.role') }}</Label>
        <Select v-model="selectedRole">
          <SelectTrigger>
            <SelectValue :placeholder="t('users.filters.allRoles')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('users.filters.allRoles') }}</SelectItem>
            <SelectItem value="werkplaats">{{ t('roles.werkplaats') }}</SelectItem>
            <SelectItem value="wassers">{{ t('roles.wassers') }}</SelectItem>
            <SelectItem value="haal_breng_planners">{{ t('roles.haal_breng_planners') }}</SelectItem>
            <SelectItem value="wasplanners">{{ t('roles.wasplanners') }}</SelectItem>
            <SelectItem value="garage_admin">{{ t('roles.garage_admin') }}</SelectItem>
            <SelectItem value="super_admin">{{ t('roles.super_admin') }}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label for="search">{{ t('users.search') }}</Label>
        <Input
          v-model="searchQuery"
          :placeholder="t('users.search')"
          class="w-full"
        />
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
          <div class="mt-4">
            <Button variant="outline" size="sm" @click="loadData">
              {{ t('common.retry') }}
            </Button>
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
                <TableHead>{{ t('users.table.tenant') }}</TableHead>
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
                <TableCell>
                  <Badge variant="outline">
                    {{ user.tenant?.display_name || user.tenant?.name }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {{ t(`roles.${user.role}`) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :variant="user.is_active ? 'default' : 'destructive'">
                    {{ t(`users.status.${user.is_active ? 'active' : 'inactive'}`) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ user.last_login ? formatDate(user.last_login) : t('users.status.never') }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <NuxtLink :to="`/admin/users/${user.id}`">
                        {{ t('common.view') }}
                      </NuxtLink>
                    </Button>
                    <Button 
                      v-if="user.role !== 'super_admin' && user.is_active"
                      variant="outline" 
                      size="sm"
                      @click="handleImpersonate(user.id)"
                      :disabled="impersonating"
                    >
                      {{ t('users.actions.impersonate') }}
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
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { UserWithoutPassword, UserFilters } from '~/types/users'
import type { Tenant } from '~/types/admin'
import { UserRole } from '~/types/auth'
import { format } from 'date-fns'
import { nl, enUS } from 'date-fns/locale'

const { t, locale } = useI18n()
const { getUsers, pending, error } = useAdminUsers()
const { getTenants } = useAdmin()
const { startImpersonation } = useImpersonation()

definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// State
const users = ref<UserWithoutPassword[]>([])
const tenants = ref<Tenant[]>([])
const impersonating = ref(false)

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

// Watch for filter changes and reload data
watch([searchQuery, selectedTenantId, selectedRole], () => {
  loadData()
}, { immediate: false })

// Methods
const formatDate = (dateString: string) => {
  const dateLocale = locale.value === 'nl' ? nl : enUS
  return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: dateLocale })
}

const loadData = async () => {
  // Build filters object
  const userFilters: UserFilters = {
    ...(searchQuery.value && { search: searchQuery.value }),
    ...(selectedRole.value !== 'all' && { role: selectedRole.value }),
    ...(selectedTenantId.value !== 'all' && { tenant: selectedTenantId.value }),
    page: 1,
    limit: 20
  }
  
  // Load filtered users
  const usersResult = await getUsers(userFilters)
  if (usersResult) {
    users.value = usersResult.data
  }
  
  // Load all tenants (only need to do this once)
  if (!tenants.value || tenants.value.length === 0) {
    const tenantsResult = await getTenants()
    if (tenantsResult) {
      tenants.value = tenantsResult
    }
  }
}

const handleImpersonate = async (userId: string) => {
  impersonating.value = true
  try {
    await startImpersonation(userId)
  } catch (error) {
    // Error is already handled in the composable
    impersonating.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadData()
})
</script>