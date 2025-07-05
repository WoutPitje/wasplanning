<template>
  <SelectTrigger
    :class="cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      props.class
    )"
    v-bind="props"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { SelectIcon, SelectTrigger } from 'radix-vue'
import type { SelectTriggerProps } from 'radix-vue'
import { cn } from '~/lib/utils'

interface SelectTriggerPropsExtended extends SelectTriggerProps {
  class?: string
}

const props = withDefaults(defineProps<SelectTriggerPropsExtended>(), {
  class: ''
})
</script>