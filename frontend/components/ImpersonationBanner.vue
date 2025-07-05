<template>
  <div v-if="isImpersonating" class="bg-yellow-500 text-black w-full">
    <div class="py-2 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium">
            {{ t('admin.users.impersonating_as', { email: authStore.user?.email || '' }) }}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          @click="handleStopImpersonation"
          :disabled="stoppingImpersonation"
        >
          {{ t('admin.users.stop_impersonation') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'

const { t } = useI18n()
const authStore = useAuthStore()
const { stopImpersonation } = useImpersonation()

// Impersonation state
const isImpersonating = computed(() => authStore.impersonation?.is_impersonating || false)
const stoppingImpersonation = ref(false)

const handleStopImpersonation = async () => {
  stoppingImpersonation.value = true
  try {
    await stopImpersonation()
  } catch (error) {
    // Error is already handled in the composable
    stoppingImpersonation.value = false
  }
}
</script>