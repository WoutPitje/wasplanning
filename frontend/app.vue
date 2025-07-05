<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
// Initialize auth store on app start
const authStore = useAuthStore()

// Initialize locale based on tenant language
useLocale()

onMounted(() => {
  authStore.initAuth()
})
</script>

