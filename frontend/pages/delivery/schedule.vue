<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Voltooide Was Beurten</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Voertuigen klaar voor ophalen</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Retour Planning</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Plan terugbreng routes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Urgente Leveringen</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Voertuigen met zelfde dag terugbreng</p>
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