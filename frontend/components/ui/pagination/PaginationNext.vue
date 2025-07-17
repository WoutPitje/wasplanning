<template>
  <PaginationLink
    :href="href"
    :as="as"
    :disabled="disabled"
    aria-label="Go to next page"
    :size="size"
    @click="$emit('click', $event)"
  >
    <span class="sr-only">Next</span>
    <ChevronRight class="h-4 w-4" />
  </PaginationLink>
</template>

<script setup lang="ts">
import PaginationLink from './PaginationLink.vue'
import { ChevronRight } from 'lucide-vue-next'

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