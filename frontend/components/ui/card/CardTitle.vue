<template>
  <h3
    :class="cn(
      'text-lg font-semibold leading-none tracking-tight',
      props.class
    )"
  >
    <slot />
  </h3>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CardTitleProps {
  class?: string
}

const props = withDefaults(defineProps<CardTitleProps>(), {
  class: ''
})
</script>