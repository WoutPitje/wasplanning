<template>
  <PaginationLink
    :href="href"
    :as="as"
    :disabled="disabled"
    aria-label="Go to previous page"
    :size="size"
    @click="$emit('click', $event)"
  >
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Previous</span>
  </PaginationLink>
</template>

<script setup lang="ts">
import PaginationLink from './PaginationLink.vue'
import { ChevronLeft } from 'lucide-vue-next'

interface Props {
  href?: string
  as?: string
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
}

withDefaults(defineProps<Props>(), {
  as: 'button',
  disabled: false,
  size: 'default'
})

defineEmits<{
  click: [MouseEvent]
}>()
</script>