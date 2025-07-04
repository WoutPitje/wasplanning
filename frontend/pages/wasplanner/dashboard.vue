<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Wachtrij Beheer</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Beheer was taken en prioriteiten</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Toewijzingen</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Wijs taken toe aan wassers</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">Planning Overzicht</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">Bekijk dagelijkse planning</p>
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