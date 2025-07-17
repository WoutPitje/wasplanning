<template>
  <button
    type="button"
    role="menuitem"
    class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 w-full text-left"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { inject } from 'vue'

interface Props {
  disabled?: boolean
  closeOnSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  closeOnSelect: true
})

const emit = defineEmits<{
  select: []
}>()

const dropdown = inject<any>('dropdown-menu')
const { closeMenu } = dropdown

const handleClick = () => {
  emit('select')
  if (props.closeOnSelect) {
    closeMenu()
  }
}
</script>