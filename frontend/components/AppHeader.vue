<template>
  <div>
    <!-- Impersonation banner -->
    <div v-if="isImpersonating" class="bg-yellow-500 text-black">
      <div class="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium">
              {{ t('admin.users.impersonating_as', { email: authStore.user?.email || '' }) }}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="secondary"
            @click="handleStopImpersonation"
            :disabled="stoppingImpersonation"
          >
            {{ t('admin.users.stop_impersonation') }}
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Main header -->
    <header class="border-b bg-card shadow-sm">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
        <!-- Left side: Logo/Title and Navigation -->
        <div class="flex items-center space-x-6">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
              {{ appTitle }}
            </NuxtLink>
          </div>
          
          <!-- Role-specific navigation -->
          <nav v-if="navigation.length > 0" class="hidden md:flex items-center space-x-4">
            <NuxtLink
              v-for="item in navigation"
              :key="item.href"
              :to="item.href"
              class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
              :class="{ 'text-foreground bg-accent': $route.path === item.href }"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <!-- Right side: User info and logout -->
        <div class="flex items-center space-x-4">
          <!-- Tenant info for non-super admins -->
          <div v-if="authStore.user && !authStore.isSuperAdmin" class="hidden sm:flex items-center text-sm text-muted-foreground">
            <Badge variant="outline" class="mr-3">
              {{ authStore.tenant?.display_name }}
            </Badge>
          </div>
          
          <!-- User info -->
          <div class="flex items-center space-x-3">
            <div class="text-right">
              <div class="text-sm font-medium text-foreground">
                {{ authStore.fullName }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ roleDisplayName }}
              </div>
            </div>
            
            <!-- User menu dropdown (future enhancement) -->
            <Button variant="outline" size="sm" @click="logout" class="ml-3">
              <LogOut class="w-4 h-4 mr-2" />
              {{ t('nav.logout') }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </header>
  </div>
</template>

<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { UserRole } from '~/types/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const { stopImpersonation } = useImpersonation()

// Impersonation state
const isImpersonating = computed(() => authStore.impersonation?.is_impersonating || false)
const stoppingImpersonation = ref(false)

// App title based on user role
const appTitle = computed(() => {
  if (!authStore.user) return t('app.name')
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return t('header.titles.superAdmin')
    case UserRole.GARAGE_ADMIN:
      return t('header.titles.garageAdmin')
    case UserRole.WASPLANNERS:
      return t('header.titles.wasplanner')
    case UserRole.WASSERS:
      return t('header.titles.washer')
    case UserRole.WERKPLAATS:
      return t('header.titles.workshop')
    case UserRole.HAAL_BRENG_PLANNERS:
      return t('header.titles.deliveryPlanner')
    default:
      return t('app.name')
  }
})

// Role display name
const roleDisplayName = computed(() => {
  if (!authStore.user) return ''
  
  const roleKey = authStore.user.role.toLowerCase().replace(/_/g, '_')
  return t(`roles.${roleKey}`)
})

// Navigation items based on role
const navigation = computed(() => {
  if (!authStore.user) return []
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return [
        { label: t('nav.tenants'), href: '/admin/tenants' },
        { label: t('nav.users'), href: '/admin/users' },
        { label: t('nav.settings'), href: '/admin/settings' }
      ]
    case UserRole.GARAGE_ADMIN:
      return [
        { label: t('nav.dashboard'), href: '/garage-admin/dashboard' },
        { label: t('nav.users'), href: '/garage-admin/users' },
        { label: t('nav.settings'), href: '/garage-admin/settings' }
      ]
    case UserRole.WASPLANNERS:
      return [
        { label: t('nav.dashboard'), href: '/wasplanner/dashboard' },
        { label: t('nav.queue'), href: '/wasplanner/queue' },
        { label: t('nav.planning'), href: '/wasplanner/schedule' }
      ]
    case UserRole.WASSERS:
      return [
        { label: t('nav.myTasks'), href: '/washer/queue' },
        { label: t('nav.history'), href: '/washer/history' }
      ]
    case UserRole.WERKPLAATS:
      return [
        { label: t('nav.newRequests'), href: '/workshop/requests' },
        { label: t('nav.myRequests'), href: '/workshop/my-requests' }
      ]
    case UserRole.HAAL_BRENG_PLANNERS:
      return [
        { label: t('nav.planning'), href: '/delivery/schedule' },
        { label: t('nav.routes'), href: '/delivery/routes' }
      ]
    default:
      return []
  }
})

const logout = async () => {
  authStore.clearAuth()
  await router.push('/login')
}

const handleStopImpersonation = async () => {
  stoppingImpersonation.value = true
  try {
    await stopImpersonation()
  } catch (error) {
    // Error is already handled in the composable
    stoppingImpersonation.value = false
  }
}
</script>