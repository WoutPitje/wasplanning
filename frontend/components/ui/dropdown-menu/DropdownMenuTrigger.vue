<template>
  <div
    ref="triggerEl"
    @click="toggleMenu"
    @keydown.enter="toggleMenu"
    @keydown.space.prevent="toggleMenu"
    @keydown.escape="closeMenu"
    @keydown.arrow-down.prevent="openAndFocus"
    role="button"
    tabindex="0"
    :aria-expanded="isOpen"
    :aria-haspopup="true"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

const dropdown = inject<any>('dropdown-menu')
const triggerEl = ref<HTMLElement>()

const { isOpen, toggleMenu, closeMenu } = dropdown

const openAndFocus = () => {
  if (!isOpen.value) {
    toggleMenu()
  }
  // Focus first menu item when opened with keyboard
  setTimeout(() => {
    const firstItem = dropdown.contentRef.value?.querySelector('[role="menuitem"]')
    firstItem?.focus()
  }, 0)
}

onMounted(() => {
  dropdown.triggerRef.value = triggerEl.value
})
</script>