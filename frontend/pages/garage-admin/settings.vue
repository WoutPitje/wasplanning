<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">Garage Instellingen</h2>
      <p class="text-muted-foreground">Configureer instellingen voor uw garage</p>
    </div>
    
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Algemene Instellingen</h3>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Hier komen de garage instellingen...</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader } from '~/components/ui/card'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})
</script>