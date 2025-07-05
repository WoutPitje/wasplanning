<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ t('admin.tenants.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('admin.tenants.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex md:ml-4 md:mt-0">
        <Button asChild>
          <NuxtLink to="/admin/tenants/create">
            {{ t('admin.tenants.addNew') }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-500">{{ t('admin.tenants.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ t('admin.tenants.errorLoading') }}
          </h3>
          <div class="mt-2 text-sm text-red-700">
            {{ error }}
          </div>
          <div class="mt-4">
            <button
              @click="loadTenants"
              class="text-sm font-medium text-red-800 underline hover:text-red-600"
            >
              {{ t('retry') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tenants table -->
    <Card v-if="tenants?.length">
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('admin.tenants.table.name') }}</TableHead>
              <TableHead>{{ t('admin.tenants.table.systemName') }}</TableHead>
              <TableHead>{{ t('admin.tenants.table.status') }}</TableHead>
              <TableHead>{{ t('admin.tenants.table.users') }}</TableHead>
              <TableHead>{{ t('admin.tenants.table.createdAt') }}</TableHead>
              <TableHead class="text-right">{{ t('admin.tenants.table.actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="tenant in tenants" :key="tenant.id">
              <TableCell class="font-medium">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <img
                      v-if="tenant.logo_url"
                      :src="tenant.logo_url"
                      :alt="`${tenant.display_name} logo`"
                      class="h-8 w-8 rounded-full bg-gray-300"
                    />
                    <div
                      v-else
                      class="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                    >
                      <span class="text-xs font-medium text-muted-foreground">
                        {{ tenant.display_name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <span class="ml-2">{{ tenant.display_name }}</span>
                </div>
              </TableCell>
              <TableCell>{{ tenant.name }}</TableCell>
              <TableCell>
                <Badge :variant="tenant.is_active ? 'success' : 'destructive'">
                  {{ tenant.is_active ? t('common.active') : t('common.inactive') }}
                </Badge>
              </TableCell>
              <TableCell>{{ tenant.user_count || 0 }}</TableCell>
              <TableCell>{{ formatDate(tenant.created_at) }}</TableCell>
              <TableCell class="text-right">
                <Button variant="default" size="sm" asChild>
                  <NuxtLink :to="`/admin/tenants/${tenant.id}`">
                    {{ t('users.actions.viewDetails') }}
                  </NuxtLink>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-gray-900">{{ t('admin.tenants.noTenants') }}</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ t('admin.tenants.noTenantsDescription') }}
      </p>
      <div class="mt-6">
        <Button asChild>
          <NuxtLink to="/admin/tenants/create">
            {{ t('admin.tenants.addNew') }}
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Tenant } from '~/types/auth'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Breadcrumb } from '~/components/ui/breadcrumb'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// Composables
const { getTenants, pending, error } = useAdmin()
const { t } = useI18n()

// State
const tenants = ref<Tenant[] | null>(null)

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: 'Admin', href: '/admin/tenants' },
  { label: t('nav.garages') }
])

// Methods
const loadTenants = async () => {
  const result = await getTenants()
  if (result) {
    tenants.value = result
  }
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: nl })
}

// Load tenants on mount
onMounted(async () => {
  // Ensure auth is initialized
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }
  
  // Only load tenants if user is authenticated and is super admin
  if (authStore.isAuthenticated && authStore.isSuperAdmin) {
    await loadTenants()
  }
})
</script>