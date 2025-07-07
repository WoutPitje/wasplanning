<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1">
        <h2 class="text-2xl font-bold leading-8 text-foreground sm:text-3xl">{{ t('subscription.title') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('subscription.description') }}</p>
      </div>
      <div v-if="currentSubscription && !currentSubscription.cancelAtPeriodEnd" class="mt-4 flex md:ml-4 md:mt-0">
        <Button
          @click="showCancelDialog = true"
          variant="destructive"
          size="sm"
        >
          <XCircle class="h-4 w-4 mr-2" />
          {{ t('subscription.cancelSubscription') }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-muted-foreground">{{ t('common.loading') }}</p>
    </div>

    <!-- Current Subscription -->
    <div v-else-if="currentSubscription" class="space-y-6">
      <!-- Subscription Overview -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.current.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.current.description') }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Plan Info -->
            <div class="border rounded-lg p-4 bg-primary/5 border-primary/20">
              <h3 class="font-semibold text-foreground">{{ currentSubscription.plan.displayName }}</h3>
              <p class="text-2xl font-bold text-foreground mt-1">
                {{ formatPrice(currentSubscription.billingInterval === 'month' 
                  ? currentSubscription.plan.priceMonthly 
                  : currentSubscription.plan.priceYearly / 12) }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ t(`subscription.billing.${currentSubscription.billingInterval}`) }}
              </p>
            </div>

            <!-- Status -->
            <div class="border rounded-lg p-4">
              <h3 class="font-semibold text-foreground">{{ t('subscription.status.title') }}</h3>
              <div class="mt-1">
                <Badge :variant="getStatusVariant(currentSubscription.status)">
                  {{ t(`subscription.status.${currentSubscription.status}`) }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground mt-1">
                {{ t('subscription.renewsOn') }}: {{ formatDate(currentSubscription.currentPeriodEnd) }}
              </p>
              <!-- Pay Now Button for Overdue Subscriptions -->
              <div v-if="currentSubscription.status === 'past_due'" class="mt-3">
                <Button @click="payOverdueSubscription" size="sm" class="w-full">
                  <CreditCard class="h-4 w-4 mr-2" />
                  {{ t('subscription.payNow') }}
                </Button>
              </div>
            </div>

            <!-- Credit Balance -->
            <div v-if="currentSubscription.creditBalance > 0" class="border rounded-lg p-4 bg-green-50 border-green-200">
              <h3 class="font-semibold text-green-900">{{ t('subscription.credit.title') }}</h3>
              <p class="text-2xl font-bold text-green-900 mt-1">
                {{ formatPrice(currentSubscription.creditBalance) }}
              </p>
              <p class="text-sm text-green-700 mt-1">
                {{ t('subscription.credit.description') }}
              </p>
              <Button @click="showCreditHistory = true" variant="outline" size="sm" class="mt-2">
                {{ t('subscription.credit.viewHistory') }}
              </Button>
            </div>

            <!-- Trial Info -->
            <div v-else-if="currentSubscription.trialEnd" class="border rounded-lg p-4 bg-green-50 border-green-200">
              <h3 class="font-semibold text-green-900">{{ t('subscription.trial.title') }}</h3>
              <p class="text-sm text-green-700 mt-1">
                {{ t('subscription.trial.endsOn') }}: {{ formatDate(currentSubscription.trialEnd) }}
              </p>
            </div>
          </div>

          <!-- Cancellation Notice -->
          <div v-if="currentSubscription.cancelAtPeriodEnd" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <AlertTriangle class="h-5 w-5 text-yellow-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">
                  {{ t('subscription.cancellation.title') }}
                </h3>
                <p class="mt-1 text-sm text-yellow-700">
                  {{ t('subscription.cancellation.message', { date: formatDate(currentSubscription.currentPeriodEnd) }) }}
                </p>
                <div class="mt-4">
                  <Button @click="reactivateSubscription" size="sm" variant="outline">
                    {{ t('subscription.reactivate') }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Usage Overview -->
      <Card v-if="usageData">
        <CardHeader>
          <CardTitle>{{ t('subscription.usage.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.usage.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Cars Washed -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-foreground">{{ t('subscription.usage.cars') }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ usageData.usage.cars_washed }}
                  <span v-if="usageData.limits.cars.limit">/ {{ usageData.limits.cars.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.cars.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.cars.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.cars.percentage, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Active Users -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-foreground">{{ t('subscription.usage.users') }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ usageData.usage.active_users }}
                  <span v-if="usageData.limits.users.limit">/ {{ usageData.limits.users.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.users.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.users.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.users.percentage, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Active Locations -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-foreground">{{ t('subscription.usage.locations') }}</span>
                <span class="text-sm text-muted-foreground">
                  {{ usageData.usage.active_locations }}
                  <span v-if="usageData.limits.locations.limit">/ {{ usageData.limits.locations.limit }}</span>
                </span>
              </div>
              <div class="w-full bg-secondary rounded-full h-2">
                <div 
                  :class="[
                    'h-2 rounded-full transition-all',
                    getUsageWarningLevel(usageData.limits.locations.percentage) === 'error' ? 'bg-red-500' :
                    getUsageWarningLevel(usageData.limits.locations.percentage) === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  ]"
                  :style="{ width: `${Math.min(usageData.limits.locations.percentage, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Usage Warnings -->
          <div v-if="usageData.warnings.warning || usageData.warnings.critical" class="mt-4">
            <div :class="[
              'border rounded-lg p-4',
              usageData.warnings.critical ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
            ]">
              <div class="flex">
                <AlertTriangle :class="[
                  'h-5 w-5',
                  usageData.warnings.critical ? 'text-red-400' : 'text-yellow-400'
                ]" />
                <div class="ml-3">
                  <h3 :class="[
                    'text-sm font-medium',
                    usageData.warnings.critical ? 'text-red-800' : 'text-yellow-800'
                  ]">
                    {{ usageData.warnings.critical ? t('subscription.usage.limitExceeded') : t('subscription.usage.approachingLimit') }}
                  </h3>
                  <ul :class="[
                    'mt-1 text-sm list-disc list-inside space-y-1',
                    usageData.warnings.critical ? 'text-red-700' : 'text-yellow-700'
                  ]">
                    <li v-for="message in usageData.warnings.messages" :key="message">
                      {{ message }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Payment History -->
     

      <!-- Available Plans -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.changePlan.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.changePlan.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="plan in availablePlans"
              :key="plan.id"
              :class="[
                'border rounded-lg p-4 cursor-pointer transition-all',
                plan.id === currentSubscription.planId 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:border-foreground/20 hover:shadow-sm'
              ]"
              @click="plan.id !== currentSubscription.planId && selectPlan(plan)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-foreground">{{ plan.displayName }}</h3>
                  <p class="text-2xl font-bold text-foreground mt-1">
                    {{ formatPrice(plan.priceMonthly) }}
                  </p>
                  <p class="text-sm text-muted-foreground">{{ t('pricing.perMonth') }}</p>
                </div>
                <div v-if="plan.id === currentSubscription.planId">
                  <Badge variant="default">{{ t('subscription.current.badge') }}</Badge>
                </div>
              </div>
              
              <div class="mt-4 space-y-2">
                <div class="text-sm text-muted-foreground">
                  <div v-if="plan.maxCarsPerMonth">
                    {{ t('pricing.maxCars', { count: plan.maxCarsPerMonth.toLocaleString() }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedCars') }}</div>
                  
                  <div v-if="plan.maxUsers">
                    {{ t('pricing.maxUsers', { count: plan.maxUsers }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedUsers') }}</div>
                  
                  <div v-if="plan.maxLocations">
                    {{ t('pricing.maxLocations', { count: plan.maxLocations }) }}
                  </div>
                  <div v-else>{{ t('pricing.unlimitedLocations') }}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-if="currentSubscription">
        <CardHeader>
          <CardTitle>{{ t('subscription.paymentHistory.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.paymentHistory.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="showPaymentHistory = true" variant="outline">
            <CreditCard class="h-4 w-4 mr-2" />
            {{ t('subscription.paymentHistory.viewHistory') }}
          </Button>
        </CardContent>
      </Card>

    <!-- No Subscription State -->
    <div v-else class="space-y-6">
      <!-- Welcome Card -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.noSubscription.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.noSubscription.description') }}</CardDescription>
        </CardHeader>
      </Card>

      <!-- Available Plans -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('subscription.selectPlan.title') }}</CardTitle>
          <CardDescription>{{ t('subscription.selectPlan.description') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Billing Period Toggle -->
          <div class="flex justify-center mb-6">
            <div class="bg-muted p-1 rounded-lg inline-flex">
              <button
                @click="billingType = 'monthly'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  billingType === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                {{ t('subscription.billing.monthly') }}
              </button>
              <button
                @click="billingType = 'yearly'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  billingType === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]"
              >
                {{ t('subscription.billing.yearly') }}
                <Badge variant="secondary" class="ml-2">{{ t('subscription.billing.savePercent') }}</Badge>
              </button>
            </div>
          </div>

          <!-- Plans Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="plan in availablePlans"
              :key="plan.id"
              :class="[
                'border rounded-lg p-6 transition-all cursor-pointer',
                plan.name === 'SCALE' ? 'border-primary shadow-sm' : 'hover:shadow-sm'
              ]"
              @click="selectPlanForPurchase(plan)"
            >
              <div class="text-center">
                <h3 class="text-xl font-semibold text-foreground">{{ plan.displayName }}</h3>
                <div class="mt-4">
                  <span class="text-4xl font-bold text-foreground">
                    {{ formatPrice(billingType === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12) }}
                  </span>
                  <span class="text-muted-foreground">{{ t('pricing.perMonth') }}</span>
                </div>
                <p v-if="billingType === 'yearly'" class="text-sm text-green-600 mt-1">
                  {{ t('subscription.billing.yearlyTotal', { price: formatPrice(plan.priceYearly) }) }}
                </p>
              </div>
              
              <div class="mt-6 space-y-3">
                <div class="text-sm text-muted-foreground">
                  <div v-if="plan.maxCarsPerMonth" class="flex items-center">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.maxCars', { count: plan.maxCarsPerMonth.toLocaleString() }) }}
                  </div>
                  <div v-else class="flex items-center">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.unlimitedCars') }}
                  </div>
                  
                  <div v-if="plan.maxUsers" class="flex items-center mt-2">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.maxUsers', { count: plan.maxUsers }) }}
                  </div>
                  <div v-else class="flex items-center mt-2">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.unlimitedUsers') }}
                  </div>
                  
                  <div v-if="plan.maxLocations" class="flex items-center mt-2">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.maxLocations', { count: plan.maxLocations }) }}
                  </div>
                  <div v-else class="flex items-center mt-2">
                    <CheckCircle2 class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {{ t('pricing.unlimitedLocations') }}
                  </div>
                </div>
              </div>

              <div class="mt-6">
                <Button class="w-full" :variant="plan.name === 'SCALE' ? 'default' : 'outline'">
                  {{ t('subscription.selectPlan.button') }}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Cancel Subscription Dialog -->
    <Dialog v-model:open="showCancelDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('subscription.cancel.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.cancel.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-800">
              {{ t('subscription.cancel.warning', { date: formatDate(currentSubscription?.currentPeriodEnd) }) }}
            </p>
          </div>
          
          <div class="space-y-2">
            <label class="flex items-center space-x-2">
              <input
                v-model="cancelImmediately"
                type="checkbox"
                class="rounded border-input text-primary focus:ring-primary"
              />
              <span class="text-sm text-foreground">
                {{ t('subscription.cancel.immediately') }}
              </span>
            </label>
            <p class="text-xs text-muted-foreground ml-6">
              {{ t('subscription.cancel.immediatelyWarning') }}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showCancelDialog = false" variant="outline">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="confirmCancellation" variant="destructive">
            {{ t('subscription.cancel.confirm') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Plan Change Dialog -->
    <Dialog v-model:open="showPlanChangeDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('subscription.changePlan.confirm.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.changePlan.confirm.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedPlan" class="space-y-4">
          <!-- Plan Info -->
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-foreground">{{ selectedPlan.displayName }}</h3>
                <p class="text-muted-foreground">
                  {{ formatPrice(selectedBillingType === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly / 12) }} 
                  {{ t('pricing.perMonth') }}
                </p>
                <p v-if="selectedBillingType === 'yearly'" class="text-sm text-green-600 mt-1">
                  {{ t('subscription.billing.yearlyTotal', { price: formatPrice(selectedPlan.priceYearly) }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Billing Period Toggle -->
          <div class="space-y-2">
            <label class="text-sm font-medium text-foreground">{{ t('subscription.billing.interval') }}</label>
            <div class="flex justify-center">
              <div class="bg-muted p-1 rounded-lg inline-flex">
                <button
                  @click="updateBillingType('monthly')"
                  :class="[
                    'px-4 py-2 rounded-md text-sm font-medium transition-all',
                    selectedBillingType === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                >
                  {{ t('subscription.billing.monthly') }}
                </button>
                <button
                  @click="updateBillingType('yearly')"
                  :class="[
                    'px-4 py-2 rounded-md text-sm font-medium transition-all',
                    selectedBillingType === 'yearly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  ]"
                >
                  {{ t('subscription.billing.yearly') }}
                  <Badge variant="secondary" class="ml-2">{{ t('subscription.billing.savePercent') }}</Badge>
                </button>
              </div>
            </div>
          </div>

          <!-- Loading Preview -->
          <div v-if="loadingPreview" class="text-center py-4">
            <Loader2 class="h-6 w-6 animate-spin mx-auto" />
            <p class="text-sm text-muted-foreground mt-2">{{ t('subscription.changePlan.calculatingCosts') }}</p>
          </div>

          <!-- Cost Breakdown -->
          <div v-else-if="planPreview" class="space-y-4">
            <!-- Credit Info -->
            <div v-if="planPreview.creditBreakdown.currentBalance > 0" class="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 class="text-sm font-medium text-green-900 mb-2">{{ t('subscription.credit.breakdown') }}</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between text-green-800">
                  <span>{{ t('subscription.credit.current') }}:</span>
                  <span>{{ formatPrice(planPreview.creditBreakdown.currentBalance) }}</span>
                </div>
                <div v-if="planPreview.creditBreakdown.willBeUsed > 0" class="flex justify-between text-green-800">
                  <span>{{ t('subscription.credit.willBeUsed') }}:</span>
                  <span>-{{ formatPrice(planPreview.creditBreakdown.willBeUsed) }}</span>
                </div>
                <div class="flex justify-between text-green-800 border-t border-green-300 pt-1 font-medium">
                  <span>{{ t('subscription.credit.remaining') }}:</span>
                  <span>{{ formatPrice(planPreview.creditBreakdown.willRemain) }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Amount -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-blue-900">{{ t('subscription.changePlan.paymentRequired') }}:</span>
                <span class="text-lg font-bold text-blue-900">
                  {{ planPreview.creditBreakdown.additionalPayment > 0 ? formatPrice(planPreview.creditBreakdown.additionalPayment) : t('subscription.changePlan.noPayment') }}
                </span>
              </div>
              <p v-if="planPreview.proration.description" class="text-xs text-blue-700 mt-1">
                {{ planPreview.proration.description }}
              </p>
            </div>
          </div>
          
          <p class="text-sm text-muted-foreground">
            {{ t('subscription.changePlan.confirm.effective') }}
          </p>
        </div>

        <DialogFooter>
          <Button @click="showPlanChangeDialog = false" variant="outline" :disabled="isProcessingPayment">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="confirmPlanChange" :disabled="isProcessingPayment || loadingPreview">
            <Loader2 v-if="isProcessingPayment" class="h-4 w-4 mr-2 animate-spin" />
            {{ t('subscription.changePlan.confirm.button') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Purchase Plan Dialog -->
    <Dialog v-model:open="showPurchaseDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ t('subscription.purchase.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.purchase.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedPlan" class="space-y-4">
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div class="space-y-2">
              <h3 class="font-semibold text-foreground">{{ selectedPlan.displayName }}</h3>
              <div>
                <p class="text-2xl font-bold text-foreground">
                  {{ formatPrice(billingType === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly / 12) }}
                  <span class="text-sm font-normal text-muted-foreground">{{ t('pricing.perMonth') }}</span>
                </p>
                <p v-if="billingType === 'yearly'" class="text-sm text-muted-foreground mt-1">
                  {{ t('subscription.billing.yearlyTotal', { price: formatPrice(selectedPlan.priceYearly) }) }}
                </p>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertCircle class="h-4 w-4" />
            <AlertDescription>
              {{ t('subscription.purchase.redirectNotice') }}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button @click="showPurchaseDialog = false" variant="outline" :disabled="isProcessingPayment">
            {{ t('common.cancel') }}
          </Button>
          <Button @click="confirmPlanPurchase" :disabled="isProcessingPayment">
            <Loader2 v-if="isProcessingPayment" class="h-4 w-4 mr-2 animate-spin" />
            {{ t('subscription.purchase.button') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Credit History Dialog -->
    <Dialog v-model:open="showCreditHistory">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ t('subscription.credit.history.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.credit.history.description') }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <!-- Current Balance -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-green-900">{{ t('subscription.credit.currentBalance') }}:</span>
              <span class="text-xl font-bold text-green-900">
                {{ formatPrice(creditHistory?.currentBalance || 0) }}
              </span>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loadingCreditHistory" class="text-center py-4">
            <Loader2 class="h-6 w-6 animate-spin mx-auto" />
            <p class="text-sm text-muted-foreground mt-2">{{ t('subscription.credit.loadingHistory') }}</p>
          </div>

          <!-- Transaction History -->
          <div v-else-if="creditHistory?.transactions?.length" class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="(transaction, index) in creditHistory.transactions"
              :key="index"
              :class="[
                'border rounded-lg p-3',
                transaction.type === 'earned' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
              ]"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <p :class="[
                    'text-sm font-medium',
                    transaction.type === 'earned' ? 'text-green-900' : 'text-blue-900'
                  ]">
                    {{ transaction.description }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ formatDate(transaction.date) }}
                  </p>
                </div>
                <div :class="[
                  'text-right',
                  transaction.type === 'earned' ? 'text-green-900' : 'text-blue-900'
                ]">
                  <p class="font-bold">
                    {{ transaction.type === 'earned' ? '+' : '-' }}{{ formatPrice(transaction.amount) }}
                  </p>
                  <p class="text-xs">
                    {{ t(`subscription.credit.${transaction.type}`) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- No History -->
          <div v-else class="text-center py-6">
            <p class="text-muted-foreground">{{ t('subscription.credit.noHistory') }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showCreditHistory = false" variant="outline">
            {{ t('common.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Payment History Dialog -->
    <Dialog v-model:open="showPaymentHistory">
      <DialogContent class="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{{ t('subscription.paymentHistory.title') }}</DialogTitle>
          <DialogDescription>
            {{ t('subscription.paymentHistory.allTransactions') }}
          </DialogDescription>
        </DialogHeader>
        
        <div class="space-y-4">
          <!-- Loading -->
          <div v-if="loadingPaymentHistory" class="text-center py-8">
            <Loader2 class="h-8 w-8 animate-spin mx-auto" />
            <p class="text-sm text-muted-foreground mt-2">{{ t('subscription.paymentHistory.loading') }}</p>
          </div>

          <!-- Transaction List -->
          <div v-else-if="paymentHistory?.length" class="relative overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th scope="col" class="px-4 py-3">{{ t('subscription.paymentHistory.date') }}</th>
                  <th scope="col" class="px-4 py-3">{{ t('subscription.paymentHistory.descriptionColumn') }}</th>
                  <th scope="col" class="px-4 py-3">{{ t('subscription.paymentHistory.type') }}</th>
                  <th scope="col" class="px-4 py-3">{{ t('subscription.paymentHistory.status') }}</th>
                  <th scope="col" class="px-4 py-3 text-right">{{ t('subscription.paymentHistory.amount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in paymentHistory" :key="transaction.id" class="bg-background border-b hover:bg-muted/50">
                  <td class="px-4 py-3 whitespace-nowrap">
                    {{ formatDate(transaction.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ transaction.description }}
                  </td>
                  <td class="px-4 py-3">
                    <Badge :variant="getTransactionTypeVariant(transaction.type)">
                      {{ t(`subscription.paymentHistory.types.${transaction.type.toLowerCase()}`) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Badge :variant="getTransactionStatusVariant(transaction.status)">
                      {{ t(`subscription.paymentHistory.statuses.${transaction.status.toLowerCase()}`) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-right font-medium">
                    <span :class="transaction.type === 'REFUND' ? 'text-green-600' : 'text-foreground'">
                      {{ transaction.type === 'REFUND' ? '+' : '' }}{{ formatPrice(transaction.amount) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- No History -->
          <div v-else class="text-center py-12">
            <CreditCard class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p class="text-muted-foreground">{{ t('subscription.paymentHistory.noHistory') }}</p>
          </div>
        </div>

        <DialogFooter>
          <Button @click="showPaymentHistory = false" variant="outline">
            {{ t('common.close') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle2, AlertCircle, Loader2, XCircle, CreditCard } from 'lucide-vue-next'
import type { SubscriptionPlan, Subscription, UsageData } from '~/types/subscriptions'

// Auth middleware
definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

// i18n
const { t } = useI18n()

// Reactive state
const currentSubscription = ref<Subscription | null>(null)
const availablePlans = ref<SubscriptionPlan[]>([])
const usageData = ref<UsageData | null>(null)
const showCancelDialog = ref(false)
const showPlanChangeDialog = ref(false)
const showPurchaseDialog = ref(false)
const showCreditHistory = ref(false)
const showPaymentHistory = ref(false)
const cancelImmediately = ref(false)
const selectedPlan = ref<SubscriptionPlan | null>(null)
const billingType = ref<'monthly' | 'yearly'>('monthly')
const isProcessingPayment = ref(false)
const loadingPreview = ref(false)
const loadingCreditHistory = ref(false)
const loadingPaymentHistory = ref(false)
const planPreview = ref<any>(null)
const creditHistory = ref<any>(null)
const paymentHistory = ref<any[]>([])
const selectedBillingType = ref<'monthly' | 'yearly'>('monthly')

// Composables
const {
  loading,
  error,
  getCurrentSubscription,
  getPlans,
  updateSubscription,
  cancelSubscription,
  getCurrentUsage,
  formatPrice,
  getUsageWarningLevel,
  createPaidSubscription,
  previewPlanChange,
  changePlan,
  getCreditBalance,
  getPaymentHistory,
} = useSubscriptions()

// SEO
useSeoMeta({
  title: computed(() => t('subscription.seoTitle')),
  description: computed(() => t('subscription.seoDescription')),
})

// Load data
const loadData = async () => {
  const [subscription, plans, usage] = await Promise.all([
    getCurrentSubscription(),
    getPlans(),
    getCurrentUsage(), // Usage might not be available without subscription
  ])
  
  currentSubscription.value = subscription
  availablePlans.value = plans || []
  if (usage) usageData.value = usage
}

// Utility functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'trialing': return 'secondary'
    case 'past_due': return 'destructive'
    case 'canceled': return 'secondary'
    case 'incomplete': return 'warning'
    default: return 'secondary'
  }
}

// Actions
const selectPlan = async (plan: SubscriptionPlan) => {
  selectedPlan.value = plan
  planPreview.value = null
  
  // Initialize selected billing type to current subscription's billing type
  if (currentSubscription.value) {
    selectedBillingType.value = currentSubscription.value.billingInterval === 'month' ? 'monthly' : 'yearly'
  }
  
  showPlanChangeDialog.value = true
  
  // Load cost preview
  if (currentSubscription.value) {
    loadingPreview.value = true
    const preview = await previewPlanChange(
      currentSubscription.value.id,
      plan,
      selectedBillingType.value
    )
    planPreview.value = preview
    loadingPreview.value = false
  }
}

const loadCreditHistory = async () => {
  loadingCreditHistory.value = true
  const history = await getCreditBalance()
  creditHistory.value = history
  loadingCreditHistory.value = false
}

const loadPaymentHistoryData = async () => {
  loadingPaymentHistory.value = true
  const history = await getPaymentHistory()
  paymentHistory.value = history || []
  loadingPaymentHistory.value = false
}

const updateBillingType = async (newBillingType: 'monthly' | 'yearly') => {
  selectedBillingType.value = newBillingType
  
  // Reload preview with new billing type
  if (selectedPlan.value && currentSubscription.value) {
    loadingPreview.value = true
    const preview = await previewPlanChange(
      currentSubscription.value.id,
      selectedPlan.value,
      newBillingType
    )
    planPreview.value = preview
    loadingPreview.value = false
  }
}

const selectPlanForPurchase = (plan: SubscriptionPlan) => {
  selectedPlan.value = plan
  showPurchaseDialog.value = true
}

const confirmPlanChange = async () => {
  if (!selectedPlan.value || !currentSubscription.value) return
  
  isProcessingPayment.value = true
  console.log('Changing plan to:', selectedPlan.value.name)
  
  const result = await changePlan(
    currentSubscription.value.id,
    selectedPlan.value,
    selectedBillingType.value
  )
  
  console.log('Change plan result:', result)
  
  if (result) {
    // Check if we got a checkout URL (payment required) or direct update
    if ('checkoutUrl' in result) {
      console.log('Redirecting to checkout URL:', result.checkoutUrl)
      // Redirect to Mollie for payment
      window.location.href = result.checkoutUrl
    } else {
      // Plan changed without payment (e.g., downgrade)
      showPlanChangeDialog.value = false
      await loadData() // Reload data
    }
  } else {
    // Error already handled in composable
    console.error('Failed to change plan - no result returned')
  }
  
  isProcessingPayment.value = false
}

const confirmPlanPurchase = async () => {
  if (!selectedPlan.value) return
  
  isProcessingPayment.value = true
  console.log('Creating paid subscription for plan:', selectedPlan.value.name)
  
  const result = await createPaidSubscription(
    selectedPlan.value,
    billingType.value
  )
  
  console.log('Create paid subscription result:', result)
  
  if (result) {
    console.log('Redirecting to checkout URL:', result.checkoutUrl)
    // Redirect to Mollie for payment
    window.location.href = result.checkoutUrl
  } else {
    // Error already handled in composable
    console.error('Failed to create subscription - no result returned')
  }
  
  isProcessingPayment.value = false
}

const confirmCancellation = async () => {
  if (!currentSubscription.value) return
  
  const result = await cancelSubscription(currentSubscription.value.id, cancelImmediately.value)
  
  if (result) {
    showCancelDialog.value = false
    await loadData() // Reload data
  } else {
    console.error('Failed to cancel subscription')
  }
}

const reactivateSubscription = async () => {
  if (!currentSubscription.value) return
  
  const result = await updateSubscription(currentSubscription.value.id, {
    cancelAtPeriodEnd: false,
  })
  
  if (result) {
    await loadData() // Reload data
  } else {
    console.error('Failed to reactivate subscription')
  }
}

const payOverdueSubscription = async () => {
  if (!currentSubscription.value) return
  
  try {
    isProcessingPayment.value = true
    
    // Create a payment for the current subscription
    const response = await $fetch(`/api/subscriptions/${currentSubscription.value.id}/pay-overdue`, {
      method: 'POST'
    })
    
    if (response.checkoutUrl) {
      // Redirect to Mollie payment page
      window.location.href = response.checkoutUrl
    }
  } catch (error) {
    console.error('Failed to initiate payment:', error)
    // TODO: Show error message to user
  } finally {
    isProcessingPayment.value = false
  }
}

const getTransactionTypeVariant = (type: string) => {
  switch (type) {
    case 'PAYMENT': return 'default'
    case 'REFUND': return 'success'
    case 'SUBSCRIPTION': return 'secondary'
    default: return 'secondary'
  }
}

const getTransactionStatusVariant = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'success'
    case 'PENDING': return 'secondary'
    case 'FAILED': return 'destructive'
    case 'CANCELED': return 'secondary'
    default: return 'secondary'
  }
}

// Watchers
watch(showCreditHistory, (isOpen) => {
  if (isOpen) {
    loadCreditHistory()
  }
})

watch(showPaymentHistory, (isOpen) => {
  if (isOpen) {
    loadPaymentHistoryData()
  }
})

// Load data on mount
await loadData()
</script>