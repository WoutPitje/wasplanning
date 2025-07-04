export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  
  // Initialize auth from localStorage if not already done
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
  
  // Check if user is super admin
  if (!authStore.isSuperAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Toegang geweigerd. Alleen Super Admins hebben toegang tot deze pagina.'
    })
  }
})