import { useI18n } from 'vue-i18n'

export const useLocale = () => {
  const { locale } = useI18n()
  const authStore = useAuthStore()

  // Watch for tenant language changes and update locale
  watch(
    () => authStore.tenant?.language,
    (language) => {
      if (language && ['nl', 'en'].includes(language)) {
        locale.value = language as 'nl' | 'en'
      } else {
        // Default to Dutch if no tenant language is set
        locale.value = 'nl'
      }
    },
    { immediate: true }
  )

  // Also watch for user changes to reinitialize locale
  watch(
    () => authStore.user,
    (user) => {
      if (user) {
        // If user exists but no tenant language, default to Dutch
        const tenantLang = authStore.tenant?.language
        if (tenantLang && ['nl', 'en'].includes(tenantLang)) {
          locale.value = tenantLang as 'nl' | 'en'
        } else {
          locale.value = 'nl'
        }
      } else {
        // No user, default to Dutch
        locale.value = 'nl'
      }
    },
    { immediate: true }
  )

  // Function to manually set locale
  const setLocale = (lang: 'nl' | 'en') => {
    locale.value = lang
  }

  return {
    locale: readonly(locale),
    setLocale
  }
}