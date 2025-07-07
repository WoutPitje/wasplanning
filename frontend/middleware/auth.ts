export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  
  // Initialize auth from localStorage if not already done (client-side only)
  if (import.meta.client && !authStore.isAuthenticated) {
    authStore.initAuth()
  }
  
  // If still not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})