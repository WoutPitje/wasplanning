<template>
  <div>
    <div class="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('workshop.requests.newRequests') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('workshop.requests.newRequestsDescription') }}</p>
          <Button class="mt-4">{{ t('workshop.requests.newRequestButton') }}</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('workshop.requests.myRequests') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('workshop.requests.myRequestsDescription') }}</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

const { t } = useI18n()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})
</script>