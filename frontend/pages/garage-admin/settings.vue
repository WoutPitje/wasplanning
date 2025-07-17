<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">{{ t('garageAdmin.settings.title') }}</h2>
      <p class="text-muted-foreground">{{ t('garageAdmin.settings.subtitle') }}</p>
    </div>
    
    <div class="grid grid-cols-1 gap-6">
      <!-- Tenant Settings Card -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">{{ t('garageAdmin.settings.tenantSettings') }}</h3>
        </CardHeader>
        <CardContent class="space-y-6">
          <!-- Logo Upload Section -->
          <div>
            <Label class="text-base">{{ t('garageAdmin.settings.logo') }}</Label>
            <div class="mt-2 flex items-center gap-4">
              <div v-if="logoUrl" class="relative">
                <img
                  :src="logoUrl"
                  alt="Tenant logo"
                  class="h-20 w-20 rounded-lg object-cover border"
                />
              </div>
              <div v-else class="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                <Icon name="lucide:building" class="h-8 w-8 text-muted-foreground" />
              </div>
              
              <div class="flex-1">
                <div v-if="canUploadLogo">
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    class="hidden"
                    @change="handleFileSelect"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="() => fileInput?.click()"
                    :disabled="isUploading"
                  >
                    <Icon v-if="isUploading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
                    {{ isUploading ? t('common.uploading') : t('garageAdmin.settings.uploadLogo') }}
                  </Button>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ t('garageAdmin.settings.logoRequirements') }}
                  </p>
                </div>
                <div v-else class="space-y-2">
                  <p class="text-sm text-muted-foreground">
                    {{ t('garageAdmin.settings.customBrandingNotAvailable') }}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="() => navigateTo('/garage-admin/subscription')"
                  >
                    {{ t('garageAdmin.settings.upgradePlan') }}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tenant Info -->
          <div>
            <Label class="text-base">{{ t('garageAdmin.settings.tenantName') }}</Label>
            <p class="mt-1 text-sm">{{ tenantSettings?.tenant?.name }}</p>
          </div>

          <!-- Subscription Info -->
          <div v-if="tenantSettings?.subscription">
            <Label class="text-base">{{ t('garageAdmin.settings.subscriptionPlan') }}</Label>
            <p class="mt-1 text-sm">{{ tenantSettings.subscription.display_name }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- General Settings Card -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">{{ t('garageAdmin.settings.generalSettings') }}</h3>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('garageAdmin.settings.placeholder') }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
const { t } = useI18n()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const fileInput = ref<HTMLInputElement>()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const tenantSettings = ref<any>(null)
const isUploading = ref(false)

// Computed
const logoUrl = computed(() => tenantSettings.value?.tenant?.logo_url)
const canUploadLogo = computed(() => 
  tenantSettings.value?.subscription?.features?.custom_branding === true
)

// Fetch tenant settings
const { data, refresh, error: fetchError } = await useFetch(`${config.public.apiUrl}/settings/tenant`, {
  headers: {
    Authorization: `Bearer ${authStore.accessToken}`
  }
})

if (fetchError.value) {
  console.error('Failed to fetch tenant settings:', fetchError.value)
}

tenantSettings.value = data.value

// Handle file upload
async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    alert(t('garageAdmin.settings.fileTooLarge'))
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    await $fetch(`${config.public.apiUrl}/settings/tenant/logo`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      }
    })

    // Logo uploaded successfully

    // Refresh settings to get new logo URL
    await refresh()
  } catch (error: any) {
    console.error('Logo upload error:', error)
    alert(error.data?.message || t('garageAdmin.settings.logoUploadFailed'))
  } finally {
    isUploading.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>