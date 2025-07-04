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
onMounted(() => {
  authStore.initAuth()
})
</script>
