<template>
  <label
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.class
    )"
    v-bind="props"
  >
    <slot />
  </label>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface LabelProps {
  for?: string
  class?: string
}

const props = withDefaults(defineProps<LabelProps>(), {
  class: ''
})
</script>