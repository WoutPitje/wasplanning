<template>
  <span
    aria-hidden="true"
    class="flex h-9 w-9 items-center justify-center"
  >
    <MoreHorizontal class="h-4 w-4" />
    <span class="sr-only">More pages</span>
  </span>
</template>

<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
</script>