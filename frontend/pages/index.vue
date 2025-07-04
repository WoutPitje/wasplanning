<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <h1 class="text-4xl font-bold text-foreground mb-2">
          Wasplanning
        </h1>
        <p class="text-lg text-muted-foreground">
          Garage wasplanning systeem
        </p>
      </CardHeader>
      <CardContent class="text-center space-y-6">
        <p class="text-muted-foreground">
          Efficiënt beheer van autowasactiviteiten voor garages met ophaal- en brengservice.
        </p>
        
        <Button asChild class="w-full">
          <NuxtLink to="/login">
            Inloggen
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Head meta
useHead({
  title: 'Wasplanning - Garage Wassysteem',
  meta: [
    { name: 'description', content: 'Efficiënt beheer van autowasactiviteiten voor garages met ophaal- en brengservice.' }
  ]
})
</script>