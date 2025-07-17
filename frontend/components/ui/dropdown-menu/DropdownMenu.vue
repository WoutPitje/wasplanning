<template>
  <div ref="menuRef" class="relative inline-block text-left">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const menuRef = ref<HTMLElement>()
const isOpen = ref(false)
const triggerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

provide('dropdown-menu', {
  isOpen,
  toggleMenu,
  closeMenu,
  triggerRef,
  contentRef,
  menuRef
})
</script>