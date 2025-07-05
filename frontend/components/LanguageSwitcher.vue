<template>
  <Select v-model="currentLocale">
    <SelectTrigger class="w-[120px]">
      <SelectValue>
        <div class="flex items-center gap-2">
          <span class="text-sm">{{ currentLocaleLabel }}</span>
        </div>
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="loc in availableLocales" :key="loc.code" :value="loc.code">
        <div class="flex items-center gap-2">
          <span>{{ loc.flag }}</span>
          <span>{{ loc.name }}</span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const { locale } = useI18n()

const availableLocales = [
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
]

const currentLocale = computed({
  get: () => locale.value,
  set: (value: string) => {
    locale.value = value
  }
})

const currentLocaleLabel = computed(() => {
  const current = availableLocales.find(loc => loc.code === locale.value)
  return current ? `${current.flag} ${current.code.toUpperCase()}` : 'NL'
})
</script>