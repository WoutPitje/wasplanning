<template>
  <div class="min-h-screen bg-background">
    <AppHeader />
    
    <!-- Main content -->
    <main>
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
// No need for additional logic - AppHeader handles everything
</script>