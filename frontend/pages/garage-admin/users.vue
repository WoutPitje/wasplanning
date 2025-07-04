<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">Gebruikers Beheer</h2>
      <p class="text-muted-foreground">Beheer garage gebruikers en hun rollen</p>
    </div>
    
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Gebruikers Overzicht</h3>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Hier komen de gebruikers van deze garage...</p>
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