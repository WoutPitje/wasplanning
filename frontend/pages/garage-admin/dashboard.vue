<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('garageAdmin.dashboard.userManagement') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('garageAdmin.dashboard.userManagementDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('garageAdmin.dashboard.garageSettings') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('garageAdmin.dashboard.garageSettingsDescription') }}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h2 class="text-xl font-semibold">{{ t('garageAdmin.dashboard.reports') }}</h2>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground">{{ t('garageAdmin.dashboard.reportsDescription') }}</p>
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