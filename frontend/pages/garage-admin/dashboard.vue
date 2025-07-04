<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Gebruikers Beheer</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Beheer gebruikers en rollen</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Garage Instellingen</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Configureer garage voorkeuren</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Rapporten</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Bekijk prestatie rapporten</p>
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