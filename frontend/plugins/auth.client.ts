export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // Initialize auth from localStorage on client-side before middleware runs
  authStore.initAuth()
})