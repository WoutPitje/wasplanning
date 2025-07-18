export const nl = {
  settings: {
    title: 'Systeeminstellingen',
    subtitle: 'Beheer globale systeeminstellingen',
    systemConfig: 'Systeemconfiguratie',
    placeholder: 'Systeeminstellingen komen hier...'
  },
  
  breadcrumb: {
    admin: 'Admin',
    garages: 'Garages',
    details: 'Details',
    edit: 'Bewerken'
  },
  
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
}

export const en = {
  settings: {
    title: 'System Settings',
    subtitle: 'Manage global system settings',
    systemConfig: 'System Configuration',
    placeholder: 'System settings will appear here...'
  },
  
  breadcrumb: {
    admin: 'Admin',
    garages: 'Garages',
    details: 'Details',
    edit: 'Edit'
  },
  
  users: {
    impersonate: 'Impersonate',
    impersonating_as: 'Impersonating as: {email}',
    stop_impersonation: 'Stop Impersonation',
    impersonation: {
      started: 'Successfully started impersonating {email}',
      stopped: 'Stopped impersonating',
      forbidden: 'You do not have permission to impersonate this user',
      user_not_found: 'User not found',
      not_impersonating: 'You are not currently impersonating anyone'
    }
  },
  
  audit: {
    title: 'Audit Logs',
    filters: 'Filters',
    action: 'Action',
    resource: 'Resource',
    user: 'User',
    date: 'Date',
    time: 'Time',
    ip_address: 'IP Address',
    details: 'Details',
    no_logs: 'No audit logs found',
    export: 'Export',
    export_csv: 'Export as CSV',
    view_details: 'View details',
    filter_by_date: 'Filter by date',
    filter_by_action: 'Filter by action',
    filter_by_user: 'Filter by user',
    start_date: 'Start date',
    end_date: 'End date',
    apply_filters: 'Apply filters',
    clear_filters: 'Clear filters',
    actions: {
      'auth.login': 'Logged in',
      'auth.logout': 'Logged out',
      'auth.impersonate.start': 'Started impersonation',
      'auth.impersonate.stop': 'Stopped impersonation',
      'user.created': 'Created user',
      'user.updated': 'Updated user',
      'user.deactivated': 'Deactivated user',
      'user.password_reset': 'Reset password',
      'tenant.created': 'Created garage',
      'tenant.updated': 'Updated garage',
      'tenant.deactivated': 'Deactivated garage'
    },
    resource_types: {
      user: 'User',
      tenant: 'Garage'
    }
  }
}