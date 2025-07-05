<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <img 
          src="/wasplanning-logo.png" 
          alt="Wasplanning Logo" 
          class="mx-auto h-24 w-auto mb-8"
        />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ t('login.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ t('login.subtitle') }}
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              {{ t('login.email') }}
            </label>
            <Input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1"
              :placeholder="t('login.emailPlaceholder')"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              {{ t('login.password') }}
            </label>
            <Input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="mt-1"
              :placeholder="t('login.passwordPlaceholder')"
            />
          </div>
        </div>

        <!-- Error message -->
        <div v-if="authError" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ t('login.error') }}
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ authError }}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            :disabled="pending"
            class="w-full"
          >
            <span v-if="pending">{{ t('login.loggingIn') }}</span>
            <span v-else>{{ t('login.loginButton') }}</span>
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { type LoginDto, UserRole } from '~/types/auth'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

const { t } = useI18n()

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// State
const form = reactive<LoginDto>({
  email: '',
  password: ''
})

// Composables
const { login, pending, error: authError } = useAuth()
const authStore = useAuthStore()

// Methods
const handleLogin = async () => {
  console.log('🔄 Starting login process...', form)
  
  try {
    const response = await login(form)
    console.log('📥 Login response:', response)
    
    if (response) {
      console.log('✅ Login successful, setting auth data...')
      // Set auth data in store
      authStore.setAuth(response)
      
      // Redirect based on user role
      const redirectPath = getRedirectPath(response.user.role)
      console.log('🔄 Redirecting to:', redirectPath)
      await navigateTo(redirectPath)
    } else {
      console.log('❌ Login failed - no response')
    }
  } catch (err) {
    console.error('❌ Login error:', err)
  }
}

// Get redirect path based on user role
const getRedirectPath = (role: string) => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin/tenants'
    case UserRole.GARAGE_ADMIN:
      return '/garage-admin/dashboard'
    case UserRole.WASPLANNERS:
      return '/wasplanner/dashboard'
    case UserRole.WASSERS:
      return '/washer/queue'
    case UserRole.WERKPLAATS:
      return '/workshop/requests'
    case UserRole.HAAL_BRENG_PLANNERS:
      return '/delivery/schedule'
    default:
      return '/dashboard'
  }
}

// Clear error when user starts typing
watch([() => form.email, () => form.password], () => {
  if (authError.value) {
    // Clear error when user modifies form
  }
})
</script>