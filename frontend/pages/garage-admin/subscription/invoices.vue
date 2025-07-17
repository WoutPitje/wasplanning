<template>
  <div class="container max-w-4xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <Button variant="ghost" size="sm" class="mb-4" @click="$router.back()">
        <ChevronLeft class="h-4 w-4 mr-2" />
        {{ t('common.back') }}
      </Button>
      
      <h1 class="text-3xl font-bold mb-2">{{ t('subscription.invoices.title') }}</h1>
      <p class="text-muted-foreground">{{ t('subscription.invoices.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-20 bg-muted rounded-lg animate-pulse" />
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertTitle>{{ t('common.error') }}</AlertTitle>
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Empty State -->
    <Card v-else-if="invoices.length === 0">
      <CardContent class="flex flex-col items-center justify-center py-12">
        <FileText class="h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">{{ t('subscription.invoices.empty.title') }}</h3>
        <p class="text-muted-foreground text-center">{{ t('subscription.invoices.empty.description') }}</p>
      </CardContent>
    </Card>

    <!-- Invoices List -->
    <div v-else class="space-y-4">
      <!-- Summary Card -->
      
      <!-- Invoices Table -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>{{ t('subscription.invoices.history') }}</CardTitle>
            <Select v-model="filterYear">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('subscription.invoices.allYears') }}</SelectItem>
                <SelectItem v-for="year in availableYears" :key="year" :value="year">
                  {{ year }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div
              v-for="invoice in filteredInvoices"
              :key="invoice.id"
              class="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-full bg-primary/10">
                  <Receipt class="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p class="font-medium">{{ formatInvoiceNumber(invoice.number || invoice.id) }}</p>
                  <p class="text-sm text-muted-foreground">{{ formatDate(invoice.date) }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="font-medium">{{ formatPrice(invoice.amount) }}</p>
                  <Badge :variant="getStatusVariant(invoice.status)" class="text-xs">
                    {{ t(`subscription.invoices.status.${invoice.status}`) }}
                  </Badge>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="downloadInvoice(invoice)">
                      <Download class="h-4 w-4 mr-2" />
                      {{ t('subscription.invoices.download') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="viewInvoice(invoice)">
                      <Eye class="h-4 w-4 mr-2" />
                      {{ t('subscription.invoices.view') }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center">
        <Pagination
          v-model:page="currentPage"
          :total="totalPages"
          :sibling-count="1"
          show-edges
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Pagination } from '~/components/ui/pagination'
import { 
  ChevronLeft, 
  AlertCircle, 
  FileText, 
  Receipt,
  MoreVertical,
  Download,
  Eye
} from 'lucide-vue-next'

interface Invoice {
  id: string
  number?: string
  date: string
  amount: number
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  pdf_url?: string
}

const { t } = useI18n()
const config = useRuntimeConfig()
const { getInvoices } = useSubscriptions()

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

// State
const invoices = ref<Invoice[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const filterYear = ref('all')
const currentPage = ref(1)
const itemsPerPage = 10
const hasMore = ref(false)
const lastInvoiceId = ref<string | null>(null)

// Load invoices from API
const loadInvoices = async (loadMore = false) => {
  try {
    if (!loadMore) {
      loading.value = true
      invoices.value = []
    }
    error.value = null
    
    const params: { limit?: number; starting_after?: string } = {
      limit: 50
    }
    if (loadMore && lastInvoiceId.value) {
      params.starting_after = lastInvoiceId.value
    }
    
    const response = await getInvoices(params)
    
    if (response && response.invoices) {
      if (loadMore) {
        invoices.value.push(...response.invoices)
      } else {
        invoices.value = response.invoices
      }
      hasMore.value = response.has_more || false
      if (response.invoices.length > 0) {
        lastInvoiceId.value = response.invoices[response.invoices.length - 1].id
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load invoices'
  } finally {
    loading.value = false
  }
}

// Computed
const totalPaid = computed(() => {
  return invoices.value
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0)
})

const averageMonthly = computed(() => {
  const paidInvoices = invoices.value.filter(inv => inv.status === 'paid')
  if (paidInvoices.length === 0) return 0
  return Math.round(totalPaid.value / paidInvoices.length)
})

const availableYears = computed(() => {
  const years = new Set<string>()
  invoices.value.forEach(invoice => {
    years.add(new Date(invoice.date).getFullYear().toString())
  })
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))
})

const filteredInvoices = computed(() => {
  let filtered = invoices.value
  
  if (filterYear.value !== 'all') {
    filtered = filtered.filter(invoice => {
      const year = new Date(invoice.date).getFullYear().toString()
      return year === filterYear.value
    })
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Paginate
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = invoices.value
  
  if (filterYear.value !== 'all') {
    filtered = filtered.filter(invoice => {
      const year = new Date(invoice.date).getFullYear().toString()
      return year === filterYear.value
    })
  }
  
  return Math.ceil(filtered.length / itemsPerPage)
})

// Methods
const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatInvoiceNumber = (number: string) => {
  if (number) return number
  // If no invoice number, generate one from ID
  return t('subscription.invoices.invoice') + ' #' + (number ? number.slice(-6) : 'DRAFT')
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    open: 'secondary',
    void: 'outline',
    uncollectible: 'destructive',
    draft: 'outline'
  }
  return variants[status] || 'default'
}

const downloadInvoice = async (invoice: Invoice) => {
  if (invoice.pdf_url) {
    window.open(invoice.pdf_url, '_blank')
  } else {
    alert(t('subscription.invoices.downloadNotAvailable'))
  }
}

const viewInvoice = (invoice: Invoice) => {
  // View invoice online via Stripe's hosted page
  if (invoice.pdf_url) {
    window.open(invoice.pdf_url, '_blank')
  } else {
    alert(t('subscription.invoices.viewNotAvailable'))
  }
}

// Lifecycle
onMounted(() => {
  loadInvoices()
})
</script>