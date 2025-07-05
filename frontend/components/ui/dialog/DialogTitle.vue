<template>
  <DialogTitle
    :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)"
    v-bind="props"
  >
    <slot />
  </DialogTitle>
</template>

<script setup lang="ts">
import { DialogTitle } from 'radix-vue'
import type { DialogTitleProps } from 'radix-vue'
import { cn } from '~/lib/utils'

interface DialogTitlePropsExtended extends DialogTitleProps {
  class?: string
}

const props = withDefaults(defineProps<DialogTitlePropsExtended>(), {
  class: ''
})
</script>