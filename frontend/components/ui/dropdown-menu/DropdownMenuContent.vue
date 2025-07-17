<template>
  <Transition
    enter-active-class="transition ease-out duration-100"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div
      v-if="isOpen"
      ref="contentEl"
      class="absolute z-50 mt-2 rounded-md shadow-lg bg-popover text-popover-foreground border"
      :class="[alignClass, sizeClass]"
      role="menu"
      :aria-orientation="orientation"
      @keydown="handleKeydown"
      @click.stop
    >
      <div class="p-1">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, inject, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

interface Props {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  align: 'start',
  sideOffset: 4,
  side: 'bottom',
  orientation: 'vertical',
  size: 'md'
})

const dropdown = inject<any>('dropdown-menu')
const contentEl = ref<HTMLElement>()
const { isOpen, closeMenu } = dropdown

const alignClass = computed(() => {
  const classes = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0'
  }
  return classes[props.align]
})

const sizeClass = computed(() => {
  const classes = {
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-64'
  }
  return classes[props.size]
})

const handleKeydown = (e: KeyboardEvent) => {
  const items = contentEl.value?.querySelectorAll('[role="menuitem"]:not([disabled])')
  if (!items || items.length === 0) return

  const currentIndex = Array.from(items).findIndex(item => item === document.activeElement)

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      const nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1
      ;(items[nextIndex] as HTMLElement).focus()
      break
    case 'ArrowUp':
      e.preventDefault()
      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1
      ;(items[prevIndex] as HTMLElement).focus()
      break
    case 'Home':
      e.preventDefault()
      ;(items[0] as HTMLElement).focus()
      break
    case 'End':
      e.preventDefault()
      ;(items[items.length - 1] as HTMLElement).focus()
      break
    case 'Escape':
      e.preventDefault()
      closeMenu()
      dropdown.triggerRef.value?.focus()
      break
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!dropdown.menuRef.value?.contains(e.target as Node)) {
    closeMenu()
  }
}

watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    const firstItem = contentEl.value?.querySelector('[role="menuitem"]')
    ;(firstItem as HTMLElement)?.focus()
  }
})

onMounted(() => {
  dropdown.contentRef.value = contentEl.value
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>