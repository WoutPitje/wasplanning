<template>
  <div class="space-y-4">
    <!-- File Input -->
    <div class="flex items-center justify-center w-full">
      <label
        for="file-upload"
        class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        :class="{
          'border-primary bg-primary/5': isDragging,
          'border-destructive bg-destructive/5': error
        }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <!-- Current Image Preview -->
          <div v-if="previewUrl" class="mb-4">
            <img 
              :src="previewUrl" 
              :alt="t('admin.tenants.form.logoPreview')"
              class="h-20 w-20 object-contain rounded"
            />
          </div>
          
          <!-- Upload Icon -->
          <svg v-else class="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          
          <p class="mb-2 text-sm text-gray-500">
            <span class="font-semibold">{{ t('admin.tenants.form.clickToUpload') }}</span>
            {{ t('admin.tenants.form.orDragAndDrop') }}
          </p>
          <p class="text-xs text-gray-500">{{ t('admin.tenants.form.allowedFormats') }}</p>
          <p class="text-xs text-gray-500">{{ t('admin.tenants.form.maxFileSize') }}</p>
        </div>
        
        <input
          id="file-upload"
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @change="handleFileSelect"
        />
      </label>
    </div>

    <!-- Current URL Input (alternative) -->
    <div v-if="showUrlInput">
      <label class="block text-sm font-medium leading-6 text-foreground mb-2">
        {{ t('admin.tenants.form.logoUrlAlternative') }}
      </label>
      <div class="flex gap-2">
        <Input
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          type="url"
          :placeholder="t('admin.tenants.form.logoUrlPlaceholder')"
          class="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          @click="showUrlInput = false"
        >
          {{ t('common.cancel') }}
        </Button>
      </div>
    </div>

    <!-- URL Input Toggle -->
    <div v-if="!showUrlInput && !previewUrl" class="text-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        @click="showUrlInput = true"
      >
        {{ t('admin.tenants.form.useUrlInstead') }}
      </Button>
    </div>

    <!-- Current Image Actions -->
    <div v-if="previewUrl" class="flex justify-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="removeFile"
      >
        {{ t('admin.tenants.form.removeImage') }}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        @click="showUrlInput = true"
      >
        {{ t('admin.tenants.form.useUrlInstead') }}
      </Button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="text-sm text-destructive">
      {{ error }}
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="w-full bg-gray-200 rounded-full h-2">
      <div 
        class="bg-primary h-2 rounded-full transition-all duration-300"
        :style="{ width: `${uploadProgress}%` }"
      ></div>
      <p class="text-sm text-muted-foreground mt-1 text-center">
        {{ t('admin.tenants.form.uploading') }}...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface Props {
  modelValue?: string
  tenantId?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'fileUploaded', result: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()

// State
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const showUrlInput = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const previewUrl = ref('')

// Computed
const isUrl = computed(() => {
  return props.modelValue && (props.modelValue.startsWith('http') || props.modelValue.startsWith('minio:'))
})

// Methods
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    handleFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFile(file)
  }
}

const handleFile = async (file: File) => {
  error.value = ''
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    error.value = t('admin.tenants.form.invalidFileType')
    return
  }

  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    error.value = t('admin.tenants.form.fileTooLarge')
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Upload file if tenantId is provided, otherwise just preview
  if (props.tenantId) {
    await uploadFile(file)
  } else {
    // Just store the file info for later upload
    emit('update:modelValue', 'file-selected')
  }
}

const uploadFile = async (file: File) => {
  if (!props.tenantId) return

  uploading.value = true
  uploadProgress.value = 0
  error.value = ''

  try {
    const config = useRuntimeConfig()
    const authStore = useAuthStore()
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch(`${config.public.apiUrl}/admin/tenants/${props.tenantId}/logo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authStore.accessToken}`
      },
      body: formData,
      onUploadProgress: (progress) => {
        uploadProgress.value = Math.round((progress.loaded / progress.total) * 100)
      }
    })

    // Emit the uploaded file result
    emit('fileUploaded', response)
    emit('update:modelValue', response.logo_url)
    
  } catch (err: any) {
    error.value = err.data?.message || t('admin.tenants.form.uploadFailed')
    previewUrl.value = ''
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const removeFile = () => {
  previewUrl.value = ''
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Watch for external URL changes
watch(() => props.modelValue, async (newValue) => {
  if (newValue && newValue.startsWith('http')) {
    previewUrl.value = newValue
    showUrlInput.value = false
  } else if (newValue && newValue.startsWith('minio:') && props.tenantId) {
    // For minio URLs, get the presigned URL
    try {
      const config = useRuntimeConfig()
      const authStore = useAuthStore()
      const presignedUrl = await $fetch(`${config.public.apiUrl}/admin/tenants/${props.tenantId}/logo`, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`
        }
      })
      previewUrl.value = presignedUrl.logo_url
      showUrlInput.value = false
    } catch (error) {
      console.warn('Failed to get presigned URL for logo:', error)
      previewUrl.value = ''
    }
  } else if (!newValue || newValue === 'file-selected') {
    if (newValue !== 'file-selected') {
      previewUrl.value = ''
    }
  }
}, { immediate: true })
</script>