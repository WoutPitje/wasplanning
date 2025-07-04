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
    'super_admin': '/admin/tenants',
    'garage_admin': '/garage-admin/dashboard',
    'wasplanners': '/wasplanner/dashboard',
    'wassers': '/washer/queue',
    'werkplaats': '/workshop/requests',
    'haal_breng_planners': '/delivery/schedule'
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
  if (targetPath.startsWith('/admin/') && userRole !== 'super_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Toegang geweigerd'
    })
  }
  
  // Garage admin can access garage-admin routes  
  if (targetPath.startsWith('/garage-admin/') && userRole !== 'garage_admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Toegang geweigerd'
    })
  }
})