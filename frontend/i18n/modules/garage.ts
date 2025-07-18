export const nl = {
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
      lastUpdated: 'Laatst bijgewerkt',
      subscription: 'Abonnement',
      plan: 'Pakket',
      subscriptionStatus: 'Status',
      expiresOn: 'Verloopt op',
      usage: 'Gebruik'
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
      subscription: 'Abonnement',
      users: 'Gebruikers',
      createdAt: 'Aangemaakt',
      actions: 'Acties',
      expires: 'Verloopt',
      renews: 'Verlengt',
      cancelsAt: 'Annuleert op'
    }
  },
  
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
      placeholder: 'Garage instellingen komen hier...',
      tenantSettings: 'Garage Informatie',
      logo: 'Logo',
      uploadLogo: 'Logo Uploaden',
      logoRequirements: 'JPEG, PNG, GIF of WebP. Max 2MB.',
      customBrandingNotAvailable: 'Aangepaste branding is niet beschikbaar in uw huidige pakket.',
      upgradePlan: 'Pakket Upgraden',
      tenantName: 'Garage Naam',
      subscriptionPlan: 'Abonnement',
      fileTooLarge: 'Bestand is groter dan 2MB',
      logoUploaded: 'Logo succesvol geüpload',
      logoUploadFailed: 'Logo uploaden mislukt'
    },
    users: {
      title: 'Gebruikersbeheer',
      subtitle: 'Beheer gebruikers binnen uw garage',
      overview: 'Gebruikersoverzicht',
      placeholder: 'Gebruikersbeheer komt hier...'
    },
    payment: {
      processing: 'Betaling wordt verwerkt...',
      error: {
        title: 'Betaling Mislukt',
        missingPaymentId: 'Geen betaling ID gevonden. Probeer het opnieuw.',
        processingFailed: 'Er ging iets mis bij het verwerken van uw betaling. Probeer het opnieuw.',
        notPaid: 'De betaling is nog niet voltooid. Controleer uw betaling bij Mollie.'
      },
      success: {
        title: 'Betaling Geslaagd',
        subscriptionCreated: 'Uw abonnement is succesvol geactiveerd!',
        planChanged: 'Uw pakket is succesvol gewijzigd!',
        alreadyProcessed: 'Deze betaling is al verwerkt.',
        redirecting: 'U wordt doorgestuurd naar uw abonnement overzicht...'
      },
      backToSubscription: 'Terug naar Abonnement',
      retry: 'Opnieuw Proberen'
    }
  }
}

