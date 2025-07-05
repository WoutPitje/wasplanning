<template>
  <div class="relative w-full overflow-auto">
    <table
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface TableProps {
  class?: string
}

const props = withDefaults(defineProps<TableProps>(), {
  class: ''
})
</script>