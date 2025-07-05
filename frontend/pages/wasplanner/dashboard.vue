<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('wasplanner.dashboard.queueManagement') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('wasplanner.dashboard.queueManagementDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('wasplanner.dashboard.assignments') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('wasplanner.dashboard.assignmentsDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('wasplanner.dashboard.planningOverview') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('wasplanner.dashboard.planningOverviewDescription') }}</p>
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