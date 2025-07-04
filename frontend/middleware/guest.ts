import { UserRole } from "~/types/auth"

export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Initialize auth from localStorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }
  
  // If authenticated, redirect to appropriate dashboard
  if (authStore.isAuthenticated && authStore.user) {
    const role = authStore.user.role
    
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return navigateTo('/admin/tenants')
      case UserRole.GARAGE_ADMIN:
        return navigateTo('/garage-admin/dashboard')
      case UserRole.WASPLANNERS:
        return navigateTo('/wasplanner/dashboard')
      case UserRole.WASSERS:
        return navigateTo('/washer/queue')
      case UserRole.WERKPLAATS:
        return navigateTo('/workshop/requests')
      case UserRole.HAAL_BRENG_PLANNERS:
        return navigateTo('/delivery/schedule')
      default:
        return navigateTo('/dashboard')
    }
  }
})