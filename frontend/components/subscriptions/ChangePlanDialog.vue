<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('subscription.changePlan.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('subscription.changePlan.description') }}
        </DialogDescription>
      </DialogHeader>
      
      <div v-if="plan && currentPlan" class="py-4 space-y-4">
        <!-- Current Plan -->
        <div class="p-4 border rounded-lg bg-muted/50">
          <p class="text-sm font-medium mb-1">{{ t('subscription.changePlan.from') }}</p>
          <p class="font-semibold">{{ currentPlan.display_name }}</p>
          <p class="text-sm text-muted-foreground">
            {{ formatPrice(currentPlan.price_cents) }} {{ t('subscription.perMonth') }}
          </p>
        </div>
        
        <!-- Arrow -->
        <div class="flex justify-center">
          <ArrowDown class="h-5 w-5 text-muted-foreground" />
        </div>
        
        <!-- New Plan -->
        <div class="p-4 border rounded-lg bg-primary/5 border-primary">
          <p class="text-sm font-medium mb-1">{{ t('subscription.changePlan.to') }}</p>
          <p class="font-semibold">{{ plan.display_name }}</p>
          <p class="text-sm text-muted-foreground">
            {{ formatPrice(plan.price_cents) }} {{ t('subscription.perMonth') }}
          </p>
        </div>
        
        <!-- Proration Info -->
        <Alert>
          <Info class="h-4 w-4" />
          <AlertDescription>
            <template v-if="isDowngradeToFree">
              {{ t('subscription.changePlan.downgradeToFreeInfo') }}
            </template>
            <template v-else>
              {{ isUpgrade ? t('subscription.changePlan.upgradeInfo') : t('subscription.changePlan.downgradeInfo') }}
            </template>
          </AlertDescription>
        </Alert>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="dialogOpen = false">
          {{ t('common.cancel') }}
        </Button>
        <Button @click="$emit('confirm')">
          {{ t('subscription.changePlan.confirm') }}
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
import { Alert, AlertDescription } from '~/components/ui/alert'
import { ArrowDown, Info } from 'lucide-vue-next'
import type { SubscriptionPlan } from '~/types/subscriptions'

interface Props {
  open: boolean
  plan: SubscriptionPlan | null
  currentPlan: SubscriptionPlan | undefined
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

const isUpgrade = computed(() => {
  if (!props.plan || !props.currentPlan) return false
  return props.plan.price_cents > props.currentPlan.price_cents
})

const isDowngradeToFree = computed(() => {
  if (!props.plan) return false
  return props.plan.name === 'free' && props.currentPlan && props.currentPlan.price_cents > 0
})

// Methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(price / 100)
}
</script>