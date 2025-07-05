<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
        {{ tenant?.display_name ? t('admin.tenants.edit.titleWithName', { name: tenant.display_name }) : t('admin.tenants.edit.title') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('admin.tenants.edit.subtitle') }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('admin.tenants.edit.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            {{ t('admin.tenants.edit.loadError') }}
          </h3>
          <div class="mt-2 text-sm text-destructive/80">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Form -->
    <Card v-else>
      <CardContent class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <!-- Garage Information -->
            <div class="sm:col-span-6">
              <h3 class="text-base font-semibold leading-7 text-foreground">
                {{ t('admin.tenants.edit.garageInfo') }}
              </h3>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                {{ t('admin.tenants.edit.garageInfoDescription') }}
              </p>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.edit.systemName') }}
              </label>
              <div class="mt-2">
                <div class="px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm">
                  {{ tenant?.name }}
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ t('admin.tenants.edit.systemNameInfo') }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="display_name" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.edit.displayName') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="display_name"
                  v-model="form.display_name"
                  type="text"
                  name="display_name"
                  required
                  :placeholder="t('admin.tenants.edit.displayNamePlaceholder')"
                />
              </div>
            </div>

            <div class="sm:col-span-6">
              <label class="block text-sm font-medium leading-6 text-foreground mb-2">
                {{ t('admin.tenants.edit.logoUrl') }}
              </label>
              <FileUpload
                v-model="form.logo_url"
                :tenant-id="getTenantId()"
                @file-uploaded="handleLogoUploaded"
              />
            </div>

            <!-- Language -->
            <div class="sm:col-span-3">
              <label for="language" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.language') }}
              </label>
              <div class="mt-2">
                <select
                  id="language"
                  v-model="form.language"
                  name="language"
                  class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                >
                  <option value="nl">{{ t('languages.nl') }}</option>
                  <option value="en">{{ t('languages.en') }}</option>
                </select>
              </div>
            </div>

            <!-- Status -->
            <div class="sm:col-span-3">
              <label class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.edit.status') }}
              </label>
              <div class="mt-2">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="rounded border-input text-primary focus:ring-primary"
                  />
                  <span class="ml-2 text-sm text-foreground">{{ t('admin.tenants.edit.garageActive') }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="rounded-md bg-destructive/15 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-destructive">
                  {{ t('admin.tenants.edit.updateError') }}
                </h3>
                <div class="mt-2 text-sm text-destructive/80">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <!-- Submit buttons -->
          <div class="flex items-center justify-between">
            <Button type="button" variant="outline" @click="navigateTo(`/admin/tenants/${$route.params.id}`)">
              {{ t('common.cancel') }}
            </Button>
            <Button type="submit" :disabled="updatePending">
              <span v-if="updatePending">{{ t('admin.tenants.edit.updating') }}</span>
              <span v-else>{{ t('admin.tenants.edit.updateButton') }}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Success message -->
    <div v-if="showSuccess" class="rounded-md bg-green-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800">
            {{ t('admin.tenants.edit.updateSuccess') }}
          </h3>
          <div class="mt-2 text-sm text-green-700">
            {{ t('admin.tenants.edit.updateSuccessDescription') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UpdateTenantDto } from '~/types/admin'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Breadcrumb } from '~/components/ui/breadcrumb'
import { FileUpload } from '~/components/ui/file-upload'

const { t } = useI18n()

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// Composables
const route = useRoute()
const { getTenant, updateTenant, pending, error } = useAdmin()

// State
const tenant = ref(null)
const updatePending = ref(false)
const showSuccess = ref(false)

const form = reactive<UpdateTenantDto>({
  display_name: '',
  logo_url: '',
  language: 'nl',
  is_active: true
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: t('admin.breadcrumb.admin'), href: '/admin/tenants' },
  { label: t('admin.breadcrumb.garages'), href: '/admin/tenants' },
  { label: tenant.value?.display_name || t('admin.breadcrumb.details'), href: `/admin/tenants/${getTenantId()}` },
  { label: t('admin.breadcrumb.edit') }
])

// Methods
const getTenantId = () => {
  return route.params.id as string
}

const loadTenant = async () => {
  const id = getTenantId()
  const result = await getTenant(id)
  if (result) {
    tenant.value = result
    // Populate form with existing data
    form.display_name = result.display_name
    form.logo_url = result.logo_url || ''
    form.language = result.language || 'nl'
    form.is_active = result.is_active
  }
}

const handleSubmit = async () => {
  updatePending.value = true
  showSuccess.value = false
  
  const id = getTenantId()
  const result = await updateTenant(id, form)
  
  if (result) {
    tenant.value = result
    showSuccess.value = true
    // Hide success message after 3 seconds
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  }
  
  updatePending.value = false
}

const handleLogoUploaded = (result: any) => {
  // Update the form with the new logo URL
  form.logo_url = result.logo_url
  
  // Optionally show a success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Load tenant on mount
onMounted(() => {
  loadTenant()
})
</script>