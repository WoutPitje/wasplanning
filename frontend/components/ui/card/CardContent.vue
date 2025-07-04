<template>
  <div 
    :class="cn('p-6 pt-0', $attrs.class ?? '')"
    v-bind="$attrs"
    data-slot="card-content"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
</script>