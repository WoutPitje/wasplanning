<template>
  <div>
    <!-- Mobile overlay -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />
    
    <!-- Sidebar -->
    <div 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-0 lg:h-full'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo/Title -->
        <div class="flex items-center justify-between p-4 border-b">
          <NuxtLink to="/" class="flex items-center gap-3">
            <!-- Tenant Logo (when available) or Default Logo -->
            <img 
              v-if="tenantLogoUrl"
              :src="tenantLogoUrl" 
              :alt="authStore.tenant?.display_name || 'Logo'"
              class="h-8 w-auto max-w-[40px] object-contain"
              @error="handleLogoError"
            />
            <img 
              v-else-if="!authStore.tenant?.logo_url || logoError"
              src="/wasplanning-logo.png" 
              alt="Wasplanning Logo" 
              class="h-8 w-auto"
            />
            
            <span class="text-xl font-bold text-primary hover:text-primary/80 transition-colors">
              {{ appTitle }}
            </span>
          </NuxtLink>
          <Button
            variant="ghost"
            size="icon"
            class="lg:hidden"
            @click="sidebarOpen = false"
          >
            <X class="w-5 h-5" />
          </Button>
        </div>
        
        <!-- Tenant info for non-super admins -->
        <div v-if="authStore.user && !authStore.isSuperAdmin" class="px-4 py-3 border-b">
          <Badge variant="outline" class="w-full justify-center">
            {{ authStore.tenant?.display_name }}
          </Badge>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto p-4">
          <ul class="space-y-1">
            <li v-for="item in navigation" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                :class="[
                  $route.path === item.href 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                ]"
                @click="sidebarOpen = false"
              >
                <component :is="item.icon" v-if="item.icon" class="w-5 h-5" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        
        <!-- User info and logout -->
        <div class="p-4 border-t">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-foreground truncate">
                {{ authStore.fullName }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ roleDisplayName }}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            @click="logout" 
            class="w-full justify-start"
          >
            <LogOut class="w-4 h-4 mr-2" />
            {{ t('nav.logout') }}
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Mobile menu button -->
    <Button
      variant="ghost"
      size="icon"
      class="fixed top-4 left-4 z-40 lg:hidden"
      @click="sidebarOpen = true"
    >
      <Menu class="w-5 h-5" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Menu, X, LogOut, Home, Users, Settings, Building2, Calendar, Package, Truck, Wrench } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { UserRole } from '~/types/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const config = useRuntimeConfig()

// Sidebar state
const sidebarOpen = ref(false)

// Tenant logo state
const tenantLogoUrl = ref<string | null>(null)
const logoError = ref(false)

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

// Navigation items based on role with icons
const navigation = computed(() => {
  if (!authStore.user) return []
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return [
        { label: t('nav.garages'), href: '/admin/tenants', icon: Building2 },
        { label: t('nav.users'), href: '/admin/users', icon: Users },
        { label: t('nav.settings'), href: '/admin/settings', icon: Settings }
      ]
    case UserRole.GARAGE_ADMIN:
      return [
        { label: t('nav.dashboard'), href: '/garage-admin/dashboard', icon: Home },
        { label: t('nav.users'), href: '/garage-admin/users', icon: Users },
        { label: t('nav.settings'), href: '/garage-admin/settings', icon: Settings }
      ]
    case UserRole.WASPLANNERS:
      return [
        { label: t('nav.dashboard'), href: '/wasplanner/dashboard', icon: Home },
        { label: t('nav.queue'), href: '/wasplanner/queue', icon: Package },
        { label: t('nav.planning'), href: '/wasplanner/schedule', icon: Calendar }
      ]
    case UserRole.WASSERS:
      return [
        { label: t('nav.myTasks'), href: '/washer/queue', icon: Package },
        { label: t('nav.history'), href: '/washer/history', icon: Calendar }
      ]
    case UserRole.WERKPLAATS:
      return [
        { label: t('nav.newRequests'), href: '/workshop/requests', icon: Wrench },
        { label: t('nav.myRequests'), href: '/workshop/my-requests', icon: Package }
      ]
    case UserRole.HAAL_BRENG_PLANNERS:
      return [
        { label: t('nav.planning'), href: '/delivery/schedule', icon: Calendar },
        { label: t('nav.routes'), href: '/delivery/routes', icon: Truck }
      ]
    default:
      return []
  }
})

const logout = async () => {
  authStore.clearAuth()
  await router.push('/login')
}

// Fetch tenant logo URL
const fetchTenantLogo = async () => {
  if (!authStore.tenant?.logo_url || logoError.value) {
    tenantLogoUrl.value = null
    return
  }

  const logoUrl = authStore.tenant.logo_url

  // If it's a regular HTTP URL, use it directly
  if (logoUrl.startsWith('http')) {
    tenantLogoUrl.value = logoUrl
    return
  }

  // For MinIO URLs, get the presigned URL from the auth endpoint
  if (logoUrl.startsWith('minio:') && authStore.tenant?.id) {
    try {
      const response = await $fetch(`${config.public.apiUrl}/auth/tenant/logo`, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })
      tenantLogoUrl.value = response.logo_url
    } catch (error) {
      tenantLogoUrl.value = null
      logoError.value = true
    }
    return
  }

  tenantLogoUrl.value = logoUrl
}

// Handle logo loading errors
const handleLogoError = () => {
  tenantLogoUrl.value = null
  logoError.value = true
}

// Watch for tenant changes and fetch logo
watch(() => authStore.tenant?.logo_url, () => {
  logoError.value = false
  fetchTenantLogo()
}, { immediate: true })

// Close sidebar on route change (mobile)
const route = useRoute()
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>