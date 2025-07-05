import type { LoginResponse } from '~/types/auth'

export const useImpersonation = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const router = useRouter()

  const isImpersonating = computed(() => authStore.impersonation?.is_impersonating || false)

  const startImpersonation = async (userId: string) => {
    try {
      const response = await $fetch<LoginResponse>(`${config.public.apiUrl}/auth/impersonate/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })

      // Update auth store with new tokens and user info
      authStore.setAuth(response)

      await router.push(`/`)
    } catch (error: any) {
      console.error('Impersonation failed:', error)
      throw error
    }
  }

  const stopImpersonation = async () => {
    try {
      const response = await $fetch<LoginResponse>(`${config.public.apiUrl}/auth/stop-impersonation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })

      // Update auth store with original user
      authStore.setAuth(response)

      // Redirect to admin dashboard
      await router.push('/admin/users')
    } catch (error: any) {
      throw error
    }
  }

  return {
    isImpersonating,
    startImpersonation,
    stopImpersonation
  }
}