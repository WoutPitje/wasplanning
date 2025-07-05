<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
          {{ tenant?.display_name || t('admin.tenants.details.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ t('admin.tenants.details.subtitle') }}
        </p>
      </div>
      <div class="mt-4 flex space-x-3 md:ml-4 md:mt-0">
        <Button asChild>
          <NuxtLink :to="`/admin/tenants/${$route.params.id}/edit`">
            {{ t('common.edit') }}
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('admin.tenants.details.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            {{ t('admin.tenants.details.loadError') }}
          </h3>
          <div class="mt-2 text-sm text-destructive/80">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tenant details -->
    <div v-else-if="tenant" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Tenant Info -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <h3 class="text-lg font-medium text-foreground">{{ t('admin.tenants.details.garageInfo') }}</h3>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.displayName') }}</dt>
              <dd class="mt-1 text-sm text-foreground">{{ tenant.display_name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.systemName') }}</dt>
              <dd class="mt-1 text-sm text-foreground">{{ tenant.name }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.status') }}</dt>
              <dd class="mt-1">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    tenant.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ tenant.is_active ? t('common.active') : t('common.inactive') }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.createdAt') }}</dt>
              <dd class="mt-1 text-sm text-foreground">{{ formatDate(tenant.created_at) }}</dd>
            </div>
          </div>
          
          <div v-if="tenant.logo_url">
            <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.logo') }}</dt>
            <dd class="mt-2">
              <img
                :src="tenant.logo_url"
                :alt="`${tenant.display_name} logo`"
                class="h-20 w-20 rounded-lg object-cover"
              />
            </dd>
          </div>
        </CardContent>
      </Card>

      <!-- Statistics -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-medium text-foreground">{{ t('admin.tenants.details.statistics') }}</h3>
        </CardHeader>
        <CardContent>
          <div v-if="stats" class="space-y-4">
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.totalUsers') }}</dt>
              <dd class="mt-1 text-2xl font-semibold text-foreground">{{ stats.total_users }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-muted-foreground">{{ t('admin.tenants.details.activeUsers') }}</dt>
              <dd class="mt-1 text-2xl font-semibold text-foreground">{{ stats.active_users }}</dd>
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            {{ t('admin.tenants.details.statsLoading') }}
          </div>
        </CardContent>
      </Card>

      <!-- Users list -->
      <div class="lg:col-span-3">
        <h3 class="text-lg font-medium text-foreground mb-4">{{ t('admin.tenants.details.users') }}</h3>
        <UsersList
          :users="tenant.users || []"
          :loading="false"
          :error="null"
          :show-tenant-filter="false"
          :show-tenant-column="false"
          @view="viewUser"
        />
      </div>
    </div>

    <!-- Back button at bottom -->
    <div class="mt-6">
      <Button variant="outline" @click="navigateTo('/admin/tenants')">
        {{ t('common.back') }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Breadcrumb } from '~/components/ui/breadcrumb'
import UsersList from '~/components/users/UsersList.vue'
import type { UserWithoutPassword } from '~/types/users'

const { t } = useI18n()
const router = useRouter()

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// Composables
const route = useRoute()
const { getTenant, getTenantStats, pending, error } = useAdmin()

// State
const tenant = ref(null)
const stats = ref(null)

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: t('admin.breadcrumb.admin'), href: '/admin/tenants' },
  { label: t('admin.breadcrumb.garages'), href: '/admin/tenants' },
  { label: tenant.value?.display_name || t('admin.breadcrumb.details') }
])

// Methods
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd MMM yyyy', { locale: nl })
}

const loadTenant = async () => {
  const id = route.params.id as string
  const result = await getTenant(id)
  if (result) {
    tenant.value = result
  }
}

const loadStats = async () => {
  const id = route.params.id as string
  const result = await getTenantStats(id)
  if (result) {
    stats.value = result
  }
}

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadTenant(),
    loadStats()
  ])
})

// Methods
const viewUser = (user: UserWithoutPassword) => {
  router.push(`/admin/users/${user.id}`)
}
</script>