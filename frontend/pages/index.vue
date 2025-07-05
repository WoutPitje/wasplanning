<template>
  <div class="min-h-screen bg-background">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3">
          <img src="/wasplanning-logo.png" alt="Wasplanning Logo" class="h-10 w-10 object-contain" />
          <span class="text-xl font-bold">
            {{ t('app.name') }}
          </span>
        </NuxtLink>
        
        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <a href="#features">{{ t('landing.nav.features') }}</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#pricing">{{ t('landing.nav.pricing') }}</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="#contact">{{ t('landing.nav.contact') }}</a>
          </Button>
          <LanguageSwitcher />
          <Button asChild>
            <NuxtLink to="/login">{{ t('common.login') }}</NuxtLink>
          </Button>
        </div>
        
        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <Button variant="ghost" size="icon" @click="mobileMenuOpen = !mobileMenuOpen">
            <Menu v-if="!mobileMenuOpen" class="h-6 w-6" />
            <X v-else class="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      <!-- Mobile Navigation -->
      <div v-if="mobileMenuOpen" class="md:hidden border-t">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-2">
          <a href="#features" 
             @click="mobileMenuOpen = false"
             class="block py-2 text-sm hover:text-primary transition-colors">
            {{ t('landing.nav.features') }}
          </a>
          <a href="#pricing" 
             @click="mobileMenuOpen = false"
             class="block py-2 text-sm hover:text-primary transition-colors">
            {{ t('landing.nav.pricing') }}
          </a>
          <a href="#contact" 
             @click="mobileMenuOpen = false"
             class="block py-2 text-sm hover:text-primary transition-colors">
            {{ t('landing.nav.contact') }}
          </a>
          <div class="pt-2 space-y-2">
            <LanguageSwitcher />
            <Button asChild class="w-full">
              <NuxtLink to="/login">{{ t('common.login') }}</NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div class="container mx-auto relative z-10 px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <Badge class="mb-4">
            {{ t('landing.hero.badge') }}
          </Badge>
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {{ t('landing.hero.title') }}
          </h1>
          <p class="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            {{ t('landing.hero.subtitle') }}
          </p>
          <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild class="w-full sm:w-auto">
              <NuxtLink to="/login" class="inline-flex items-center justify-center">
                {{ t('landing.hero.cta.start') }}
                <ArrowRight class="ml-2 h-4 w-4" />
              </NuxtLink>
            </Button>
            <Button size="lg" variant="outline" asChild class="w-full sm:w-auto">
              <a href="#demo" class="inline-flex items-center justify-center">
                {{ t('landing.hero.cta.demo') }}
                <PlayCircle class="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
      <!-- Background Pattern -->
      <div class="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950">
        <div class="absolute h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="relative py-16 bg-gray-900 text-white">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold">2500+</div>
            <div class="mt-2 text-sm sm:text-base opacity-90">{{ t('landing.stats.garages') }}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold">75%</div>
            <div class="mt-2 text-sm sm:text-base opacity-90">{{ t('landing.stats.timeSaved') }}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold">100%</div>
            <div class="mt-2 text-sm sm:text-base opacity-90">{{ t('landing.stats.certainty') }}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold">&lt;5min</div>
            <div class="mt-2 text-sm sm:text-base opacity-90">{{ t('landing.stats.orderTime') }}</div>
          </div>
        </div>
      </div>
      <!-- Decorative wave -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg class="w-full h-8 fill-background" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path d="M0,20 C300,40 900,0 1200,20 L1200,40 L0,40 Z"></path>
        </svg>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-16 sm:py-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {{ t('landing.features.title') }}
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            {{ t('landing.features.subtitle') }}
          </p>
        </div>
        
        <div class="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Feature 1: Real-time Tracking -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.realtime.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.realtime.description') }}
              </CardDescription>
            </CardHeader>
          </Card>

          <!-- Feature 2: Smart Assignment -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Users class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.smartAssignment.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.smartAssignment.description') }}
              </CardDescription>
            </CardHeader>
          </Card>

          <!-- Feature 3: Priority System -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.priority.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.priority.description') }}
              </CardDescription>
            </CardHeader>
          </Card>

          <!-- Feature 4: Multi-location -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.multiLocation.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.multiLocation.description') }}
              </CardDescription>
            </CardHeader>
          </Card>

          <!-- Feature 5: Reports -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BarChart3 class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.reports.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.reports.description') }}
              </CardDescription>
            </CardHeader>
          </Card>

          <!-- Feature 6: Mobile -->
          <Card class="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Smartphone class="h-6 w-6" />
              </div>
              <CardTitle>{{ t('landing.features.mobile.title') }}</CardTitle>
              <CardDescription>
                {{ t('landing.features.mobile.description') }}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 sm:py-24 bg-gray-50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {{ t('landing.howItWorks.title') }}
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            {{ t('landing.howItWorks.subtitle') }}
          </p>
        </div>

        <div class="mx-auto max-w-4xl">
          <div class="relative">
            <!-- Connection Line -->
            <div class="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-300 dark:bg-gray-700 hidden lg:block"></div>
            
            <!-- Steps -->
            <div class="space-y-8 sm:space-y-12">
              <!-- Step 1 -->
              <div class="relative flex gap-6 lg:gap-12">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span class="text-xl font-bold">1</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-2">{{ t('landing.howItWorks.step1.title') }}</h3>
                  <p class="text-muted-foreground">{{ t('landing.howItWorks.step1.description') }}</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="relative flex gap-6 lg:gap-12">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span class="text-xl font-bold">2</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-2">{{ t('landing.howItWorks.step2.title') }}</h3>
                  <p class="text-muted-foreground">{{ t('landing.howItWorks.step2.description') }}</p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="relative flex gap-6 lg:gap-12">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span class="text-xl font-bold">3</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-2">{{ t('landing.howItWorks.step3.title') }}</h3>
                  <p class="text-muted-foreground">{{ t('landing.howItWorks.step3.description') }}</p>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="relative flex gap-6 lg:gap-12">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span class="text-xl font-bold">4</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-semibold mb-2">{{ t('landing.howItWorks.step4.title') }}</h3>
                  <p class="text-muted-foreground">{{ t('landing.howItWorks.step4.description') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 sm:py-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center mb-12 sm:mb-16">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {{ t('landing.pricing.title') }}
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            {{ t('landing.pricing.subtitle') }}
          </p>
        </div>

        <div class="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <!-- Starter Plan -->
          <Card class="relative hover:shadow-lg transition-all duration-300">
            <CardHeader class="pb-8">
              <CardTitle class="text-2xl">{{ t('landing.pricing.starter.name') }}</CardTitle>
              <CardDescription>{{ t('landing.pricing.starter.description') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="mb-8">
                <span class="text-4xl font-bold">€49</span>
                <span class="text-muted-foreground">/{{ t('common.month') }}</span>
              </div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.starter.feature1') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.starter.feature2') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.starter.feature3') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.starter.feature4') }}</span>
                </li>
              </ul>
              <Button class="w-full" variant="outline">{{ t('landing.pricing.cta') }}</Button>
            </CardContent>
          </Card>

          <!-- Growth Plan -->
          <Card class="relative hover:shadow-lg transition-all duration-300 border-2 border-primary scale-105">
            <div class="absolute -top-4 left-0 right-0 flex justify-center">
              <Badge class="px-4 py-1">
                {{ t('landing.pricing.popular') }}
              </Badge>
            </div>
            <CardHeader class="pb-8 pt-8">
              <CardTitle class="text-2xl">{{ t('landing.pricing.growth.name') }}</CardTitle>
              <CardDescription>{{ t('landing.pricing.growth.description') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="mb-8">
                <span class="text-4xl font-bold">€149</span>
                <span class="text-muted-foreground">/{{ t('common.month') }}</span>
              </div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.growth.feature1') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.growth.feature2') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.growth.feature3') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.growth.feature4') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.growth.feature5') }}</span>
                </li>
              </ul>
              <Button class="w-full">
                {{ t('landing.pricing.cta') }}
              </Button>
            </CardContent>
          </Card>

          <!-- Enterprise Plan -->
          <Card class="relative">
            <CardHeader>
              <CardTitle class="text-2xl">{{ t('landing.pricing.enterprise.name') }}</CardTitle>
              <CardDescription>{{ t('landing.pricing.enterprise.description') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="mb-8">
                <span class="text-4xl font-bold">€299</span>
                <span class="text-muted-foreground">/{{ t('common.month') }}</span>
              </div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.enterprise.feature1') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.enterprise.feature2') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.enterprise.feature3') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.enterprise.feature4') }}</span>
                </li>
                <li class="flex items-center gap-2">
                  <Check class="h-4 w-4 text-primary" />
                  <span class="text-sm">{{ t('landing.pricing.enterprise.feature5') }}</span>
                </li>
              </ul>
              <Button class="w-full" variant="outline">{{ t('landing.pricing.contact') }}</Button>
            </CardContent>
          </Card>
        </div>

        <div class="mt-12 text-center">
          <p class="text-sm text-muted-foreground">
            {{ t('landing.pricing.benefits') }}
          </p>
        </div>
      </div>
    </section>

    <!-- ROI Calculator Section -->
    <section class="py-24 bg-muted/50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle class="text-2xl">{{ t('landing.roi.title') }}</CardTitle>
              <CardDescription>{{ t('landing.roi.subtitle') }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid gap-8 md:grid-cols-2">
                <div>
                  <h4 class="font-semibold mb-4">{{ t('landing.roi.small.title') }}</h4>
                  <ul class="space-y-2 text-sm">
                    <li>{{ t('landing.roi.small.current') }}: 50 {{ t('common.hours') }}/{{ t('common.month') }}</li>
                    <li>{{ t('landing.roi.small.withSystem') }}: 10 {{ t('common.hours') }}/{{ t('common.month') }}</li>
                    <li class="font-semibold text-primary">{{ t('landing.roi.small.savings') }}: €1.351/{{ t('common.month') }}</li>
                  </ul>
                </div>
                <div>
                  <h4 class="font-semibold mb-4">{{ t('landing.roi.medium.title') }}</h4>
                  <ul class="space-y-2 text-sm">
                    <li>{{ t('landing.roi.medium.current') }}: 200 {{ t('common.hours') }}/{{ t('common.month') }}</li>
                    <li>{{ t('landing.roi.medium.withSystem') }}: 40 {{ t('common.hours') }}/{{ t('common.month') }}</li>
                    <li class="font-semibold text-primary">{{ t('landing.roi.medium.savings') }}: €6.851/{{ t('common.month') }}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
            {{ t('landing.cta.title') }}
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            {{ t('landing.cta.subtitle') }}
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild class="w-full sm:w-auto">
              <NuxtLink to="/login" class="inline-flex items-center justify-center">
                {{ t('landing.cta.startTrial') }}
                <ArrowRight class="ml-2 h-4 w-4" />
              </NuxtLink>
            </Button>
            <Button size="lg" variant="outline" asChild class="w-full sm:w-auto">
              <a href="#contact" class="inline-flex items-center justify-center">
                {{ t('landing.cta.contact') }}
                <MessageSquare class="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-24 bg-gray-50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-4xl text-center">
          <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">
            {{ t('landing.contact.title') }}
          </h2>
          <p class="mt-4 text-lg text-muted-foreground">
            {{ t('landing.contact.subtitle') }}
          </p>
          
          <div class="mt-12 bg-white rounded-lg shadow-sm border p-8">
            <div class="flex flex-col items-center space-y-4">
              <div class="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
                <Mail class="h-8 w-8 text-primary" />
              </div>
              <h3 class="text-xl font-semibold">{{ t('landing.contact.email.title') }}</h3>
              <p class="text-muted-foreground">{{ t('landing.contact.email.description') }}</p>
              <a href="mailto:info@wasplanning.nl" class="text-2xl font-medium text-primary hover:underline">
                info@wasplanning.nl
              </a>
              <p class="text-sm text-muted-foreground">{{ t('landing.contact.email.response') }}</p>
            </div>
          </div>

          <div class="mt-8 text-center">
            <p class="text-sm text-muted-foreground">
              {{ t('landing.contact.businessHours') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t py-12 bg-muted/50">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-4">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <img src="/wasplanning-logo.png" alt="Wasplanning Logo" class="h-8 w-8 object-contain" />
              <span class="font-bold">{{ t('app.name') }}</span>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ t('landing.footer.description') }}
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.product') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" class="hover:text-foreground">{{ t('landing.nav.features') }}</a></li>
              <li><a href="#pricing" class="hover:text-foreground">{{ t('landing.nav.pricing') }}</a></li>
              <li><a href="#" class="hover:text-foreground">{{ t('landing.footer.integrations') }}</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.company') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground">{{ t('landing.footer.about') }}</a></li>
              <li><a href="#contact" class="hover:text-foreground">{{ t('landing.nav.contact') }}</a></li>
              <li><NuxtLink to="/privacy" class="hover:text-foreground">{{ t('landing.footer.privacy') }}</NuxtLink></li>
              <li><NuxtLink to="/terms" class="hover:text-foreground">{{ t('landing.footer.terms') }}</NuxtLink></li>
              <li><NuxtLink to="/cookies" class="hover:text-foreground">{{ t('landing.footer.cookies') }}</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.support') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" class="hover:text-foreground">{{ t('landing.footer.docs') }}</a></li>
              <li><a href="#" class="hover:text-foreground">{{ t('landing.footer.help') }}</a></li>
              <li><a href="#" class="hover:text-foreground">{{ t('landing.footer.status') }}</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 {{ t('app.name') }}. {{ t('landing.footer.rights') }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import LanguageSwitcher from '~/components/LanguageSwitcher.vue'
import { 
  ArrowRight, 
  PlayCircle, 
  Activity, 
  Users, 
  Zap, 
  Building2, 
  BarChart3, 
  Smartphone,
  Check,
  MessageSquare,
  Car,
  Menu,
  X,
  Mail
} from 'lucide-vue-next'

const { t } = useI18n()
const mobileMenuOpen = ref(false)

// Meta
definePageMeta({
  layout: false,
  middleware: 'guest'
})

// Head meta
useHead({
  title: t('landing.metaTitle'),
  meta: [
    { name: 'description', content: t('landing.metaDescription') },
    { property: 'og:title', content: t('landing.metaTitle') },
    { property: 'og:description', content: t('landing.metaDescription') },
    { property: 'og:type', content: 'website' }
  ]
})
</script>