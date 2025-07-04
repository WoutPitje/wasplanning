<template>
  <div>
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Nieuwe Was Verzoeken</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Dien was verzoeken in voor voertuigen</p>
          <Button class="mt-4">Nieuw Verzoek</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Mijn Verzoeken</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Bekijk status van ingediende verzoeken</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})
</script>