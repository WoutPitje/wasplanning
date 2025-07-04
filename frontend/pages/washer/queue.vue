<template>
  <div>
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Mijn Taken</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Bekijk en update was taken</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Beschikbare Taken</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Taken die toegewezen kunnen worden</p>
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