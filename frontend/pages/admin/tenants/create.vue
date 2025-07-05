<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
        {{ t('admin.tenants.form.createTitle') }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ t('admin.tenants.subtitle') }}
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <CardContent class="p-6">
          <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <!-- Garage Information -->
            <div class="sm:col-span-6">
              <h3 class="text-base font-semibold leading-7 text-gray-900">
                {{ t('admin.tenants.details.title') }}
              </h3>
              <p class="mt-1 text-sm leading-6 text-gray-600">
                {{ t('admin.tenants.subtitle') }}
              </p>
            </div>

            <div class="sm:col-span-3">
              <label for="name" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.name') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="name"
                  v-model="form.name"
                  type="text"
                  name="name"
                  required
                  pattern="[a-z0-9-]+"
                  :title="t('admin.tenants.form.nameHelp')"
                  placeholder="garage-amsterdam-west"
                />
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ t('admin.tenants.form.nameHelp') }}
                </p>
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="display_name" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.displayName') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="display_name"
                  v-model="form.display_name"
                  type="text"
                  name="display_name"
                  required
                  placeholder="Garage Amsterdam West"
                />
              </div>
            </div>

            <div class="sm:col-span-6">
              <label class="block text-sm font-medium leading-6 text-foreground mb-2">
                {{ t('admin.tenants.form.logoUrl') }}
              </label>
              <FileUpload
                v-model="form.logo_url"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                {{ t('admin.tenants.form.logoUploadNote') }}
              </p>
            </div>

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

            <!-- Admin User Information -->
            <div class="sm:col-span-6 border-t border-gray-200 pt-6">
              <h3 class="text-base font-semibold leading-7 text-gray-900">
                {{ t('roles.garage_admin') }}
              </h3>
              <p class="mt-1 text-sm leading-6 text-gray-600">
                {{ t('admin.tenants.form.adminEmailHelp') }}
              </p>
            </div>

            <div class="sm:col-span-6">
              <label for="admin_email" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.adminEmail') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="admin_email"
                  v-model="form.admin_email"
                  type="email"
                  name="admin_email"
                  required
                  placeholder="beheerder@garage.nl"
                />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="admin_first_name" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.adminFirstName') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="admin_first_name"
                  v-model="form.admin_first_name"
                  type="text"
                  name="admin_first_name"
                  required
                  placeholder="Jan"
                />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="admin_last_name" class="block text-sm font-medium leading-6 text-foreground">
                {{ t('admin.tenants.form.adminLastName') }} *
              </label>
              <div class="mt-2">
                <Input
                  id="admin_last_name"
                  v-model="form.admin_last_name"
                  type="text"
                  name="admin_last_name"
                  required
                  placeholder="de Vries"
                />
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="mt-6 rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  {{ t('admin.tenants.form.errors.createFailed') }}
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Submit buttons -->
      <div class="mt-6 flex items-center justify-between">
        <Button variant="outline" asChild>
          <NuxtLink to="/admin/tenants">
            {{ t('common.cancel') }}
          </NuxtLink>
        </Button>
        <Button type="submit" :disabled="pending">
          <span v-if="pending">{{ t('common.loading') }}</span>
          <span v-else>{{ t('admin.tenants.form.submit') }}</span>
        </Button>
      </div>
    </form>

    <!-- Success modal -->
    <div
      v-if="showSuccess && createdTenant"
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-medium text-gray-900">{{ t('admin.tenants.form.success') }}</h3>
          </div>
        </div>
        
        <div class="mt-4 space-y-3">
          <p class="text-sm text-gray-600">
            {{ createdTenant.instructions }}
          </p>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="text-sm font-medium text-gray-900">{{ t('admin.tenants.form.adminCredentials') }}:</h4>
            <p class="text-sm text-gray-600 mt-1">
              <strong>{{ t('login.email') }}:</strong> {{ createdTenant.admin_user.email }}<br>
              <strong>{{ t('admin.tenants.form.temporaryPassword') }}:</strong> 
              <code class="bg-gray-200 px-1 py-0.5 rounded text-xs">{{ createdTenant.admin_user.temporary_password }}</code>
            </p>
          </div>
          
          <p class="text-xs text-gray-500">
            {{ t('admin.tenants.form.credentialsNote') }}
          </p>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="copyCredentials"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ copied ? t('admin.tenants.form.copied') : t('admin.tenants.form.copy') }}
          </button>
          <NuxtLink
            to="/admin/tenants"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ t('admin.tenants.form.backToOverview') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { CreateTenantDto, CreateTenantResponse } from '~/types/admin'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Breadcrumb } from '~/components/ui/breadcrumb'
import { FileUpload } from '~/components/ui/file-upload'

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// Composables
const { createTenant, pending, error } = useAdmin()
const { t } = useI18n()

// State
const form = reactive<CreateTenantDto>({
  name: '',
  display_name: '',
  logo_url: '',
  language: 'nl',
  admin_email: '',
  admin_first_name: '',
  admin_last_name: ''
})

const showSuccess = ref(false)
const createdTenant = ref<CreateTenantResponse | null>(null)
const copied = ref(false)

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: 'Admin', href: '/admin/tenants' },
  { label: t('nav.garages'), href: '/admin/tenants' },
  { label: t('admin.tenants.form.createTitle') }
])

// Methods
const handleSubmit = async () => {
  const result = await createTenant(form)
  
  if (result) {
    createdTenant.value = result
    showSuccess.value = true
  }
}

const copyCredentials = async () => {
  if (createdTenant.value) {
    const text = `Garage: ${createdTenant.value.tenant.display_name}
E-mail: ${createdTenant.value.admin_user.email}
Tijdelijk wachtwoord: ${createdTenant.value.admin_user.temporary_password}

${createdTenant.value.instructions}`
    
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => { copied.value = false }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
}

// Auto-generate system name from display name
watch(() => form.display_name, (newValue) => {
  if (newValue && !form.name) {
    form.name = newValue
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
})
</script>