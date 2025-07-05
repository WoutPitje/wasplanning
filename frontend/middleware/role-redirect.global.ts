import { UserRole } from '~/types/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()
  
  // Skip if not authenticated or already redirecting
  if (!authStore.isAuthenticated || to.path === '/login') {
    return
  }
  
  // Initialize auth if needed
  if (!authStore.user) {
    authStore.initAuth()
  }
  
  // Skip if no user data yet
  if (!authStore.user) {
    return
  }
  
  // Role-based dashboard redirects
  const roleDashboards: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '/admin/tenants',
    [UserRole.GARAGE_ADMIN]: '/garage-admin/dashboard',
    [UserRole.WASPLANNERS]: '/wasplanner/dashboard',
    [UserRole.WASSERS]: '/washer/queue',
    [UserRole.WERKPLAATS]: '/workshop/requests',
    [UserRole.HAAL_BRENG_PLANNERS]: '/delivery/schedule'
  }
  
  // If user is on root path or dashboard, redirect to role-specific dashboard
  if (to.path === '/' || to.path === '/dashboard') {
    const dashboardPath = roleDashboards[authStore.user.role]
    if (dashboardPath) {
      return navigateTo(dashboardPath)
    }
  }
  
  // If user is trying to access a role-specific page they don't have access to
  const userRole = authStore.user.role
  const targetPath = to.path
  
  // Super admin can access admin routes
  if (targetPath.startsWith('/admin/') && userRole !== UserRole.SUPER_ADMIN) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Toegang geweigerd'
    })
  }
  
  // Garage admin can access garage-admin routes  
  if (targetPath.startsWith('/garage-admin/') && userRole !== UserRole.GARAGE_ADMIN) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Toegang geweigerd'
    })
  }
})