export const en = {
  tenants: {
    title: 'Garage Management',
    subtitle: 'Manage all garages in the system',
    loading: 'Loading garages...',
    errorLoading: 'Error loading',
    addNew: 'Add New Garage',
    noTenants: 'No garages',
    noTenantsDescription: 'Start by adding a new garage.',
    createdAt: 'Created {date}',
    
    // Details
    details: {
      title: 'Garage Details',
      subtitle: 'View garage information and statistics',
      loading: 'Loading garage details...',
      loadError: 'Could not load garage details',
      garageInfo: 'Garage Information',
      name: 'Garage Name',
      displayName: 'Display Name',
      systemName: 'System Name',
      status: 'Status',
      createdAt: 'Created at',
      logo: 'Logo',
      users: 'Users',
      noUsers: 'No users found',
      settings: 'Settings',
      statistics: 'Statistics',
      totalUsers: 'Total users',
      activeUsers: 'Active users',
      statsLoading: 'Loading statistics...',
      usersByRole: 'Users by role',
      lastUpdated: 'Last updated',
      subscription: 'Subscription',
      plan: 'Plan',
      subscriptionStatus: 'Status',
      expiresOn: 'Expires on',
      usage: 'Usage'
    },
    
    // Edit
    edit: {
      title: 'Edit Garage',
      titleWithName: 'Edit {name}',
      subtitle: 'Update garage information',
      loading: 'Loading garage data...',
      loadError: 'Could not load garage',
      garageInfo: 'Garage Information',
      garageInfoDescription: 'Basic information about the garage',
      systemName: 'System Name',
      systemNameInfo: 'System name cannot be changed',
      displayName: 'Display Name',
      displayNamePlaceholder: 'Garage Amsterdam West',
      logoUrl: 'Logo URL',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      status: 'Status',
      garageActive: 'Garage is active',
      updateError: 'Error updating garage',
      updating: 'Updating...',
      updateButton: 'Save Changes',
      updateSuccess: 'Garage updated',
      updateSuccessDescription: 'The garage information has been successfully updated'
    },
    
    // Form
    form: {
      createTitle: 'Create New Garage',
      editTitle: 'Edit Garage',
      name: 'System Name',
      nameHelp: 'Unique name for the system (no spaces)',
      displayName: 'Display Name',
      displayNameHelp: 'Name as shown to users',
      adminEmail: 'Admin Email Address',
      adminEmailHelp: 'Email address for the garage administrator',
      adminFirstName: 'Admin First Name',
      adminLastName: 'Admin Last Name',
      logoUrl: 'Logo URL',
      logoUrlHelp: 'URL to the garage logo (optional)',
      language: 'Language',
      isActive: 'Garage is active',
      submit: 'Create Garage',
      update: 'Save Changes',
      success: 'Garage successfully created',
      updateSuccess: 'Garage successfully updated',
      errors: {
        nameExists: 'This name already exists',
        emailExists: 'This email address is already in use',
        createFailed: 'Creation failed. Please try again.',
        updateFailed: 'Update failed. Please try again.'
      },
      adminCredentials: 'Administrator Credentials',
      temporaryPassword: 'Temporary password',
      credentialsNote: 'Send these credentials securely to the garage administrator. The temporary password must be changed on first login.',
      copied: 'Copied!',
      copy: 'Copy',
      backToOverview: 'Back to Overview',
      // File upload
      logoPreview: 'Logo preview',
      clickToUpload: 'Click to upload',
      orDragAndDrop: 'or drag and drop',
      allowedFormats: 'PNG, JPG, GIF, WebP up to 2MB',
      maxFileSize: 'Maximum 2MB',
      logoUrlAlternative: 'Or use a URL',
      logoUrlPlaceholder: 'https://example.com/logo.png',
      useUrlInstead: 'Use URL instead of file',
      removeImage: 'Remove image',
      uploading: 'Uploading',
      invalidFileType: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.',
      fileTooLarge: 'File too large. Maximum 2MB allowed.',
      uploadFailed: 'Upload failed. Please try again.',
      logoUploadNote: 'Logo can be uploaded after creation via the edit page'
    },
    
    // Users
    users: {
      title: 'Users',
      addNew: 'New User',
      email: 'Email Address',
      name: 'Name',
      role: 'Role',
      lastLogin: 'Last Login',
      actions: 'Actions',
      noUsers: 'No users',
      deactivate: 'Deactivate',
      activate: 'Activate',
      resetPassword: 'Reset Password'
    },
    
    // Table
    table: {
      name: 'Name',
      systemName: 'System Name',
      status: 'Status',
      subscription: 'Subscription',
      users: 'Users',
      createdAt: 'Created',
      actions: 'Actions',
      expires: 'Expires',
      renews: 'Renews',
      cancelsAt: 'Cancels on'
    }
  },
  
  garageAdmin: {
    dashboard: {
      userManagement: 'User Management',
      userManagementDescription: 'Manage users of your garage',
      garageSettings: 'Garage Settings',
      garageSettingsDescription: 'Configure your garage settings',
      reports: 'Reports',
      reportsDescription: 'View performance and statistics'
    },
    settings: {
      title: 'Garage Settings',
      subtitle: 'Manage your garage configuration',
      generalSettings: 'General Settings',
      placeholder: 'Garage settings will appear here...',
      tenantSettings: 'Garage Information',
      logo: 'Logo',
      uploadLogo: 'Upload Logo',
      logoRequirements: 'JPEG, PNG, GIF or WebP. Max 2MB.',
      customBrandingNotAvailable: 'Custom branding is not available in your current plan.',
      upgradePlan: 'Upgrade Plan',
      tenantName: 'Garage Name',
      subscriptionPlan: 'Subscription Plan',
      fileTooLarge: 'File size exceeds 2MB limit',
      logoUploaded: 'Logo uploaded successfully',
      logoUploadFailed: 'Failed to upload logo'
    },
    users: {
      title: 'User Management',
      subtitle: 'Manage users within your garage',
      overview: 'User Overview',
      placeholder: 'User management will appear here...'
    },
    payment: {
      processing: 'Processing payment...',
      error: {
        title: 'Payment Failed',
        missingPaymentId: 'No payment ID found. Please try again.',
        processingFailed: 'Something went wrong processing your payment. Please try again.',
        notPaid: 'The payment has not been completed yet. Please check your payment with Mollie.'
      },
      success: {
        title: 'Payment Successful',
        subscriptionCreated: 'Your subscription has been successfully activated!',
        planChanged: 'Your plan has been successfully changed!',
        alreadyProcessed: 'This payment has already been processed.',
        redirecting: 'You are being redirected to your subscription overview...'
      },
      backToSubscription: 'Back to Subscription',
      retry: 'Try Again'
    }
  }
}