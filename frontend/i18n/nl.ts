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
    next: 'Volgende'
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
  }
}