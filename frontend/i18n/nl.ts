export default {
  // Common
  common: {
    loading: 'Laden...',
    error: 'Fout',
    retry: 'Opnieuw proberen',
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    view: 'Bekijken',
    create: 'Aanmaken',
    back: 'Terug',
    active: 'Actief',
    inactive: 'Inactief',
    yes: 'Ja',
    no: 'Nee',
    login: 'Inloggen',
    all: 'Alle',
    actions: 'Acties',
    showing: 'Toont',
    of: 'van',
    previous: 'Vorige',
    next: 'Volgende',
    month: 'maand',
    hours: 'uur'
  },
  
  // App
  app: {
    name: 'Wasplanning'
  },
  
  // Home
  home: {
    subtitle: 'Efficiënt beheer voor uw autowasproces',
    description: 'Welkom bij Wasplanning. Log in om door te gaan.',
    metaTitle: 'Wasplanning - Efficiënt Autowas Management',
    metaDescription: 'Stroomlijn uw garage autowasproces met ons planningssysteem'
  },
  
  // Auth
  login: {
    title: 'Inloggen',
    subtitle: 'Log in op uw account',
    email: 'E-mailadres',
    emailPlaceholder: 'Voer uw e-mailadres in',
    password: 'Wachtwoord',
    passwordPlaceholder: 'Voer uw wachtwoord in',
    submit: 'Inloggen',
    error: 'Onjuiste inloggegevens',
    redirecting: 'Doorverwijzen...',
    loggingIn: 'Bezig met inloggen...',
    loginButton: 'Inloggen'
  },
  
  // Admin
  admin: {
    settings: {
      title: 'Systeeminstellingen',
      subtitle: 'Beheer globale systeeminstellingen',
      systemConfig: 'Systeemconfiguratie',
      placeholder: 'Systeeminstellingen komen hier...'
    },
    
    tenants: {
      title: 'Garage Beheer',
      subtitle: 'Beheer alle garages in het systeem',
      loading: 'Garages laden...',
      errorLoading: 'Fout bij laden',
      addNew: 'Nieuwe Garage Toevoegen',
      noTenants: 'Geen garages',
      noTenantsDescription: 'Begin door een nieuwe garage toe te voegen.',
      createdAt: 'Aangemaakt {date}',
      
      // Details
      details: {
        title: 'Garage Details',
        subtitle: 'Bekijk garage informatie en statistieken',
        loading: 'Garage details laden...',
        loadError: 'Kon garage details niet laden',
        garageInfo: 'Garage Informatie',
        name: 'Garage Naam',
        displayName: 'Weergavenaam',
        systemName: 'Systeem Naam',
        status: 'Status',
        createdAt: 'Aangemaakt op',
        logo: 'Logo',
        users: 'Gebruikers',
        noUsers: 'Geen gebruikers gevonden',
        settings: 'Instellingen',
        statistics: 'Statistieken',
        totalUsers: 'Totaal gebruikers',
        activeUsers: 'Actieve gebruikers',
        statsLoading: 'Statistieken laden...',
        usersByRole: 'Gebruikers per rol',
        lastUpdated: 'Laatst bijgewerkt'
      },
      
      // Edit
      edit: {
        title: 'Garage Bewerken',
        titleWithName: 'Bewerk {name}',
        subtitle: 'Update garage informatie',
        loading: 'Garage gegevens laden...',
        loadError: 'Kon garage niet laden',
        garageInfo: 'Garage Informatie',
        garageInfoDescription: 'Basis informatie over de garage',
        systemName: 'Systeem Naam',
        systemNameInfo: 'Systeem naam kan niet worden gewijzigd',
        displayName: 'Weergave Naam',
        displayNamePlaceholder: 'Garage Amsterdam West',
        logoUrl: 'Logo URL',
        logoUrlPlaceholder: 'https://example.com/logo.png',
        status: 'Status',
        garageActive: 'Garage is actief',
        updateError: 'Fout bij bijwerken garage',
        updating: 'Bezig met bijwerken...',
        updateButton: 'Wijzigingen Opslaan',
        updateSuccess: 'Garage bijgewerkt',
        updateSuccessDescription: 'De garage informatie is succesvol bijgewerkt'
      },
      
      // Form
      form: {
        createTitle: 'Nieuwe Garage Aanmaken',
        editTitle: 'Garage Bewerken',
        name: 'Systeem Naam',
        nameHelp: 'Unieke naam voor het systeem (geen spaties)',
        displayName: 'Weergavenaam',
        displayNameHelp: 'Naam zoals getoond aan gebruikers',
        adminEmail: 'Admin E-mailadres',
        adminEmailHelp: 'E-mailadres voor de garage beheerder',
        adminFirstName: 'Voornaam Beheerder',
        adminLastName: 'Achternaam Beheerder',
        logoUrl: 'Logo URL',
        logoUrlHelp: 'URL naar het garage logo (optioneel)',
        language: 'Taal',
        isActive: 'Garage is actief',
        submit: 'Garage Aanmaken',
        update: 'Wijzigingen Opslaan',
        success: 'Garage succesvol aangemaakt',
        updateSuccess: 'Garage succesvol bijgewerkt',
        errors: {
          nameExists: 'Deze naam bestaat al',
          emailExists: 'Dit e-mailadres is al in gebruik',
          createFailed: 'Aanmaken mislukt. Probeer het opnieuw.',
          updateFailed: 'Bijwerken mislukt. Probeer het opnieuw.'
        },
        adminCredentials: 'Inloggegevens Beheerder',
        temporaryPassword: 'Tijdelijk wachtwoord',
        credentialsNote: 'Stuur deze gegevens veilig naar de garage beheerder. Het tijdelijke wachtwoord moet bij eerste inlog worden gewijzigd.',
        copied: 'Gekopieerd!',
        copy: 'Kopiëren',
        backToOverview: 'Terug naar Overzicht',
        // File upload
        logoPreview: 'Logo voorbeeldweergave',
        clickToUpload: 'Klik om te uploaden',
        orDragAndDrop: 'of sleep bestanden hierheen',
        allowedFormats: 'PNG, JPG, GIF, WebP tot 2MB',
        maxFileSize: 'Maximaal 2MB',
        logoUrlAlternative: 'Of gebruik een URL',
        logoUrlPlaceholder: 'https://example.com/logo.png',
        useUrlInstead: 'Gebruik URL in plaats van bestand',
        removeImage: 'Verwijder afbeelding',
        uploading: 'Uploaden',
        invalidFileType: 'Ongeldig bestandstype. Alleen JPEG, PNG, GIF en WebP zijn toegestaan.',
        fileTooLarge: 'Bestand te groot. Maximaal 2MB toegestaan.',
        uploadFailed: 'Upload mislukt. Probeer het opnieuw.',
        logoUploadNote: 'Logo kan na aanmaak worden geüpload via de bewerkingspagina'
      },
      
      // Users
      users: {
        title: 'Gebruikers',
        addNew: 'Nieuwe Gebruiker',
        email: 'E-mailadres',
        name: 'Naam',
        role: 'Rol',
        lastLogin: 'Laatste Login',
        actions: 'Acties',
        noUsers: 'Geen gebruikers',
        deactivate: 'Deactiveren',
        activate: 'Activeren',
        resetPassword: 'Wachtwoord Reset'
        
      },
      
      // Table
      table: {
        name: 'Naam',
        systemName: 'Systeem Naam',
        status: 'Status',
        users: 'Gebruikers',
        createdAt: 'Aangemaakt',
        actions: 'Acties'
      }
    },
    
    // Breadcrumbs
    breadcrumb: {
      admin: 'Admin',
      garages: 'Garages',
      details: 'Details',
      edit: 'Bewerken'
    },
    
    // Users (for admin)
    users: {
      impersonate: 'Nabootsen',
      impersonating_as: 'U bootst nu na: {email}',
      stop_impersonation: 'Stop nabootsen',
      impersonation: {
        started: 'Succesvol begonnen met nabootsen van {email}',
        stopped: 'Gestopt met nabootsen',
        forbidden: 'U heeft geen toestemming om deze gebruiker na te bootsen',
        user_not_found: 'Gebruiker niet gevonden',
        not_impersonating: 'U bootst momenteel niemand na'
      }
    },
    
    // Audit logs
    audit: {
      title: 'Audit Logs',
      filters: 'Filters',
      action: 'Actie',
      resource: 'Resource',
      user: 'Gebruiker',
      date: 'Datum',
      time: 'Tijd',
      ip_address: 'IP Adres',
      details: 'Details',
      no_logs: 'Geen audit logs gevonden',
      export: 'Exporteren',
      export_csv: 'Exporteer als CSV',
      view_details: 'Details bekijken',
      filter_by_date: 'Filter op datum',
      filter_by_action: 'Filter op actie',
      filter_by_user: 'Filter op gebruiker',
      start_date: 'Startdatum',
      end_date: 'Einddatum',
      apply_filters: 'Filters toepassen',
      clear_filters: 'Filters wissen',
      actions: {
        'auth.login': 'Ingelogd',
        'auth.logout': 'Uitgelogd',
        'auth.impersonate.start': 'Impersonatie gestart',
        'auth.impersonate.stop': 'Impersonatie gestopt',
        'user.created': 'Gebruiker aangemaakt',
        'user.updated': 'Gebruiker bijgewerkt',
        'user.deactivated': 'Gebruiker gedeactiveerd',
        'user.password_reset': 'Wachtwoord gereset',
        'tenant.created': 'Garage aangemaakt',
        'tenant.updated': 'Garage bijgewerkt',
        'tenant.deactivated': 'Garage gedeactiveerd'
      },
      resource_types: {
        user: 'Gebruiker',
        tenant: 'Garage'
      }
    }
  },
  
  // Garage Admin
  garageAdmin: {
    dashboard: {
      userManagement: 'Gebruikersbeheer',
      userManagementDescription: 'Beheer gebruikers van uw garage',
      garageSettings: 'Garage Instellingen',
      garageSettingsDescription: 'Configureer uw garage instellingen',
      reports: 'Rapportages',
      reportsDescription: 'Bekijk prestaties en statistieken'
    },
    settings: {
      title: 'Garage Instellingen',
      subtitle: 'Beheer uw garage configuratie',
      generalSettings: 'Algemene Instellingen',
      placeholder: 'Garage instellingen komen hier...'
    },
    users: {
      title: 'Gebruikersbeheer',
      subtitle: 'Beheer gebruikers binnen uw garage',
      overview: 'Gebruikersoverzicht',
      placeholder: 'Gebruikersbeheer komt hier...'
    }
  },
  
  // Delivery
  delivery: {
    schedule: {
      completedWashes: 'Voltooide Wassen',
      completedWashesDescription: 'Overzicht van wassen klaar voor ophalen',
      returnPlanning: 'Retour Planning',
      returnPlanningDescription: 'Plan retourritten voor gewassen voertuigen',
      urgentDeliveries: 'Urgente Leveringen',
      urgentDeliveriesDescription: 'Prioriteit leveringen die vandaag moeten'
    }
  },
  
  // Washer
  washer: {
    queue: {
      myTasks: 'Mijn Taken',
      myTasksDescription: 'Uw toegewezen wastaken',
      availableTasks: 'Beschikbare Taken',
      availableTasksDescription: 'Taken beschikbaar om op te pakken'
    }
  },
  
  // Wasplanner
  wasplanner: {
    dashboard: {
      queueManagement: 'Wachtrij Beheer',
      queueManagementDescription: 'Beheer de waswachtrij',
      assignments: 'Toewijzingen',
      assignmentsDescription: 'Wijs taken toe aan wassers',
      planningOverview: 'Planning Overzicht',
      planningOverviewDescription: 'Bekijk de complete wasplanning'
    }
  },
  
  // Workshop
  workshop: {
    requests: {
      newRequests: 'Nieuwe Aanvragen',
      newRequestsDescription: 'Maak een nieuwe wasaanvraag',
      newRequestButton: 'Nieuwe Wasaanvraag',
      myRequests: 'Mijn Aanvragen',
      myRequestsDescription: 'Bekijk uw wasaanvragen'
    }
  },
  
  // Roles
  roles: {
    workshop: 'Werkplaats',
    washers: 'Wassers',
    pickup_delivery_planners: 'Haal/Breng Planners',
    wash_planners: 'Wasplanners',
    garage_admin: 'Garage Admin',
    super_admin: 'Super Admin'
  },
  
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    garages: 'Garages',
    settings: 'Instellingen',
    logout: 'Uitloggen',
    tenants: 'Tenants',
    users: 'Gebruikers',
    auditLogs: 'Audit Logs',
    queue: 'Wachtrij',
    planning: 'Planning',
    myTasks: 'Mijn Taken',
    history: 'Geschiedenis',
    newRequests: 'Nieuwe Verzoeken',
    myRequests: 'Mijn Verzoeken',
    routes: 'Routes'
  },
  
  // Users
  users: {
    title: 'Gebruikersbeheer',
    subtitle: 'Beheer gebruikers binnen het systeem',
    addNew: 'Nieuwe Gebruiker',
    search: 'Zoek gebruikers...',
    noUsers: 'Geen gebruikers gevonden',
    noUsersDescription: 'Begin door een nieuwe gebruiker toe te voegen.',
    
    // Form
    form: {
      createTitle: 'Nieuwe Gebruiker Aanmaken',
      editTitle: 'Gebruiker Bewerken',
      userInfo: 'Gebruiker Informatie',
      userInfoDescription: 'Basis informatie over de gebruiker',
      emailCannotBeChanged: 'E-mailadressen kunnen niet worden gewijzigd na het aanmaken',
      tenantCannotBeChanged: 'Garage toewijzing kan niet worden gewijzigd na het aanmaken',
      success: 'Gebruiker succesvol aangemaakt',
      updateSuccess: 'Gebruiker succesvol bijgewerkt'
    },
    
    // Details
    details: {
      title: 'Gebruiker Details',
      subtitle: 'Bekijk gebruiker informatie',
      userInfo: 'Gebruiker Informatie',
      name: 'Naam',
      email: 'E-mailadres',
      role: 'Rol',
      status: 'Status',
      tenant: 'Garage',
      createdAt: 'Aangemaakt op',
      updatedAt: 'Laatst bijgewerkt',
      lastLogin: 'Laatste login',
      actions: 'Acties'
    },
    
    // Table headers
    table: {
      name: 'Naam',
      email: 'E-mailadres',
      role: 'Rol',
      status: 'Status',
      lastLogin: 'Laatste Login',
      actions: 'Acties',
      tenant: 'Garage'
    },
    
    // Status
    status: {
      active: 'Actief',
      inactive: 'Inactief',
      never: 'Nooit'
    },
    
    // Actions
    actions: {
      edit: 'Bewerken',
      deactivate: 'Deactiveren',
      activate: 'Activeren',
      resetPassword: 'Wachtwoord Reset',
      viewDetails: 'Details Bekijken',
      impersonate: 'Nabootsen'
    },
    
    // Dialog/Form
    dialog: {
      createTitle: 'Nieuwe Gebruiker Aanmaken',
      editTitle: 'Gebruiker Bewerken',
      firstName: 'Voornaam',
      firstNamePlaceholder: 'Jan',
      lastName: 'Achternaam',
      lastNamePlaceholder: 'de Vries',
      email: 'E-mailadres',
      emailPlaceholder: 'gebruiker@garage.nl',
      role: 'Rol',
      selectRole: 'Selecteer een rol',
      tenant: 'Garage',
      selectTenant: 'Selecteer een garage',
      password: 'Wachtwoord',
      passwordPlaceholder: 'Laat leeg voor automatisch wachtwoord',
      passwordHelp: 'Min. 8 karakters. Indien leeg, wordt automatisch wachtwoord gegenereerd.',
      isActive: 'Gebruiker is actief',
      submit: 'Gebruiker Aanmaken',
      update: 'Wijzigingen Opslaan',
      cancel: 'Annuleren',
      
      // Password reset
      resetPasswordTitle: 'Wachtwoord Resetten',
      resetPasswordDescription: 'Voer een nieuw wachtwoord in voor {name}',
      newPassword: 'Nieuw Wachtwoord',
      newPasswordPlaceholder: 'Nieuw wachtwoord',
      confirmPassword: 'Bevestig Wachtwoord',
      confirmPasswordPlaceholder: 'Bevestig nieuw wachtwoord',
      resetButton: 'Wachtwoord Resetten',
      
      // Temporary password
      temporaryPasswordTitle: 'Tijdelijk Wachtwoord',
      temporaryPasswordDescription: 'Een tijdelijk wachtwoord is aangemaakt voor de nieuwe gebruiker.',
      temporaryPassword: 'Tijdelijk wachtwoord',
      copyPassword: 'Kopieer Wachtwoord',
      copied: 'Gekopieerd!',
      passwordNote: 'Dit wachtwoord wordt maar één keer getoond. Stuur het veilig naar de gebruiker.'
    },
    
    // Filters
    filters: {
      tenant: 'Garage',
      allTenants: 'Alle garages',
      role: 'Rol',
      allRoles: 'Alle rollen'
    },
    
    // Success messages
    success: {
      created: 'Gebruiker succesvol aangemaakt',
      updated: 'Gebruiker succesvol bijgewerkt',
      deactivated: 'Gebruiker gedeactiveerd',
      activated: 'Gebruiker geactiveerd',
      passwordReset: 'Wachtwoord succesvol gereset'
    },
    
    // Error messages
    errors: {
      createFailed: 'Gebruiker aanmaken mislukt',
      updateFailed: 'Gebruiker bijwerken mislukt',
      deactivateFailed: 'Gebruiker deactiveren mislukt',
      activateFailed: 'Gebruiker activeren mislukt',
      passwordResetFailed: 'Wachtwoord reset mislukt',
      emailExists: 'Dit e-mailadres is al in gebruik',
      loadFailed: 'Gebruikers laden mislukt',
      passwordMismatch: 'Wachtwoorden komen niet overeen'
    }
  },
  
  // Header
  header: {
    titles: {
      superAdmin: 'Wasplanning Admin',
      garageAdmin: 'Garage Beheer',
      wasplanner: 'Was Planning',
      washer: 'Wasser Dashboard',
      workshop: 'Werkplaats',
      deliveryPlanner: 'Haal/Breng Planning'
    }
  },
  
  // Languages
  languages: {
    nl: 'Nederlands',
    en: 'Engels'
  },
  
  // Landing page
  landing: {
    metaTitle: 'Wasplanning - Digitale Autowas Planning voor Garages',
    metaDescription: 'Stroomlijn uw autowasproces met slimme planning. Real-time tracking, automatische toewijzing en volledige integratie met uw werkplaats.',
    
    nav: {
      features: 'Functionaliteiten',
      pricing: 'Prijzen',
      contact: 'Contact'
    },
    
    hero: {
      badge: 'Voor garages met haal/breng service',
      title: 'Slimme Wasplanning voor Moderne Garages',
      subtitle: 'Digitaliseer uw autowasproces. Van werkplaats tot retourrit - alles in één systeem.',
      cta: {
        start: 'Start gratis proefperiode',
        demo: 'Bekijk demo'
      }
    },
    
    stats: {
      garages: 'Garages in Nederland',
      timeSaved: 'Minder handmatige coördinatie',
      certainty: 'Zekerheid voor retourrit',
      orderTime: 'Voor nieuwe wasorder'
    },
    
    features: {
      title: 'Alles wat u nodig heeft',
      subtitle: 'Complete oplossing voor efficiënt wasbeheer in uw garage',
      
      realtime: {
        title: 'Real-time Status Tracking',
        description: 'Volg elke auto van werkplaats tot wasstraat tot gereed. Iedereen ziet direct de actuele status.'
      },
      
      smartAssignment: {
        title: 'Slimme Toewijzing',
        description: 'Automatische matching op basis van capaciteit, vaardigheden en retourrit prioriteit.'
      },
      
      priority: {
        title: 'Prioriteit Systeem',
        description: 'Urgente wassen krijgen automatisch voorrang. Nooit meer stress bij spoed retourritten.'
      },
      
      multiLocation: {
        title: 'Multi-locatie Support',
        description: 'Beheer meerdere vestigingen vanuit één dashboard. Perfect voor garageketens.'
      },
      
      reports: {
        title: 'Inzichtelijke Rapportages',
        description: 'Real-time dashboards met prestaties, doorlooptijden en productiviteit per locatie.'
      },
      
      mobile: {
        title: 'Mobiel Vriendelijk',
        description: 'Volledig responsive design. Wassers werken op tablet of telefoon, geen training nodig.'
      }
    },
    
    howItWorks: {
      title: 'Hoe het werkt',
      subtitle: 'Van aanmelding tot retourrit in 4 simpele stappen',
      
      step1: {
        title: 'Werkplaats meldt auto aan',
        description: 'Monteur klikt één knop: auto klaar voor wasbeurt. Geen telefoontjes, geen briefjes.'
      },
      
      step2: {
        title: 'Systeem bepaalt prioriteit',
        description: 'Op basis van retourrit tijd en type wasbeurt wordt automatisch prioriteit bepaald.'
      },
      
      step3: {
        title: 'Wasser voert wasbeurt uit',
        description: 'Wasser ziet direct nieuwe taken, werkt lijst af en meldt auto gereed met één klik.'
      },
      
      step4: {
        title: 'Planner ziet gereed status',
        description: 'Haal/breng planner heeft zekerheid: auto is gewassen en klaar voor retourrit.'
      }
    },
    
    pricing: {
      title: 'Transparante Prijzen',
      subtitle: 'Geen verrassingen, geen setup kosten. Start vandaag nog.',
      popular: 'Meest gekozen',
      cta: '30 dagen gratis proberen',
      contact: 'Contact opnemen',
      benefits: 'Alle pakketten inclusief: ✓ 30 dagen gratis proberen ✓ Geen setup kosten ✓ Maandelijks opzegbaar ✓ Nederlandse support',
      
      starter: {
        name: 'Starter',
        description: 'Perfect voor kleinere garages',
        feature1: '1 locatie',
        feature2: 'Tot 500 auto\'s/maand',
        feature3: '5 gebruikers',
        feature4: 'Basis functies'
      },
      
      growth: {
        name: 'Groei',
        description: 'Voor groeiende garages',
        feature1: 'Tot 3 locaties',
        feature2: 'Tot 2.000 auto\'s/maand',
        feature3: 'Onbeperkt gebruikers',
        feature4: 'Alle functies',
        feature5: 'API toegang'
      },
      
      enterprise: {
        name: 'Enterprise',
        description: 'Voor garageketens',
        feature1: 'Onbeperkt locaties',
        feature2: 'Onbeperkt auto\'s',
        feature3: 'Multi-tenant dashboard',
        feature4: 'Custom integraties',
        feature5: 'SLA garantie'
      }
    },
    
    roi: {
      title: 'Bereken uw besparing',
      subtitle: 'Zie direct hoeveel tijd en geld u bespaart',
      
      small: {
        title: 'Kleine Garage (300 auto\'s/maand)',
        current: 'Huidige tijdsbesteding',
        withSystem: 'Met Wasplanning',
        savings: 'Besparing'
      },
      
      medium: {
        title: 'Middelgrote Keten (1.500 auto\'s)',
        current: 'Huidige tijdsbesteding',
        withSystem: 'Met Wasplanning',
        savings: 'Besparing'
      }
    },
    
    cta: {
      title: 'Klaar om te digitaliseren?',
      subtitle: 'Join honderden garages die al efficiënter werken met Wasplanning.',
      startTrial: 'Start gratis proefperiode',
      contact: 'Vraag een demo aan'
    },
    
    footer: {
      description: 'De complete wasplanning oplossing voor moderne garages.',
      product: 'Product',
      company: 'Bedrijf',
      support: 'Ondersteuning',
      integrations: 'Integraties',
      about: 'Over ons',
      privacy: 'Privacy',
      terms: 'Algemene Voorwaarden',
      cookies: 'Cookiebeleid',
      docs: 'Documentatie',
      help: 'Help Center',
      status: 'Systeem Status',
      rights: 'Alle rechten voorbehouden'
    },
    
    contact: {
      title: 'Contact',
      subtitle: 'Heeft u vragen? We helpen u graag verder.',
      email: {
        title: 'Stuur ons een e-mail',
        description: 'Voor algemene vragen en ondersteuning',
        response: 'We reageren binnen 24 uur'
      },
      businessHours: 'Bereikbaar op werkdagen van 9:00 - 17:00'
    }
  },
  
  // Privacy Policy
  privacy: {
    title: 'Privacybeleid',
    metaTitle: 'Privacybeleid - Wasplanning',
    metaDescription: 'Lees hoe Wasplanning uw persoonlijke gegevens beschermt en verwerkt.',
    lastUpdated: 'Laatst bijgewerkt: {date}',
    
    intro: {
      title: 'Introductie',
      content: 'Bij Wasplanning hechten we groot belang aan uw privacy. Dit privacybeleid legt uit hoe we uw persoonlijke gegevens verzamelen, gebruiken en beschermen wanneer u onze diensten gebruikt.'
    },
    
    dataCollection: {
      title: 'Welke gegevens we verzamelen',
      intro: 'We verzamelen de volgende categorieën persoonlijke gegevens:',
      item1: 'Accountgegevens: naam, e-mailadres, telefoonnummer',
      item2: 'Bedrijfsgegevens: bedrijfsnaam, BTW-nummer, adres',
      item3: 'Gebruiksgegevens: hoe u onze dienst gebruikt, inloggegevens',
      item4: 'Technische gegevens: IP-adres, browsertype, apparaatinformatie'
    },
    
    dataUsage: {
      title: 'Hoe we uw gegevens gebruiken',
      intro: 'We gebruiken uw persoonlijke gegevens voor:',
      item1: 'Het leveren en verbeteren van onze diensten',
      item2: 'Communicatie over uw account en onze diensten',
      item3: 'Het nakomen van wettelijke verplichtingen',
      item4: 'Het voorkomen van fraude en misbruik'
    },
    
    dataProtection: {
      title: 'Gegevensbescherming',
      content: 'We implementeren passende technische en organisatorische maatregelen om uw persoonlijke gegevens te beschermen tegen ongeautoriseerde toegang, wijziging, openbaarmaking of vernietiging.'
    },
    
    dataSharing: {
      title: 'Delen van gegevens',
      intro: 'We delen uw persoonlijke gegevens alleen in de volgende gevallen:',
      item1: 'Met uw expliciete toestemming',
      item2: 'Om te voldoen aan wettelijke verplichtingen',
      item3: 'Met vertrouwde serviceproviders die namens ons werken'
    },
    
    cookies: {
      title: 'Cookies',
      content: 'We gebruiken cookies om uw ervaring te verbeteren en onze diensten te analyseren.',
      link: 'Lees ons volledige cookiebeleid'
    },
    
    rights: {
      title: 'Uw rechten',
      intro: 'Onder de AVG heeft u de volgende rechten:',
      item1: 'Recht op inzage in uw persoonlijke gegevens',
      item2: 'Recht op correctie van onjuiste gegevens',
      item3: 'Recht op verwijdering van uw gegevens',
      item4: 'Recht op beperking van de verwerking'
    },
    
    retention: {
      title: 'Bewaartermijnen',
      content: 'We bewaren uw persoonlijke gegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld, tenzij een langere bewaartermijn wettelijk vereist is.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'Voor vragen over dit privacybeleid of uw persoonlijke gegevens, neem contact op met:',
      email: 'E-mail',
      phone: 'Telefoon'
    }
  },
  
  // Terms of Service
  terms: {
    title: 'Algemene Voorwaarden',
    metaTitle: 'Algemene Voorwaarden - Wasplanning',
    metaDescription: 'De algemene voorwaarden voor het gebruik van Wasplanning diensten.',
    lastUpdated: 'Laatst bijgewerkt: {date}',
    
    acceptance: {
      title: 'Acceptatie van voorwaarden',
      content: 'Door gebruik te maken van Wasplanning gaat u akkoord met deze algemene voorwaarden. Als u niet akkoord gaat, mag u onze diensten niet gebruiken.'
    },
    
    serviceDescription: {
      title: 'Omschrijving van de dienst',
      content: 'Wasplanning biedt een digitaal planningssysteem voor autowasprocessen in garages, inclusief real-time tracking, automatische toewijzing en rapportage functionaliteiten.'
    },
    
    userAccounts: {
      title: 'Gebruikersaccounts',
      intro: 'Om onze diensten te gebruiken, moet u een account aanmaken. U bent verantwoordelijk voor:',
      item1: 'Het verstrekken van accurate en actuele informatie',
      item2: 'Het veilig houden van uw accountgegevens',
      item3: 'Alle activiteiten onder uw account',
      item4: 'Het direct melden van ongeautoriseerd gebruik'
    },
    
    acceptableUse: {
      title: 'Acceptabel gebruik',
      intro: 'U mag onze diensten niet gebruiken voor:',
      item1: 'Illegale activiteiten of het overtreden van rechten van anderen',
      item2: 'Het versturen van spam of ongewenste communicatie',
      item3: 'Het proberen te hacken of schade toe te brengen aan onze systemen',
      item4: 'Het delen van uw accounttoegang met ongeautoriseerde personen',
      item5: 'Activiteiten die onze diensten kunnen verstoren'
    },
    
    payment: {
      title: 'Betaling en facturering',
      intro: 'Voor betaalde diensten gelden de volgende voorwaarden:',
      item1: 'Betalingen worden maandelijks vooraf in rekening gebracht',
      item2: 'Alle prijzen zijn exclusief BTW tenzij anders vermeld',
      item3: 'Betalingen dienen binnen 14 dagen na factuurdatum te worden voldaan',
      item4: 'Bij niet-tijdige betaling kunnen we de dienstverlening opschorten'
    },
    
    intellectualProperty: {
      title: 'Intellectueel eigendom',
      content: 'Alle rechten op de Wasplanning software, inclusief maar niet beperkt tot auteursrechten, handelsmerken en octrooien, blijven eigendom van Wasplanning. U krijgt een beperkt gebruiksrecht voor de duur van uw abonnement.'
    },
    
    dataProtection: {
      title: 'Gegevensbescherming',
      content: 'We verwerken persoonlijke gegevens volgens ons privacybeleid en in overeenstemming met de AVG.',
      link: 'Bekijk ons privacybeleid'
    },
    
    liability: {
      title: 'Aansprakelijkheid',
      content: 'Wasplanning is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst of gemiste besparingen. Onze totale aansprakelijkheid is beperkt tot het bedrag dat u in de laatste 12 maanden heeft betaald.'
    },
    
    termination: {
      title: 'Beëindiging',
      intro: 'Beide partijen kunnen het abonnement beëindigen:',
      item1: 'Met inachtneming van een opzegtermijn van één maand',
      item2: 'Direct bij materiële schending van deze voorwaarden',
      item3: 'Bij beëindiging worden uw gegevens volgens ons dataretentiebeleid behandeld'
    },
    
    changes: {
      title: 'Wijzigingen',
      content: 'We kunnen deze voorwaarden van tijd tot tijd wijzigen. We zullen u op de hoogte stellen van materiële wijzigingen via e-mail of via onze dienst.'
    },
    
    governing: {
      title: 'Toepasselijk recht',
      content: 'Deze voorwaarden worden beheerst door Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in Amsterdam.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'Voor vragen over deze algemene voorwaarden:',
      email: 'E-mail',
      phone: 'Telefoon'
    }
  },
  
  // Cookie Policy
  cookies: {
    title: 'Cookiebeleid',
    metaTitle: 'Cookiebeleid - Wasplanning',
    metaDescription: 'Informatie over hoe Wasplanning cookies gebruikt.',
    lastUpdated: 'Laatst bijgewerkt: {date}',
    
    intro: {
      title: 'Introductie',
      content: 'Dit cookiebeleid legt uit hoe Wasplanning cookies en vergelijkbare technologieën gebruikt om u te herkennen wanneer u onze website bezoekt.'
    },
    
    what: {
      title: 'Wat zijn cookies?',
      content: 'Cookies zijn kleine tekstbestanden die op uw apparaat worden geplaatst wanneer u een website bezoekt. Ze worden veel gebruikt om websites efficiënt te laten werken en om informatie te verstrekken aan de eigenaren van de site.'
    },
    
    types: {
      title: 'Soorten cookies die we gebruiken',
      necessary: {
        title: 'Noodzakelijke cookies',
        description: 'Deze cookies zijn essentieel voor het functioneren van onze website.',
        cookie1: {
          name: 'session_id',
          purpose: 'Behoudt uw sessie tijdens het bezoek'
        },
        cookie2: {
          name: 'security_token',
          purpose: 'Beschermt tegen cross-site request forgery aanvallen'
        }
      },
      functional: {
        title: 'Functionele cookies',
        description: 'Deze cookies onthouden uw voorkeuren en keuzes.',
        cookie1: {
          name: 'language',
          purpose: 'Onthoudt uw taalvoorkeur'
        },
        cookie2: {
          name: 'timezone',
          purpose: 'Bewaart uw tijdzone instelling'
        }
      },
      analytics: {
        title: 'Analytische cookies',
        description: 'Deze cookies helpen ons te begrijpen hoe bezoekers onze website gebruiken.',
        cookie1: {
          name: '_ga',
          purpose: 'Google Analytics voor het meten van websitegebruik'
        },
        cookie2: {
          name: '_gid',
          purpose: 'Google Analytics voor het onderscheiden van gebruikers'
        }
      }
    },
    
    thirdParty: {
      title: 'Cookies van derden',
      content: 'Sommige van onze pagina\'s kunnen cookies van derden bevatten, bijvoorbeeld van onze betalingsprovider of analytische diensten. We hebben geen controle over deze cookies.'
    },
    
    manage: {
      title: 'Cookies beheren',
      intro: 'U kunt cookies beheren via uw browserinstellingen:',
      chrome: 'Instellingen > Privacy en beveiliging > Cookies',
      firefox: 'Opties > Privacy & Beveiliging > Cookies',
      safari: 'Voorkeuren > Privacy > Cookies',
      edge: 'Instellingen > Privacy, zoeken en services > Cookies',
      warning: 'Let op: het uitschakelen van cookies kan de functionaliteit van onze website beperken.'
    },
    
    consent: {
      title: 'Toestemming',
      content: 'Door onze website te gebruiken, stemt u in met ons gebruik van cookies zoals beschreven in dit beleid. U kunt uw toestemming op elk moment intrekken door cookies uit te schakelen in uw browser.'
    },
    
    updates: {
      title: 'Updates van dit beleid',
      content: 'We kunnen dit cookiebeleid van tijd tot tijd bijwerken. We raden u aan dit beleid regelmatig te controleren voor eventuele wijzigingen.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'Voor vragen over ons cookiebeleid:',
      email: 'E-mail',
      phone: 'Telefoon'
    }
  }
}