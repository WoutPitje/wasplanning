<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('users.dialog.temporaryPasswordTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('users.dialog.temporaryPasswordDescription') }}
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="p-4 bg-muted rounded-md">
          <p class="text-sm font-medium mb-2">{{ t('users.dialog.temporaryPassword') }}:</p>
          <code class="text-lg font-mono">{{ password }}</code>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ t('users.dialog.passwordNote') }}
        </p>
        <DialogFooter>
          <Button variant="outline" @click="copyPassword">
            {{ copied ? t('users.dialog.copied') : t('users.dialog.copyPassword') }}
          </Button>
          <Button @click="$emit('update:open', false)">
            {{ t('common.close', 'Close') }}
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

interface Props {
  open: boolean
  password: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const { t } = useI18n()

// State
const copied = ref(false)

// Methods
const copyPassword = async () => {
  await navigator.clipboard.writeText(props.password)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Reset copied state when dialog opens
watch(() => props.open, (newVal) => {
  if (newVal) {
    copied.value = false
  }
})
</script>