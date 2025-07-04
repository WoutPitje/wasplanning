<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
        Nieuwe Garage Toevoegen
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Voeg een nieuwe garage toe aan het systeem
      </p>
    </div>

    <!-- Form -->
    <Card>
      <CardContent class="p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <!-- Garage Information -->
          <div class="sm:col-span-6">
            <h3 class="text-base font-semibold leading-7 text-gray-900">
              Garage Informatie
            </h3>
            <p class="mt-1 text-sm leading-6 text-gray-600">
              Basis informatie over de garage
            </p>
          </div>

          <div class="sm:col-span-3">
            <label for="name" class="block text-sm font-medium leading-6 text-foreground">
              Systeem Naam *
            </label>
            <div class="mt-2">
              <Input
                id="name"
                v-model="form.name"
                type="text"
                name="name"
                required
                pattern="[a-z0-9-]+"
                title="Alleen kleine letters, cijfers en streepjes"
                placeholder="garage-amsterdam-west"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                Unieke naam voor het systeem (alleen kleine letters, cijfers en streepjes)
              </p>
            </div>
          </div>

          <div class="sm:col-span-3">
            <label for="display_name" class="block text-sm font-medium leading-6 text-foreground">
              Weergave Naam *
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
            <label for="logo_url" class="block text-sm font-medium leading-6 text-foreground">
              Logo URL
            </label>
            <div class="mt-2">
              <Input
                id="logo_url"
                v-model="form.logo_url"
                type="url"
                name="logo_url"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <!-- Admin User Information -->
          <div class="sm:col-span-6 border-t border-gray-200 pt-6">
            <h3 class="text-base font-semibold leading-7 text-gray-900">
              Garage Beheerder
            </h3>
            <p class="mt-1 text-sm leading-6 text-gray-600">
              Informatie voor de hoofdbeheerder van deze garage
            </p>
          </div>

          <div class="sm:col-span-6">
            <label for="admin_email" class="block text-sm font-medium leading-6 text-foreground">
              E-mailadres *
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
              Voornaam *
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
              Achternaam *
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
                Fout bij aanmaken garage
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

        <!-- Submit buttons -->
        <div class="mt-6 flex items-center justify-end gap-x-6">
          <Button variant="ghost" asChild>
            <NuxtLink to="/admin/tenants">
              Annuleren
            </NuxtLink>
          </Button>
          <Button type="submit" :disabled="pending">
            <span v-if="pending">Bezig met aanmaken...</span>
            <span v-else>Garage Aanmaken</span>
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>

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
            <h3 class="text-lg font-medium text-gray-900">Garage Succesvol Aangemaakt!</h3>
          </div>
        </div>
        
        <div class="mt-4 space-y-3">
          <p class="text-sm text-gray-600">
            {{ createdTenant.instructions }}
          </p>
          
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="text-sm font-medium text-gray-900">Inloggegevens Beheerder:</h4>
            <p class="text-sm text-gray-600 mt-1">
              <strong>E-mail:</strong> {{ createdTenant.admin_user.email }}<br>
              <strong>Tijdelijk wachtwoord:</strong> 
              <code class="bg-gray-200 px-1 py-0.5 rounded text-xs">{{ createdTenant.admin_user.temporary_password }}</code>
            </p>
          </div>
          
          <p class="text-xs text-gray-500">
            Stuur deze gegevens veilig naar de garage beheerder. Het tijdelijke wachtwoord moet bij eerste inlog worden gewijzigd.
          </p>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="copyCredentials"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ copied ? 'Gekopieerd!' : 'Kopiëren' }}
          </button>
          <NuxtLink
            to="/admin/tenants"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Terug naar Overzicht
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CreateTenantDto, CreateTenantResponse } from '~/types/admin'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Breadcrumb } from '~/components/ui/breadcrumb'

// Meta
definePageMeta({
  middleware: 'super-admin',
  layout: 'admin'
})

// Composables
const { createTenant, pending, error } = useAdmin()

// State
const form = reactive<CreateTenantDto>({
  name: '',
  display_name: '',
  logo_url: '',
  admin_email: '',
  admin_first_name: '',
  admin_last_name: ''
})

const showSuccess = ref(false)
const createdTenant = ref<CreateTenantResponse | null>(null)
const copied = ref(false)

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Admin', href: '/admin/tenants' },
  { label: 'Garages', href: '/admin/tenants' },
  { label: 'Nieuwe Garage' }
]

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