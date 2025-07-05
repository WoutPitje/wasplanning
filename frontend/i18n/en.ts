export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    create: 'Create',
    back: 'Back',
    active: 'Active',
    inactive: 'Inactive',
    yes: 'Yes',
    no: 'No',
    login: 'Login'
  },
  
  // App
  app: {
    name: 'Wasplanning'
  },
  
  // Home
  home: {
    subtitle: 'Efficient management for your car wash process',
    description: 'Welcome to Wasplanning. Please log in to continue.',
    metaTitle: 'Wasplanning - Efficient Car Wash Management',
    metaDescription: 'Streamline your garage car wash process with our planning system'
  },
  
  // Auth
  login: {
    title: 'Login',
    subtitle: 'Sign in to your account',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email address',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    submit: 'Sign In',
    error: 'Invalid credentials',
    redirecting: 'Redirecting...',
    loggingIn: 'Signing in...',
    loginButton: 'Sign In'
  },
  
  // Admin
  admin: {
    settings: {
      title: 'System Settings',
      subtitle: 'Manage global system settings',
      systemConfig: 'System Configuration',
      placeholder: 'System settings will appear here...'
    },
    
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
        lastUpdated: 'Last updated'
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
        backToOverview: 'Back to Overview'
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
        users: 'Users',
        createdAt: 'Created',
        actions: 'Actions'
      }
    },
    
    // Breadcrumbs
    breadcrumb: {
      admin: 'Admin',
      garages: 'Garages',
      details: 'Details',
      edit: 'Edit'
    },
    
    // Users (for admin)
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
    }
  },
  
  // Garage Admin
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
      placeholder: 'Garage settings will appear here...'
    },
    users: {
      title: 'User Management',
      subtitle: 'Manage users within your garage',
      overview: 'User Overview',
      placeholder: 'User management will appear here...'
    }
  },
  
  // Delivery
  delivery: {
    schedule: {
      completedWashes: 'Completed Washes',
      completedWashesDescription: 'Overview of washes ready for pickup',
      returnPlanning: 'Return Planning',
      returnPlanningDescription: 'Plan return trips for washed vehicles',
      urgentDeliveries: 'Urgent Deliveries',
      urgentDeliveriesDescription: 'Priority deliveries that must be done today'
    }
  },
  
  // Washer
  washer: {
    queue: {
      myTasks: 'My Tasks',
      myTasksDescription: 'Your assigned wash tasks',
      availableTasks: 'Available Tasks',
      availableTasksDescription: 'Tasks available to pick up'
    }
  },
  
  // Wasplanner
  wasplanner: {
    dashboard: {
      queueManagement: 'Queue Management',
      queueManagementDescription: 'Manage the wash queue',
      assignments: 'Assignments',
      assignmentsDescription: 'Assign tasks to washers',
      planningOverview: 'Planning Overview',
      planningOverviewDescription: 'View the complete wash planning'
    }
  },
  
  // Workshop
  workshop: {
    requests: {
      newRequests: 'New Requests',
      newRequestsDescription: 'Create a new wash request',
      newRequestButton: 'New Wash Request',
      myRequests: 'My Requests',
      myRequestsDescription: 'View your wash requests'
    }
  },
  
  // Roles
  roles: {
    workshop: 'Workshop',
    washers: 'Washers',
    pickup_delivery_planners: 'Pickup/Delivery Planners',
    wash_planners: 'Wash Planners',
    garage_admin: 'Garage Admin',
    super_admin: 'Super Admin'
  },
  
  // Navigation
  nav: {
    dashboard: 'Dashboard',
    garages: 'Garages',
    settings: 'Settings',
    logout: 'Logout',
    tenants: 'Tenants',
    users: 'Users',
    queue: 'Queue',
    planning: 'Planning',
    myTasks: 'My Tasks',
    history: 'History',
    newRequests: 'New Requests',
    myRequests: 'My Requests',
    routes: 'Routes'
  },
  
  // Users
  users: {
    title: 'User Management',
    subtitle: 'Manage users within the system',
    addNew: 'New User',
    search: 'Search users...',
    noUsers: 'No users found',
    noUsersDescription: 'Start by adding a new user.',
    
    // Form
    form: {
      createTitle: 'Create New User',
      editTitle: 'Edit User',
      userInfo: 'User Information',
      userInfoDescription: 'Basic information about the user',
      emailCannotBeChanged: 'Email addresses cannot be changed after user creation',
      tenantCannotBeChanged: 'Garage assignment cannot be changed after user creation',
      success: 'User created successfully',
      updateSuccess: 'User updated successfully'
    },
    
    // Details
    details: {
      title: 'User Details',
      subtitle: 'View user information',
      userInfo: 'User Information',
      name: 'Name',
      email: 'Email Address',
      role: 'Role',
      status: 'Status',
      tenant: 'Garage',
      createdAt: 'Created at',
      updatedAt: 'Last updated',
      lastLogin: 'Last login',
      actions: 'Actions'
    },
    
    // Table headers
    table: {
      name: 'Name',
      email: 'Email Address',
      role: 'Role',
      status: 'Status',
      lastLogin: 'Last Login',
      actions: 'Actions',
      tenant: 'Garage'
    },
    
    // Status
    status: {
      active: 'Active',
      inactive: 'Inactive',
      never: 'Never'
    },
    
    // Actions
    actions: {
      edit: 'Edit',
      deactivate: 'Deactivate',
      activate: 'Activate',
      resetPassword: 'Reset Password',
      viewDetails: 'View Details',
      impersonate: 'Impersonate'
    },
    
    // Dialog/Form
    dialog: {
      createTitle: 'Create New User',
      editTitle: 'Edit User',
      firstName: 'First Name',
      firstNamePlaceholder: 'John',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Doe',
      email: 'Email Address',
      emailPlaceholder: 'user@garage.com',
      role: 'Role',
      selectRole: 'Select a role',
      tenant: 'Garage',
      selectTenant: 'Select a garage',
      password: 'Password',
      passwordPlaceholder: 'Leave empty for auto-generated password',
      passwordHelp: 'Min. 8 characters. If empty, password will be auto-generated.',
      isActive: 'User is active',
      submit: 'Create User',
      update: 'Save Changes',
      cancel: 'Cancel',
      
      // Password reset
      resetPasswordTitle: 'Reset Password',
      resetPasswordDescription: 'Enter a new password for {name}',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'New password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm new password',
      resetButton: 'Reset Password',
      
      // Temporary password
      temporaryPasswordTitle: 'Temporary Password',
      temporaryPasswordDescription: 'A temporary password has been created for the new user.',
      temporaryPassword: 'Temporary password',
      copyPassword: 'Copy Password',
      copied: 'Copied!',
      passwordNote: 'This password is shown only once. Send it securely to the user.'
    },
    
    // Filters
    filters: {
      tenant: 'Garage',
      allTenants: 'All garages',
      role: 'Role',
      allRoles: 'All roles'
    },
    
    // Success messages
    success: {
      created: 'User successfully created',
      updated: 'User successfully updated',
      deactivated: 'User deactivated',
      activated: 'User activated',
      passwordReset: 'Password successfully reset'
    },
    
    // Error messages
    errors: {
      createFailed: 'Failed to create user',
      updateFailed: 'Failed to update user',
      deactivateFailed: 'Failed to deactivate user',
      activateFailed: 'Failed to activate user',
      passwordResetFailed: 'Failed to reset password',
      emailExists: 'This email address is already in use',
      loadFailed: 'Failed to load users',
      passwordMismatch: 'Passwords do not match'
    }
  },
  
  // Header
  header: {
    titles: {
      superAdmin: 'Wasplanning Admin',
      garageAdmin: 'Garage Management',
      wasplanner: 'Wash Planning',
      washer: 'Washer Dashboard',
      workshop: 'Workshop',
      deliveryPlanner: 'Pickup/Delivery Planning'
    }
  },
  
  // Languages
  languages: {
    nl: 'Dutch',
    en: 'English'
  }
}