<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-destructive/15 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive">
            {{ t('locations.errors.loadFailed') }}
          </h3>
          <div class="mt-2 text-sm text-destructive/80">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Locations table -->
    <Card v-else>
      <CardContent class="p-0">
        <div v-if="locations.length > 0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t('locations.table.name') }}</TableHead>
                <TableHead>{{ t('locations.table.address') }}</TableHead>
                <TableHead>{{ t('locations.table.status') }}</TableHead>
                <TableHead>{{ t('locations.table.createdAt') }}</TableHead>
                <TableHead class="text-right">{{ t('locations.table.actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="location in locations" :key="location.id">
                <TableCell class="font-medium">
                  {{ location.name }}
                </TableCell>
                <TableCell>
                  {{ location.address || '-' }}
                </TableCell>
                <TableCell>
                  <Badge :variant="location.is_active ? 'default' : 'destructive'">
                    {{ t(`locations.status.${location.is_active ? 'active' : 'inactive'}`) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ formatDate(location.created_at) }}
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="default"
                    size="sm"
                    @click="() => $emit('view', location)"
                  >
                    {{ t('locations.actions.viewDetails') }}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div v-else class="text-center py-12">
          <MapPin class="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p class="mt-4 text-sm text-muted-foreground">{{ t('locations.noLocations') }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('locations.noLocationsDescription') }}</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nl, enUS } from 'date-fns/locale'
import { MapPin } from 'lucide-vue-next'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { LocationResponseDto } from '~/types/locations'

interface Props {
  locations: LocationResponseDto[]
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

defineEmits<{
  view: [location: LocationResponseDto]
}>()

const { t, locale } = useI18n()

// Methods
const formatDate = (dateString: string) => {
  const dateLocale = locale.value === 'nl' ? nl : enUS
  return format(new Date(dateString), 'dd MMM yyyy', { locale: dateLocale })
}
</script>