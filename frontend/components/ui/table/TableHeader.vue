<template>
  <thead :class="cn('[&_tr]:border-b', props.class)">
    <slot />
  </thead>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface TableHeaderProps {
  class?: string
}

const props = withDefaults(defineProps<TableHeaderProps>(), {
  class: ''
})
</script>