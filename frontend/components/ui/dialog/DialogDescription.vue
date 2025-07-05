<template>
  <DialogDescription
    :class="cn('text-sm text-muted-foreground', props.class)"
    v-bind="props"
  >
    <slot />
  </DialogDescription>
</template>

<script setup lang="ts">
import { DialogDescription } from 'radix-vue'
import type { DialogDescriptionProps } from 'radix-vue'
import { cn } from '~/lib/utils'

interface DialogDescriptionPropsExtended extends DialogDescriptionProps {
  class?: string
}

const props = withDefaults(defineProps<DialogDescriptionPropsExtended>(), {
  class: ''
})
</script>