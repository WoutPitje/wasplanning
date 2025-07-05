<template>
  <input
    type="checkbox"
    :class="cn(
      'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
      props.class
    )"
    :checked="checked"
    @change="$emit('update:checked', ($event.target as HTMLInputElement).checked)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

interface CheckboxProps {
  checked?: boolean
  class?: string
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  checked: false,
  class: ''
})

defineEmits<{
  'update:checked': [value: boolean]
}>()
</script>