<template>
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
              Uitloggen
            </Button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LogOut } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { UserRole } from '~/types/auth'

const authStore = useAuthStore()
const router = useRouter()

// App title based on user role
const appTitle = computed(() => {
  if (!authStore.user) return 'Wasplanning'
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return 'Wasplanning Admin'
    case UserRole.GARAGE_ADMIN:
      return 'Garage Beheer'
    case UserRole.WASPLANNERS:
      return 'Was Planning'
    case UserRole.WASSERS:
      return 'Wasser Dashboard'
    case UserRole.WERKPLAATS:
      return 'Werkplaats'
    case UserRole.HAAL_BRENG_PLANNERS:
      return 'Haal/Breng Planning'
    default:
      return 'Wasplanning'
  }
})

// Role display name in Dutch
const roleDisplayName = computed(() => {
  if (!authStore.user) return ''
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Administrator'
    case UserRole.GARAGE_ADMIN:
      return 'Garage Beheerder'
    case UserRole.WASPLANNERS:
      return 'Was Planner'
    case UserRole.WASSERS:
      return 'Wasser'
    case UserRole.WERKPLAATS:
      return 'Werkplaats Medewerker'
    case UserRole.HAAL_BRENG_PLANNERS:
      return 'Haal/Breng Planner'
    default:
      return authStore.user.role
  }
})

// Navigation items based on role
const navigation = computed(() => {
  if (!authStore.user) return []
  
  switch (authStore.user.role) {
    case UserRole.SUPER_ADMIN:
      return [
        { label: 'Tenants', href: '/admin/tenants' },
        { label: 'Instellingen', href: '/admin/settings' }
      ]
    case UserRole.GARAGE_ADMIN:
      return [
        { label: 'Dashboard', href: '/garage-admin/dashboard' },
        { label: 'Gebruikers', href: '/garage-admin/users' },
        { label: 'Instellingen', href: '/garage-admin/settings' }
      ]
    case UserRole.WASPLANNERS:
      return [
        { label: 'Dashboard', href: '/wasplanner/dashboard' },
        { label: 'Wachtrij', href: '/wasplanner/queue' },
        { label: 'Planning', href: '/wasplanner/schedule' }
      ]
    case UserRole.WASSERS:
      return [
        { label: 'Mijn Taken', href: '/washer/queue' },
        { label: 'Geschiedenis', href: '/washer/history' }
      ]
    case UserRole.WERKPLAATS:
      return [
        { label: 'Nieuwe Verzoeken', href: '/workshop/requests' },
        { label: 'Mijn Verzoeken', href: '/workshop/my-requests' }
      ]
    case UserRole.HAAL_BRENG_PLANNERS:
      return [
        { label: 'Planning', href: '/delivery/schedule' },
        { label: 'Routes', href: '/delivery/routes' }
      ]
    default:
      return []
  }
})

const logout = async () => {
  authStore.clearAuth()
  await router.push('/login')
}
</script>