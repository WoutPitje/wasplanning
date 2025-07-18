export const nl = {
  title: 'Abonnement',
  subtitle: 'Beheer uw abonnement en facturatie',
  perMonth: 'per maand',
  unlimited: 'Onbeperkt',
  current: 'Huidig',
  currentPlan: 'Huidig Abonnement',
  currentPlanDescription: 'Uw huidige abonnement en status',
  availablePlans: 'Beschikbare Abonnementen',
  billingPeriod: 'Facturatieperiode',
  changeTo: 'Wijzig naar',
  changePlanDescription: 'Vergelijk abonnementen en beheer uw abonnement',
  viewPlans: 'Bekijk alle abonnementen',
  downgrade: 'Downgraden',
  cars: 'auto\'s',
  users: 'gebruikers',
  locations: 'locaties',
  invoicesDescription: 'Download facturen en bekijk betalingsgeschiedenis',
  viewInvoices: 'Bekijk facturen',
  vehicles: 'voertuigen',
  appointmentsPerMonth: 'afspraken per maand',
  
  plans: {
    free: 'Gratis',
    standard: 'Standaard',
    enterprise: 'Enterprise'
  },
  
  status: {
    ACTIVE: 'Actief',
    PAST_DUE: 'Betaling achterstallig',
    CANCELED: 'Geannuleerd',
    INCOMPLETE: 'Incompleet',
    TRIALING: 'Proefperiode',
    EXPIRED: 'Verlopen',
    // Lowercase versions for backend compatibility
    active: 'Actief',
    past_due: 'Betaling achterstallig',
    canceled: 'Geannuleerd',
    incomplete: 'Incompleet',
    trialing: 'Proefperiode',
    expired: 'Verlopen'
  },
  
  gracePeriod: {
    title: 'Betaling mislukt',
    description: 'Uw betaling is mislukt. Update uw betaalmethode voor {date} om toegang te behouden.'
  },
  
  pendingCancellation: {
    title: 'Geplande downgrade naar gratis plan',
    description: 'Uw abonnement wordt gedowngraded naar het gratis plan op {date}. U kunt op elk moment weer upgraden.',
    cancelDowngrade: 'Huidig plan behouden'
  },
  
  payment: {
    authenticationRequired: 'Betalingsauthenticatie vereist. Controleer uw bank-app of SMS voor bevestiging.',
    paymentMethodRequired: 'Voeg een betaalmethode toe om uw abonnementsupgrade te voltooien.'
  },
  
  usage: {
    title: 'Gebruik',
    description: 'Uw huidige gebruik ten opzichte van de limieten',
    overview: 'Gebruik Overzicht',
    period: 'Periode',
    users: 'Gebruikers',
    vehicles: 'Voertuigen',
    appointments: 'Afspraken deze maand',
    cars_washed: 'Auto\'s gewassen',
    active_users: 'Actieve gebruikers',
    locations: 'Locaties',
    limitExceeded: 'Limiet overschreden',
    limitExceededDescription: 'U heeft een of meer limieten van uw abonnement overschreden. Overweeg een upgrade naar een hoger plan.',
    highUsage: 'Hoog gebruik',
    highUsageDescription: 'U nadert de limieten van uw abonnement. Houd uw gebruik in de gaten of overweeg een upgrade.'
  },
  
  features: {
    priority_support: 'Prioriteit support',
    api_access: 'API toegang',
    custom_reports: 'Aangepaste rapporten',
    multi_location: 'Multi-locatie support',
    advanced_analytics: 'Geavanceerde analytics',
    export_data: 'Data exporteren',
    custom_branding: 'Eigen branding',
    advanced_reporting: 'Geavanceerde rapportage'
  },
  
  paymentMethods: {
    title: 'Betaalmethoden',
    description: 'Beheer uw betaalmethoden',
    add: 'Betaalmethode toevoegen',
    addTitle: 'Nieuwe betaalmethode toevoegen',
    addDescription: 'Voeg een creditcard of betaalmethode toe aan uw account',
    addButton: 'Toevoegen',
    card: 'Kaart',
    expires: 'Verloopt',
    default: 'Standaard',
    setDefault: 'Als standaard instellen',
    confirmDelete: 'Weet u zeker dat u deze betaalmethode wilt verwijderen?',
    empty: 'Geen betaalmethoden gevonden',
    setupError: 'Kon betaalsessie niet starten',
    addError: 'Kon betaalmethode niet toevoegen'
  },
  
  paymentMethodRequired: {
    title: 'Betaalmethode Vereist',
    description: 'Een geldige betaalmethode is vereist om te upgraden naar een betaald abonnement. Voeg eerst een betaalmethode toe om door te gaan.',
    addButton: 'Betaalmethode Toevoegen'
  },
  
  changePlan: {
    title: 'Abonnement wijzigen',
    description: 'Bevestig uw abonnementswijziging',
    from: 'Van',
    to: 'Naar',
    confirm: 'Bevestig wijziging',
    upgradeInfo: 'U wordt direct gefactureerd voor het prijsverschil.',
    downgradeInfo: 'De wijziging gaat in aan het einde van uw huidige facturatieperiode.',
    downgradeToFreeInfo: 'Uw abonnement wordt gedowngraded naar het gratis plan aan het einde van uw huidige facturatieperiode. Tot die tijd behoudt u toegang tot de functies van uw huidige plan.'
  },
  
  cancel: {
    title: 'Abonnement annuleren',
    description: 'Annuleer uw abonnement aan het einde van de facturatieperiode',
    button: 'Abonnement annuleren',
    dialogTitle: 'Abonnement annuleren',
    dialogDescription: 'Weet u zeker dat u uw abonnement wilt annuleren? Uw account wordt gedowngraded naar het gratis plan aan het einde van uw huidige facturatieperiode.',
    warning: 'Waarschuwing',
    warningDescription: 'Dit zal uw account downgraden naar het gratis plan.',
    consequences: 'Wat gebeurt er daarna',
    consequence1: 'Huidig plan blijft actief tot het einde van de facturatieperiode',
    consequence2: 'Automatische downgrade naar gratis plan na afloop facturatieperiode',
    consequence3: 'U kunt op elk moment weer upgraden',
    confirmButton: 'Ja, downgrade naar gratis plan'
  },
  
  errors: {
    forbidden: 'U heeft geen toegang tot deze pagina. Alleen garage beheerders kunnen abonnementen beheren.'
  },
  
  // Nieuwe vertalingen voor upgrade pagina
  upgrade: {
    title: 'Kies Uw Abonnement',
    subtitle: 'Selecteer het abonnement dat het beste bij uw garage past',
    button: 'Upgraden',
    importantInfo: 'Belangrijke Informatie',
    upgradeInfo: 'Bij Upgraden',
    upgradePoint1: 'Wijzigingen gaan direct in',
    upgradePoint2: 'Pro-rata verrekening voor huidige maand',
    upgradePoint3: 'Nieuwe limieten direct van toepassing',
    downgradeInfo: 'Bij Downgraden',
    downgradePoint1: 'Wijzigingen aan einde facturatieperiode',
    downgradePoint2: 'Huidige functies blijven tot dan beschikbaar',
    downgradePoint3: 'Zorg dat gebruik past binnen nieuwe limieten',
    carsPerMonth: '{count} auto\'s per maand',
    activeUsers: '{count} actieve gebruikers',
    locations: '{count} locaties',
    saveWithAnnual: 'Bespaar {amount} met jaarlijkse facturatie'
  },
  
  // Nieuwe vertalingen voor facturen pagina
  invoices: {
    title: 'Facturatiegeschiedenis',
    subtitle: 'Bekijk en download uw eerdere facturen',
    summary: 'Facturatie Overzicht',
    totalPaid: 'Totaal Betaald',
    averageMonthly: 'Gemiddeld per Maand',
    totalInvoices: 'Totaal Facturen',
    history: 'Factuurgeschiedenis',
    allYears: 'Alle jaren',
    invoice: 'Factuur',
    download: 'Download PDF',
    view: 'Bekijk Online',
    downloadNotAvailable: 'Download niet beschikbaar',
    viewNotAvailable: 'Online bekijken niet beschikbaar',
    empty: {
      title: 'Nog geen facturen',
      description: 'Uw facturen verschijnen hier zodra u upgradet naar een betaald abonnement'
    },
    status: {
      paid: 'Betaald',
      open: 'Open',
      void: 'Ongeldig',
      uncollectible: 'Oninbaar',
      draft: 'Concept'
    }
  },
  
  // Aanvullende vertalingen
  recommended: 'Aanbevolen',
  month: 'maand',
  scheduledCancel: 'Wordt binnenkort geannuleerd',
  quickUsage: 'Snel Overzicht',
  daysRemaining: '{days} dagen resterend',
  keepPlan: 'Huidig plan behouden',
  viewDetails: 'Bekijk details',
  
  // Pricing
  pricing: {
    title: 'Transparante Prijsstelling',
    subtitle: 'Kies het pakket dat bij uw garage past. Alle pakketten hebben 30 dagen gratis trial.',
    seoTitle: 'Prijzen - Wasplanning',
    seoDescription: 'Bekijk onze transparante prijsstelling voor automatisering van uw autowasproces. Vanaf €49 per maand.',
    monthly: 'Maandelijks',
    yearly: 'Jaarlijks',
    save10: 'Bespaar 10%',
    popular: 'Populair',
    perMonth: '/maand',
    saveYearly: 'Bespaar {amount} per jaar',
    contact: 'Contact',
    startTrial: 'Start gratis trial',
    maxCars: 'Tot {count} auto\'s per maand',
    unlimitedCars: 'Onbeperkt auto\'s',
    maxUsers: 'Tot {count} gebruikers',
    unlimitedUsers: 'Onbeperkt gebruikers',
    maxLocations: 'Tot {count} locaties',
    unlimitedLocations: 'Onbeperkt locaties',
    features: {
      basic_features: 'Basis functionaliteiten',
      advanced_reporting: 'Geavanceerde rapportages',
      api_access: 'API toegang',
      priority_support: 'Prioriteit support',
      custom_branding: 'Custom branding',
      multi_location: 'Multi-locatie ondersteuning',
      cross_location_planning: 'Cross-locatie planning',
      custom_integrations: 'Maatwerk integraties',
      dedicated_support: 'Dedicated support',
      sla_guarantee: 'SLA garantie',
      franchise_management: 'Franchise management'
    },
    faq: {
      title: 'Veelgestelde Vragen',
      trial: {
        question: 'Hoe werkt de gratis trial?',
        answer: '30 dagen volledige toegang tot alle functies. Geen creditcard vereist. Na afloop kunt u kiezen voor een betaald abonnement.'
      },
      cancel: {
        question: 'Kan ik mijn abonnement opzeggen?',
        answer: 'Ja, u kunt uw abonnement op elk moment opzeggen. Er zijn geen opzegtermijnen of verborgen kosten.'
      },
      support: {
        question: 'Welke ondersteuning is beschikbaar?',
        answer: 'Nederlandse email en telefoon support tijdens kantooruren. Prioriteit support voor Groei en Enterprise pakketten.'
      },
      upgrade: {
        question: 'Kan ik upgraden naar een hoger pakket?',
        answer: 'Ja, u kunt op elk moment upgraden. De nieuwe prijs gaat direct in en wordt pro-rata berekend.'
      }
    }
  }
}

