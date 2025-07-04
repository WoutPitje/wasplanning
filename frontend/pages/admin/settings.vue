<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">Systeem Instellingen</h2>
      <p class="text-muted-foreground">Beheer globale systeem instellingen</p>
    </div>
    
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Systeem Configuratie</h3>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Hier komen de systeem instellingen...</p>
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