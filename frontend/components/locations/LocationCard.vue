<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>{{ location.name }}</CardTitle>
          <CardDescription v-if="location.address">
            {{ location.address }}
          </CardDescription>
        </div>
        <Badge :variant="location.is_active ? 'default' : 'destructive'">
          {{ t(`locations.status.${location.is_active ? 'active' : 'inactive'}`) }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label class="text-muted-foreground">{{ t('locations.details.createdAt') }}</Label>
          <p class="text-sm font-medium">{{ formatDate(location.created_at) }}</p>
        </div>
        <div>
          <Label class="text-muted-foreground">{{ t('locations.details.updatedAt') }}</Label>
          <p class="text-sm font-medium">{{ formatDate(location.updated_at) }}</p>
        </div>
      </div>

      <!-- Assigned Users Section -->
      <div v-if="showUsers && users" class="pt-4 border-t">
        <div class="flex items-center justify-between mb-4">
          <Label class="text-base">{{ t('locations.details.assignedUsers') }}</Label>
          <Button
            v-if="showManageUsers"
            variant="outline"
            size="sm"
            @click="$emit('manage-users')"
          >
            {{ t('locations.actions.manageUsers') }}
          </Button>
        </div>
        
        <div v-if="users.length > 0" class="space-y-2">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center justify-between p-2 rounded-md bg-muted/50"
          >
            <div>
              <p class="text-sm font-medium">{{ user.first_name }} {{ user.last_name }}</p>
              <p class="text-xs text-muted-foreground">{{ user.email }}</p>
            </div>
            <Badge variant="outline" class="text-xs">
              {{ t(`roles.${user.role.toLowerCase()}`) }}
            </Badge>
          </div>
        </div>
        <p v-else class="text-sm text-muted-foreground">
          {{ t('locations.details.noUsersAssigned') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { nl, enUS } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import type { LocationResponseDto } from '~/types/locations'

interface Props {
  location: LocationResponseDto
  users?: any[]
  showUsers?: boolean
  showManageUsers?: boolean
}

withDefaults(defineProps<Props>(), {
  showUsers: false,
  showManageUsers: false
})

defineEmits<{
  'manage-users': []
}>()

const { t, locale } = useI18n()

// Methods
const formatDate = (dateString: string) => {
  const dateLocale = locale.value === 'nl' ? nl : enUS
  return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: dateLocale })
}
</script>