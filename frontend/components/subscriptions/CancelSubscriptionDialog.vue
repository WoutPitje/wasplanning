<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('subscription.cancel.dialogTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('subscription.cancel.dialogDescription') }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="py-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ t('subscription.cancel.warning') }}</AlertTitle>
          <AlertDescription>
            {{ t('subscription.cancel.warningDescription') }}
          </AlertDescription>
        </Alert>
        
        <div class="mt-4 space-y-2">
          <p class="text-sm font-medium">{{ t('subscription.cancel.consequences') }}:</p>
          <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{{ t('subscription.cancel.consequence1') }}</li>
            <li>{{ t('subscription.cancel.consequence2') }}</li>
            <li>{{ t('subscription.cancel.consequence3') }}</li>
          </ul>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="dialogOpen = false">
          {{ t('common.keepSubscription') }}
        </Button>
        <Button variant="destructive" @click="$emit('confirm')">
          {{ t('subscription.cancel.confirmButton') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()

const { t } = useI18n()

// Computed
const dialogOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})
</script>