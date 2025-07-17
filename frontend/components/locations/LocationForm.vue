<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>{{ t('locations.form.locationInfo') }}</CardTitle>
        <CardDescription>{{ t('locations.form.locationInfoDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Name -->
        <div class="grid gap-2">
          <Label for="name">{{ t('locations.form.name') }}</Label>
          <Input
            id="name"
            v-model="formData.name"
            :placeholder="t('locations.form.namePlaceholder')"
            required
            :disabled="loading"
          />
        </div>

        <!-- Address -->
        <div class="grid gap-2">
          <Label for="address">{{ t('locations.form.address') }}</Label>
          <Input
            id="address"
            v-model="formData.address"
            :placeholder="t('locations.form.addressPlaceholder')"
            :disabled="loading"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Form Actions -->
    <div class="flex justify-between">
      <Button
        type="button"
        variant="outline"
        @click="handleCancel"
        :disabled="loading"
      >
        {{ t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        :disabled="loading || !isFormValid"
      >
        <span v-if="loading" class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {{ t('common.saving') }}
        </span>
        <span v-else>
          {{ isEditMode ? t('common.save') : t('common.create') }}
        </span>
      </Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import type { CreateLocationDto, UpdateLocationDto, LocationResponseDto } from '~/types/locations'

interface Props {
  location?: LocationResponseDto | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  location: null,
  loading: false
})

const emit = defineEmits<{
  submit: [data: CreateLocationDto | UpdateLocationDto]
  cancel: []
}>()

const { t } = useI18n()

// Form state
const formData = ref<CreateLocationDto>({
  name: '',
  address: ''
})

// Computed
const isEditMode = computed(() => !!props.location)
const isFormValid = computed(() => formData.value.name.trim().length >= 2)

// Watch for location changes (edit mode)
watch(() => props.location, (newLocation) => {
  if (newLocation) {
    formData.value = {
      name: newLocation.name,
      address: newLocation.address || ''
    }
  }
}, { immediate: true })

// Methods
const handleSubmit = () => {
  if (!isFormValid.value) return
  
  const data: CreateLocationDto | UpdateLocationDto = {
    name: formData.value.name.trim(),
    address: formData.value.address?.trim() || undefined
  }
  
  emit('submit', data)
}

const handleCancel = () => {
  emit('cancel')
}
</script>