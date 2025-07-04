<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol role="list" class="flex items-center space-x-1 text-sm text-muted-foreground">
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <!-- Separator -->
        <svg
          v-if="index > 0"
          class="flex-shrink-0 h-4 w-4 mx-2"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        
        <!-- Breadcrumb item -->
        <div class="flex items-center">
          <NuxtLink
            v-if="item.href && index < items.length - 1"
            :to="item.href"
            class="hover:text-foreground transition-colors"
            :aria-current="index === items.length - 1 ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
          <span
            v-else
            class="text-foreground font-medium"
            :aria-current="index === items.length - 1 ? 'page' : undefined"
          >
            {{ item.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

defineProps<Props>()
</script>