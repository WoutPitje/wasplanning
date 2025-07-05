<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Hero Section -->
      <div class="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {{ t('pricing.title') }}
        </h1>
        <p class="mt-4 text-lg text-muted-foreground">
          {{ t('pricing.subtitle') }}
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="flex justify-center mb-12">
        <div class="bg-muted p-1 rounded-lg flex">
          <button
            @click="billingPeriod = 'monthly'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              billingPeriod === 'monthly'
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ t('pricing.monthly') }}
          </button>
          <button
            @click="billingPeriod = 'yearly'"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors relative',
              billingPeriod === 'yearly'
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            ]"
          >
            {{ t('pricing.yearly') }}
            <Badge class="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
              {{ t('pricing.save10') }}
            </Badge>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p class="mt-2 text-muted-foreground">{{ t('common.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <Card class="max-w-md mx-auto">
          <CardContent class="p-6">
            <p class="text-destructive mb-4">{{ error }}</p>
            <Button @click="loadPlans" variant="outline">
              {{ t('common.tryAgain') }}
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Pricing Cards -->
      <div v-else class="grid gap-6 sm:gap-8 lg:grid-cols-3">
        <Card
          v-for="plan in plans"
          :key="plan.id"
          :class="[
            'relative hover:shadow-lg transition-all duration-300',
            plan.name === 'GROEI' ? 'border-2 border-primary scale-105' : ''
          ]"
        >
          <!-- Popular Badge -->
          <div v-if="plan.name === 'GROEI'" class="absolute -top-4 left-0 right-0 flex justify-center">
            <Badge class="px-4 py-1">
              {{ t('pricing.popular') }}
            </Badge>
          </div>

          <CardHeader :class="plan.name === 'GROEI' ? 'pb-8 pt-8' : 'pb-8'">
            <CardTitle class="text-2xl">{{ plan.displayName }}</CardTitle>
            
            <!-- Price -->
            <div class="mt-4">
              <span class="text-4xl font-bold">
                {{ formatPrice(billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12) }}
              </span>
              <span class="text-muted-foreground">{{ t('pricing.perMonth') }}</span>
            </div>

            <!-- Yearly Savings -->
            <div v-if="billingPeriod === 'yearly'" class="mt-2">
              <span class="text-green-600 text-sm font-medium">
                {{ t('pricing.saveYearly', { amount: formatPrice(calculateYearlySavings(plan.priceMonthly, plan.priceYearly)) }) }}
              </span>
            </div>
          </CardHeader>
          
          <CardContent>

            <!-- Limits -->
            <div class="space-y-3 mb-8">
              <div v-if="plan.maxCarsPerMonth" class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">
                  {{ t('pricing.maxCars', { count: plan.maxCarsPerMonth.toLocaleString() }) }}
                </span>
              </div>
              <div v-else class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">{{ t('pricing.unlimitedCars') }}</span>
              </div>

              <div v-if="plan.maxUsers" class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">
                  {{ t('pricing.maxUsers', { count: plan.maxUsers }) }}
                </span>
              </div>
              <div v-else class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">{{ t('pricing.unlimitedUsers') }}</span>
              </div>

              <div v-if="plan.maxLocations" class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">
                  {{ t('pricing.maxLocations', { count: plan.maxLocations }) }}
                </span>
              </div>
              <div v-else class="flex items-center">
                <Check class="h-4 w-4 text-primary mr-2" />
                <span class="text-sm">{{ t('pricing.unlimitedLocations') }}</span>
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-2 mb-8">
              <div v-for="(enabled, feature) in plan.features" :key="feature">
                <div v-if="enabled" class="flex items-center">
                  <Check class="h-4 w-4 text-primary mr-2" />
                  <span class="text-sm text-muted-foreground">{{ t(`pricing.features.${feature}`) }}</span>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <Button 
              :class="plan.name === 'GROEI' ? '' : 'variant-outline'"
              :variant="plan.name === 'GROEI' ? 'default' : 'outline'"
              class="w-full"
              asChild
            >
              <NuxtLink to="/login">
                {{ t('pricing.startTrial') }}
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- FAQ Section -->
      <div class="mt-20">
        <div class="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
            {{ t('pricing.faq.title') }}
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card v-for="(faq, index) in faqs" :key="index" class="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle class="text-lg">{{ faq.question }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">{{ faq.answer }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { SubscriptionPlan } from '~/types/subscriptions'

// Page meta
definePageMeta({
  layout: 'default'
})

// i18n
const { t } = useI18n()

// SEO
useSeoMeta({
  title: computed(() => t('pricing.seoTitle')),
  description: computed(() => t('pricing.seoDescription')),
})

// Reactive state
const billingPeriod = ref<'monthly' | 'yearly'>('monthly')
const plans = ref<SubscriptionPlan[]>([])

// Composables
const { loading, error, getPlans, formatPrice, calculateYearlySavings } = useSubscriptions()

// Load plans on mount
const loadPlans = async () => {
  try {
    plans.value = await getPlans()
  } catch (err) {
    console.error('Failed to load subscription plans:', err)
  }
}

// FAQ data
const faqs = computed(() => [
  {
    question: t('pricing.faq.trial.question'),
    answer: t('pricing.faq.trial.answer'),
  },
  {
    question: t('pricing.faq.cancel.question'),
    answer: t('pricing.faq.cancel.answer'),
  },
  {
    question: t('pricing.faq.support.question'),
    answer: t('pricing.faq.support.answer'),
  },
  {
    question: t('pricing.faq.upgrade.question'),
    answer: t('pricing.faq.upgrade.answer'),
  },
])

// Load plans on mount (SSR)
await loadPlans()
</script>