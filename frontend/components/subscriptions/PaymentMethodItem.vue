<template>
  <div class="flex items-center justify-between p-4 border rounded-lg">
    <div class="flex items-center space-x-4">
      <div class="p-2 bg-muted rounded">
        <CreditCard class="h-4 w-4" />
      </div>
      <div>
        <p class="font-medium">
          {{ method.display_string }}
        </p>
        <p v-if="method.card_exp_month && method.card_exp_year" class="text-sm text-muted-foreground">
          {{ t('subscription.paymentMethods.expires') }} {{ method.card_exp_month }}/{{ method.card_exp_year }}
        </p>
      </div>
      <Badge v-if="method.is_default" variant="secondary">
        {{ t('subscription.paymentMethods.default') }}
      </Badge>
    </div>
    
    <div class="flex items-center space-x-2">
      <Button
        v-if="!method.is_default"
        size="sm"
        variant="ghost"
        @click="$emit('set-default', method.id)"
      >
        {{ t('subscription.paymentMethods.setDefault') }}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="text-destructive"
        @click="handleDelete"
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { CreditCard, Trash2 } from 'lucide-vue-next'
import type { PaymentMethod } from '~/types/subscriptions'

interface Props {
  method: PaymentMethod
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'set-default': [id: string]
  'delete': [id: string]
}>()

const { t } = useI18n()

const handleDelete = () => {
  if (confirm(t('subscription.paymentMethods.confirmDelete'))) {
    emit('delete', props.method.id)
  }
}
</script>