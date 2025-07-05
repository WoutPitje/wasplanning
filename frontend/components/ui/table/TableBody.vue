<template>
  <tbody
    :class="cn('[&_tr:last-child]:border-0', props.class)"
  >
    <slot />
  </tbody>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface TableBodyProps {
  class?: string
}

const props = withDefaults(defineProps<TableBodyProps>(), {
  class: ''
})
</script>