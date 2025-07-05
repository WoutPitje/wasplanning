<template>
  <div>
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('washer.queue.myTasks') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('washer.queue.myTasksDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('washer.queue.availableTasks') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('washer.queue.availableTasksDescription') }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})
</script>