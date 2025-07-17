<template>
  <component
    :is="as"
    :href="href"
    :class="[
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      {
        'hover:bg-accent hover:text-accent-foreground h-10 w-10': size === 'default',
        'h-8 w-8': size === 'sm',
        'h-12 w-12': size === 'lg',
        'bg-primary text-primary-foreground hover:bg-primary/90': isActive && !disabled,
        'cursor-pointer': !disabled
      }
    ]"
    :aria-current="isActive ? 'page' : undefined"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  href?: string
  as?: string
  isActive?: boolean
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  isActive: false,
  disabled: false,
  size: 'default'
})

const emit = defineEmits<{
  click: [MouseEvent]
}>()

const handleClick = (e: MouseEvent) => {
  if (!props.disabled) {
    emit('click', e)
  }
}
</script>