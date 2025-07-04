<template>
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb :items="breadcrumbItems" />
    
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">
        {{ tenant?.display_name ? `${tenant.display_name} Bewerken` : 'Garage Bewerken' }}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Wijzig garage informatie
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">Garage laden...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            Fout bij laden
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
                Garage Informatie
              </h3>
              <p class="mt-1 text-sm leading-6 text-muted-foreground">
                Basis informatie over de garage
              </p>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium leading-6 text-foreground">
                Systeem Naam
              </label>
              <div class="mt-2">
                <div class="px-3 py-2 bg-muted text-muted-foreground rounded-md text-sm">
                  {{ tenant?.name }}
                </div>
                <p class="mt-1 text-xs text-muted-foreground">
                  Systeem naam kan niet gewijzigd worden
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

            <!-- Status -->
            <div class="sm:col-span-6">
              <label class="block text-sm font-medium leading-6 text-foreground">
                Status
              </label>
              <div class="mt-2">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="rounded border-input text-primary focus:ring-primary"
                  />
                  <span class="ml-2 text-sm text-foreground">Garage is actief</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="rounded-md bg-destructive/15 p-4">
            <div class="flex">
              <div class="ml-3">
                <h3 class="text-sm font-medium text-destructive">
                  Fout bij bijwerken garage
                </h3>
                <div class="mt-2 text-sm text-destructive/80">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>

          <!-- Submit buttons -->
          <div class="flex items-center justify-end gap-x-6">
            <Button variant="ghost" asChild>
              <NuxtLink :to="`/admin/tenants/${$route.params.id}`">
                Annuleren
              </NuxtLink>
            </Button>
            <Button type="submit" :disabled="updatePending">
              <span v-if="updatePending">Bezig met bijwerken...</span>
              <span v-else>Garage Bijwerken</span>
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
            Garage succesvol bijgewerkt
          </h3>
          <div class="mt-2 text-sm text-green-700">
            De wijzigingen zijn opgeslagen.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UpdateTenantDto } from '~/types/admin'
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
const route = useRoute()
const { getTenant, updateTenant, pending, error } = useAdmin()

// State
const tenant = ref(null)
const updatePending = ref(false)
const showSuccess = ref(false)

const form = reactive<UpdateTenantDto>({
  display_name: '',
  logo_url: '',
  is_active: true
})

// Breadcrumbs
const breadcrumbItems = computed(() => [
  { label: 'Admin', href: '/admin/tenants' },
  { label: 'Garages', href: '/admin/tenants' },
  { label: tenant.value?.display_name || 'Details', href: `/admin/tenants/${getTenantId()}` },
  { label: 'Bewerken' }
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

// Load tenant on mount
onMounted(() => {
  loadTenant()
})
</script>