export const en = {
  title: 'Subscription',
  subtitle: 'Manage your subscription and billing',
  perMonth: 'per month',
  unlimited: 'Unlimited',
  current: 'Current',
  currentPlan: 'Current Plan',
  currentPlanDescription: 'Your current subscription and status',
  availablePlans: 'Available Plans',
  billingPeriod: 'Billing Period',
  changeTo: 'Change to',
  changePlanDescription: 'Compare plans and manage your subscription',
  viewPlans: 'View all plans',
  downgrade: 'Downgrade',
  cars: 'cars',
  users: 'users',
  locations: 'locations',
  invoicesDescription: 'Download invoices and view payment history',
  viewInvoices: 'View invoices',
  vehicles: 'vehicles',
  appointmentsPerMonth: 'appointments per month',
  
  plans: {
    free: 'Free',
    standard: 'Standard',
    enterprise: 'Enterprise'
  },
  
  status: {
    ACTIVE: 'Active',
    PAST_DUE: 'Past due',
    CANCELED: 'Canceled',
    INCOMPLETE: 'Incomplete',
    TRIALING: 'Trial',
    EXPIRED: 'Expired',
    // Lowercase versions for backend compatibility
    active: 'Active',
    past_due: 'Past due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    trialing: 'Trial',
    expired: 'Expired'
  },
  
  gracePeriod: {
    title: 'Payment failed',
    description: 'Your payment failed. Update your payment method before {date} to maintain access.'
  },
  
  pendingCancellation: {
    title: 'Scheduled downgrade to free plan',
    description: 'Your subscription will be downgraded to the free plan on {date}. You can upgrade again at any time.',
    cancelDowngrade: 'Keep current plan'
  },
  
  payment: {
    authenticationRequired: 'Payment authentication required. Please check your bank app or SMS for confirmation.',
    paymentMethodRequired: 'Please add a payment method to complete your subscription upgrade.'
  },
  
  usage: {
    title: 'Usage',
    description: 'Your current usage against limits',
    overview: 'Usage Overview',
    period: 'Period',
    users: 'Users',
    vehicles: 'Vehicles',
    appointments: 'Appointments this month',
    cars_washed: 'Cars washed',
    active_users: 'Active users',
    locations: 'Locations',
    limitExceeded: 'Limit exceeded',
    limitExceededDescription: 'You have exceeded one or more limits of your subscription. Consider upgrading to a higher plan.',
    highUsage: 'High usage',
    highUsageDescription: 'You are approaching your subscription limits. Monitor your usage or consider upgrading.'
  },
  
  features: {
    priority_support: 'Priority support',
    api_access: 'API access',
    custom_reports: 'Custom reports',
    multi_location: 'Multi-location support',
    advanced_analytics: 'Advanced analytics',
    export_data: 'Export data',
    custom_branding: 'Custom branding',
    advanced_reporting: 'Advanced reporting'
  },
  
  paymentMethods: {
    title: 'Payment Methods',
    description: 'Manage your payment methods',
    add: 'Add payment method',
    addTitle: 'Add new payment method',
    addDescription: 'Add a credit card or payment method to your account',
    addButton: 'Add',
    card: 'Card',
    expires: 'Expires',
    default: 'Default',
    setDefault: 'Set as default',
    confirmDelete: 'Are you sure you want to delete this payment method?',
    empty: 'No payment methods found',
    setupError: 'Could not start payment session',
    addError: 'Could not add payment method'
  },
  
  paymentMethodRequired: {
    title: 'Payment Method Required',
    description: 'A valid payment method is required to upgrade to a paid plan. Please add a payment method to continue.',
    addButton: 'Add Payment Method'
  },
  
  changePlan: {
    title: 'Change Plan',
    description: 'Confirm your plan change',
    from: 'From',
    to: 'To',
    confirm: 'Confirm change',
    upgradeInfo: 'You will be charged immediately for the price difference.',
    downgradeInfo: 'The change will take effect at the end of your current billing period.',
    downgradeToFreeInfo: 'Your subscription will be downgraded to the free plan at the end of your current billing period. You will continue to have access to your current plan features until then.'
  },
  
  cancel: {
    title: 'Cancel Subscription',
    description: 'Cancel your subscription at the end of the billing period',
    button: 'Cancel subscription',
    dialogTitle: 'Cancel Subscription',
    dialogDescription: 'Are you sure you want to cancel your subscription? Your account will be downgraded to the free plan at the end of your current billing period.',
    warning: 'Warning',
    warningDescription: 'This will downgrade your account to the free plan.',
    consequences: 'What happens next',
    consequence1: 'Current plan continues until the end of the billing period',
    consequence2: 'Automatic downgrade to free plan after billing period ends',
    consequence3: 'You can upgrade again at any time',
    confirmButton: 'Yes, downgrade to free plan'
  },
  
  errors: {
    forbidden: 'You do not have access to this page. Only garage administrators can manage subscriptions.'
  },
  
  // New translations for upgrade page
  upgrade: {
    title: 'Choose Your Plan',
    subtitle: 'Select the plan that best fits your garage needs',
    button: 'Upgrade',
    importantInfo: 'Important Information',
    upgradeInfo: 'When Upgrading',
    upgradePoint1: 'Changes take effect immediately',
    upgradePoint2: 'Prorated charge for the current month',
    upgradePoint3: 'New limits apply instantly',
    downgradeInfo: 'When Downgrading',
    downgradePoint1: 'Changes at end of billing period',
    downgradePoint2: 'Keep current features until then',
    downgradePoint3: 'Ensure usage fits new limits',
    carsPerMonth: '{count} cars per month',
    activeUsers: '{count} active users',
    locations: '{count} locations',
    saveWithAnnual: 'Save {amount} with annual billing'
  },
  
  // New translations for invoices page
  invoices: {
    title: 'Billing History',
    subtitle: 'View and download your past invoices',
    summary: 'Billing Summary',
    totalPaid: 'Total Paid',
    averageMonthly: 'Average Monthly',
    totalInvoices: 'Total Invoices',
    history: 'Invoice History',
    allYears: 'All years',
    invoice: 'Invoice',
    download: 'Download PDF',
    view: 'View Online',
    downloadNotAvailable: 'Download not available',
    viewNotAvailable: 'View not available',
    empty: {
      title: 'No invoices yet',
      description: 'Your invoices will appear here once you upgrade to a paid plan'
    },
    status: {
      paid: 'Paid',
      open: 'Open',
      void: 'Void',
      uncollectible: 'Uncollectible',
      draft: 'Draft'
    }
  },
  
  // Additional translations
  recommended: 'Recommended',
  month: 'month',
  scheduledCancel: 'Canceling soon',
  quickUsage: 'Quick Usage',
  daysRemaining: '{days} days remaining',
  keepPlan: 'Keep current plan',
  viewDetails: 'View details',
  
  // Pricing
  pricing: {
    title: 'Transparent Pricing',
    subtitle: 'Choose the package that fits your garage. All packages have a 30-day free trial.',
    seoTitle: 'Pricing - Wasplanning',
    seoDescription: 'View our transparent pricing for automating your car wash process. Starting from €49 per month.',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save10: 'Save 10%',
    popular: 'Popular',
    perMonth: '/month',
    saveYearly: 'Save {amount} per year',
    contact: 'Contact',
    startTrial: 'Start free trial',
    maxCars: 'Up to {count} cars per month',
    unlimitedCars: 'Unlimited cars',
    maxUsers: 'Up to {count} users',
    unlimitedUsers: 'Unlimited users',
    maxLocations: 'Up to {count} locations',
    unlimitedLocations: 'Unlimited locations',
    features: {
      basic_features: 'Basic features',
      advanced_reporting: 'Advanced reporting',
      api_access: 'API access',
      priority_support: 'Priority support',
      custom_branding: 'Custom branding',
      multi_location: 'Multi-location support',
      cross_location_planning: 'Cross-location planning',
      custom_integrations: 'Custom integrations',
      dedicated_support: 'Dedicated support',
      sla_guarantee: 'SLA guarantee',
      franchise_management: 'Franchise management'
    },
    faq: {
      title: 'Frequently Asked Questions',
      trial: {
        question: 'How does the free trial work?',
        answer: '30 days full access to all features. No credit card required. After the trial, you can choose a paid subscription.'
      },
      cancel: {
        question: 'Can I cancel my subscription?',
        answer: 'Yes, you can cancel your subscription at any time. There are no cancellation terms or hidden costs.'
      },
      support: {
        question: 'What support is available?',
        answer: 'Dutch email and phone support during business hours. Priority support for Growth and Enterprise packages.'
      },
      upgrade: {
        question: 'Can I upgrade to a higher package?',
        answer: 'Yes, you can upgrade at any time. The new price takes effect immediately and is calculated pro-rata.'
      }
    }
  }
}