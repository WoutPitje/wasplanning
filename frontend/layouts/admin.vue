<template>
  <div class="h-screen bg-background flex flex-col">
    <!-- Impersonation banner at the top -->
    <ImpersonationBanner />
    
    <div class="flex flex-1 h-full overflow-hidden">
      <!-- Sidebar -->
      <AppSidebar />
      
      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <div class="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <!-- Add padding for mobile menu button -->
          <div class="lg:pl-0 pl-12">
            <slot />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// The sidebar and impersonation banner handle their own logic
</script>