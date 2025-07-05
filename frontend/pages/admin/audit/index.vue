<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">{{ t('admin.audit.title') }}</h1>
    </div>

      <!-- Filters -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ t('admin.audit.filters') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Date Range -->
            <div>
              <Label>{{ t('admin.audit.start_date') }}</Label>
              <Input
                v-model="filters.start_date"
                type="date"
                @change="updateFilters"
              />
            </div>
            <div>
              <Label>{{ t('admin.audit.end_date') }}</Label>
              <Input
                v-model="filters.end_date"
                type="date"
                @change="updateFilters"
              />
            </div>
            
            <!-- Action Filter -->
            <div>
              <Label>{{ t('admin.audit.action') }}</Label>
              <Select v-model="filters.action" @update:modelValue="updateFilters">
                <SelectTrigger>
                  <SelectValue :placeholder="t('admin.audit.filter_by_action')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{{ t('common.all') }}</SelectItem>
                  <SelectItem 
                    v-for="(label, action) in actionLabels" 
                    :key="action"
                    :value="action"
                  >
                    {{ label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div class="mt-4 flex gap-2">
            <Button @click="clearFilters" variant="outline">
              {{ t('admin.audit.clear_filters') }}
            </Button>
            <Button @click="exportLogs" variant="outline">
              <Download class="w-4 h-4 mr-2" />
              {{ t('admin.audit.export_csv') }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Audit Logs Table -->
      <Card>
        <CardContent class="p-0">
          <div v-if="loading" class="p-8 text-center">
            <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
            <p class="mt-2 text-sm text-gray-600">{{ t('common.loading') }}</p>
          </div>
          
          <div v-else-if="error" class="p-8 text-center">
            <AlertCircle class="w-8 h-8 mx-auto text-destructive" />
            <p class="mt-2 text-sm text-destructive">{{ error }}</p>
            <Button @click="fetchLogs" variant="outline" size="sm" class="mt-4">
              {{ t('common.retry') }}
            </Button>
          </div>
          
          <div v-else-if="!logs?.items?.length" class="p-8 text-center text-gray-500">
            {{ t('admin.audit.no_logs') }}
          </div>
          
          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t('admin.audit.date') }}</TableHead>
                  <TableHead>{{ t('admin.audit.user') }}</TableHead>
                  <TableHead>{{ t('admin.audit.action') }}</TableHead>
                  <TableHead>{{ t('admin.audit.resource') }}</TableHead>
                  <TableHead>{{ t('admin.audit.ip_address') }}</TableHead>
                  <TableHead class="text-right">{{ t('common.actions') }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="log in logs.items" :key="log.id">
                  <TableCell class="whitespace-nowrap">
                    {{ formatDateTime(log.created_at) }}
                  </TableCell>
                  <TableCell>
                    {{ log.user?.email || '-' }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {{ getActionLabel(log.action) }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {{ getResourceLabel(log.resource_type) }}
                  </TableCell>
                  <TableCell class="text-sm text-gray-600">
                    {{ log.ip_address || '-' }}
                  </TableCell>
                  <TableCell class="text-right">
                    <Button 
                      @click="showDetails(log)" 
                      variant="ghost" 
                      size="sm"
                    >
                      {{ t('admin.audit.view_details') }}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <!-- Pagination -->
          <div v-if="logs?.pages > 1" class="p-4 border-t">
            <div class="flex items-center justify-between">
              <p class="text-sm text-gray-600">
                {{ t('common.showing') }} {{ (filters.page - 1) * filters.limit + 1 }} - 
                {{ Math.min(filters.page * filters.limit, logs.total) }} {{ t('common.of') }} 
                {{ logs.total }}
              </p>
              <div class="flex gap-2">
                <Button
                  @click="previousPage"
                  :disabled="filters.page === 1"
                  variant="outline"
                  size="sm"
                >
                  {{ t('common.previous') }}
                </Button>
                <Button
                  @click="nextPage"
                  :disabled="filters.page === logs.pages"
                  variant="outline"
                  size="sm"
                >
                  {{ t('common.next') }}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    <!-- Details Dialog -->
    <Dialog v-model:open="showDetailsDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t('admin.audit.details') }}</DialogTitle>
        </DialogHeader>
        <div v-if="selectedLog" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>{{ t('admin.audit.date') }}</Label>
              <p class="text-sm">{{ formatDateTime(selectedLog.created_at) }}</p>
            </div>
            <div>
              <Label>{{ t('admin.audit.user') }}</Label>
              <p class="text-sm">{{ selectedLog.user?.email || '-' }}</p>
            </div>
            <div>
              <Label>{{ t('admin.audit.action') }}</Label>
              <p class="text-sm">{{ getActionLabel(selectedLog.action) }}</p>
            </div>
            <div>
              <Label>{{ t('admin.audit.resource') }}</Label>
              <p class="text-sm">{{ getResourceLabel(selectedLog.resource_type) }}</p>
            </div>
          </div>
          
          <div v-if="selectedLog.details">
            <Label>{{ t('admin.audit.details') }}</Label>
            <pre class="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-64">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </div>
          
          <div v-if="selectedLog.user_agent">
            <Label>User Agent</Label>
            <p class="text-sm text-gray-600">{{ selectedLog.user_agent }}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { AlertCircle, Loader2, Download } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useAuditLogs } from '~/composables/useAuditLogs'
import type { AuditLog, AuditLogFilters } from '~/types/audit'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { loading, error, getAuditLogs, exportAuditLogs } = useAuditLogs()

const logs = ref<any>(null)
const selectedLog = ref<AuditLog | null>(null)
const showDetailsDialog = ref(false)

const filters = ref<AuditLogFilters>({
  page: 1,
  limit: 20,
  start_date: '',
  end_date: '',
  action: '',
  sort: 'created_at',
  order: 'DESC'
})

const actionLabels = computed(() => ({
  'auth.login': t('admin.audit.actions.auth.login'),
  'auth.logout': t('admin.audit.actions.auth.logout'),
  'auth.impersonate.start': t('admin.audit.actions.auth.impersonate.start'),
  'auth.impersonate.stop': t('admin.audit.actions.auth.impersonate.stop'),
  'user.created': t('admin.audit.actions.user.created'),
  'user.updated': t('admin.audit.actions.user.updated'),
  'user.deactivated': t('admin.audit.actions.user.deactivated'),
  'user.password_reset': t('admin.audit.actions.user.password_reset'),
  'tenant.created': t('admin.audit.actions.tenant.created'),
  'tenant.updated': t('admin.audit.actions.tenant.updated'),
  'tenant.deactivated': t('admin.audit.actions.tenant.deactivated'),
}))

const getActionLabel = (action: string) => {
  return actionLabels.value[action as keyof typeof actionLabels.value] || action
}

const getResourceLabel = (resourceType: string) => {
  const labels: Record<string, string> = {
    user: t('admin.audit.resource_types.user'),
    tenant: t('admin.audit.resource_types.tenant'),
  }
  return labels[resourceType] || resourceType
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchLogs = async () => {
  try {
    logs.value = await getAuditLogs(filters.value)
  } catch (e) {
    // Error is handled by the composable
  }
}

const updateFilters = () => {
  filters.value.page = 1
  // Handle "all" option
  if (filters.value.action === 'all') {
    filters.value.action = ''
  }
  updateQueryParams()
  fetchLogs()
}

const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 20,
    start_date: '',
    end_date: '',
    action: '',
    sort: 'created_at',
    order: 'DESC'
  }
  updateQueryParams()
  fetchLogs()
}

const previousPage = () => {
  if (filters.value.page > 1) {
    filters.value.page--
    updateQueryParams()
    fetchLogs()
  }
}

const nextPage = () => {
  if (logs.value && filters.value.page < logs.value.pages) {
    filters.value.page++
    updateQueryParams()
    fetchLogs()
  }
}

const showDetails = (log: AuditLog) => {
  selectedLog.value = log
  showDetailsDialog.value = true
}

const exportLogs = async () => {
  try {
    await exportAuditLogs(filters.value)
  } catch (e) {
    // Error is handled by the composable
  }
}

const updateQueryParams = () => {
  const query: Record<string, string> = {}
  
  if (filters.value.page > 1) query.page = filters.value.page.toString()
  if (filters.value.start_date) query.start_date = filters.value.start_date
  if (filters.value.end_date) query.end_date = filters.value.end_date
  if (filters.value.action) query.action = filters.value.action
  
  router.replace({ query })
}

const initializeFromQuery = () => {
  const query = route.query
  
  if (query.page) filters.value.page = parseInt(query.page as string)
  if (query.start_date) filters.value.start_date = query.start_date as string
  if (query.end_date) filters.value.end_date = query.end_date as string
  if (query.action) filters.value.action = query.action as string
}

onMounted(() => {
  initializeFromQuery()
  fetchLogs()
})

// Meta
useHead({
  title: t('admin.audit.title'),
})

definePageMeta({
  middleware: ['auth', 'super-admin'],
})
</script>