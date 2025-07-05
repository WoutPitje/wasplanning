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
    login: 'Login',
    all: 'All',
    actions: 'Actions',
    showing: 'Showing',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    month: 'month',
    hours: 'hours'
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
    },
    
    // Audit logs
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
    auditLogs: 'Audit Logs',
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
  },
  
  // Landing page
  landing: {
    metaTitle: 'Wasplanning - Digital Car Wash Planning for Garages',
    metaDescription: 'Streamline your car wash process with smart planning. Real-time tracking, automatic assignment and full integration with your workshop.',
    
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact'
    },
    
    hero: {
      badge: 'For garages with pickup/delivery service',
      title: 'Smart Wash Planning for Modern Garages',
      subtitle: 'Digitize your car wash process. From workshop to return trip - everything in one system.',
      cta: {
        start: 'Start free trial',
        demo: 'View demo'
      }
    },
    
    stats: {
      garages: 'Garages in the Netherlands',
      timeSaved: 'Less manual coordination',
      certainty: 'Certainty for return trip',
      orderTime: 'For new wash order'
    },
    
    features: {
      title: 'Everything you need',
      subtitle: 'Complete solution for efficient wash management in your garage',
      
      realtime: {
        title: 'Real-time Status Tracking',
        description: 'Track every car from workshop to car wash to ready. Everyone sees the current status immediately.'
      },
      
      smartAssignment: {
        title: 'Smart Assignment',
        description: 'Automatic matching based on capacity, skills and return trip priority.'
      },
      
      priority: {
        title: 'Priority System',
        description: 'Urgent washes automatically get priority. No more stress with urgent return trips.'
      },
      
      multiLocation: {
        title: 'Multi-location Support',
        description: 'Manage multiple locations from one dashboard. Perfect for garage chains.'
      },
      
      reports: {
        title: 'Insightful Reports',
        description: 'Real-time dashboards with performance, lead times and productivity per location.'
      },
      
      mobile: {
        title: 'Mobile Friendly',
        description: 'Fully responsive design. Washers work on tablet or phone, no training needed.'
      }
    },
    
    howItWorks: {
      title: 'How it works',
      subtitle: 'From registration to return trip in 4 simple steps',
      
      step1: {
        title: 'Workshop registers car',
        description: 'Mechanic clicks one button: car ready for wash. No phone calls, no notes.'
      },
      
      step2: {
        title: 'System determines priority',
        description: 'Based on return trip time and wash type, priority is automatically determined.'
      },
      
      step3: {
        title: 'Washer performs wash',
        description: 'Washer sees new tasks immediately, works through list and reports car ready with one click.'
      },
      
      step4: {
        title: 'Planner sees ready status',
        description: 'Pickup/delivery planner has certainty: car is washed and ready for return trip.'
      }
    },
    
    pricing: {
      title: 'Transparent Pricing',
      subtitle: 'No surprises, no setup costs. Start today.',
      popular: 'Most popular',
      cta: 'Try free for 30 days',
      contact: 'Contact us',
      benefits: 'All packages include: ✓ 30 days free trial ✓ No setup costs ✓ Monthly cancellable ✓ Dutch support',
      
      starter: {
        name: 'Starter',
        description: 'Perfect for smaller garages',
        feature1: '1 location',
        feature2: 'Up to 500 cars/month',
        feature3: '5 users',
        feature4: 'Basic features'
      },
      
      growth: {
        name: 'Growth',
        description: 'For growing garages',
        feature1: 'Up to 3 locations',
        feature2: 'Up to 2,000 cars/month',
        feature3: 'Unlimited users',
        feature4: 'All features',
        feature5: 'API access'
      },
      
      enterprise: {
        name: 'Enterprise',
        description: 'For garage chains',
        feature1: 'Unlimited locations',
        feature2: 'Unlimited cars',
        feature3: 'Multi-tenant dashboard',
        feature4: 'Custom integrations',
        feature5: 'SLA guarantee'
      }
    },
    
    roi: {
      title: 'Calculate your savings',
      subtitle: 'See immediately how much time and money you save',
      
      small: {
        title: 'Small Garage (300 cars/month)',
        current: 'Current time spent',
        withSystem: 'With Wasplanning',
        savings: 'Savings'
      },
      
      medium: {
        title: 'Medium-sized Chain (1,500 cars)',
        current: 'Current time spent',
        withSystem: 'With Wasplanning',
        savings: 'Savings'
      }
    },
    
    cta: {
      title: 'Ready to digitize?',
      subtitle: 'Join hundreds of garages already working more efficiently with Wasplanning.',
      startTrial: 'Start free trial',
      contact: 'Request a demo'
    },
    
    footer: {
      description: 'The complete wash planning solution for modern garages.',
      product: 'Product',
      company: 'Company',
      support: 'Support',
      integrations: 'Integrations',
      about: 'About us',
      privacy: 'Privacy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
      docs: 'Documentation',
      help: 'Help Center',
      status: 'System Status',
      rights: 'All rights reserved'
    },
    
    contact: {
      title: 'Contact',
      subtitle: 'Have questions? We\'re here to help.',
      email: {
        title: 'Send us an email',
        description: 'For general inquiries and support',
        response: 'We respond within 24 hours'
      },
      businessHours: 'Available weekdays from 9:00 AM - 5:00 PM'
    }
  },
  
  // Privacy Policy
  privacy: {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy - Wasplanning',
    metaDescription: 'Learn how Wasplanning protects and processes your personal data.',
    lastUpdated: 'Last updated: {date}',
    
    intro: {
      title: 'Introduction',
      content: 'At Wasplanning, we value your privacy. This privacy policy explains how we collect, use and protect your personal data when you use our services.'
    },
    
    dataCollection: {
      title: 'What data we collect',
      intro: 'We collect the following categories of personal data:',
      item1: 'Account data: name, email address, phone number',
      item2: 'Business data: company name, VAT number, address',
      item3: 'Usage data: how you use our service, login data',
      item4: 'Technical data: IP address, browser type, device information'
    },
    
    dataUsage: {
      title: 'How we use your data',
      intro: 'We use your personal data for:',
      item1: 'Providing and improving our services',
      item2: 'Communication about your account and our services',
      item3: 'Complying with legal obligations',
      item4: 'Preventing fraud and abuse'
    },
    
    dataProtection: {
      title: 'Data Protection',
      content: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, modification, disclosure or destruction.'
    },
    
    dataSharing: {
      title: 'Data Sharing',
      intro: 'We only share your personal data in the following cases:',
      item1: 'With your explicit consent',
      item2: 'To comply with legal obligations',
      item3: 'With trusted service providers working on our behalf'
    },
    
    cookies: {
      title: 'Cookies',
      content: 'We use cookies to improve your experience and analyze our services.',
      link: 'Read our full cookie policy'
    },
    
    rights: {
      title: 'Your Rights',
      intro: 'Under the GDPR, you have the following rights:',
      item1: 'Right to access your personal data',
      item2: 'Right to correct inaccurate data',
      item3: 'Right to delete your data',
      item4: 'Right to restrict processing'
    },
    
    retention: {
      title: 'Data Retention',
      content: 'We do not retain your personal data longer than necessary for the purposes for which it was collected, unless a longer retention period is legally required.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'For questions about this privacy policy or your personal data, please contact:',
      email: 'Email',
      phone: 'Phone'
    }
  },
  
  // Terms of Service
  terms: {
    title: 'Terms of Service',
    metaTitle: 'Terms of Service - Wasplanning',
    metaDescription: 'The terms of service for using Wasplanning services.',
    lastUpdated: 'Last updated: {date}',
    
    acceptance: {
      title: 'Acceptance of Terms',
      content: 'By using Wasplanning, you agree to these terms of service. If you do not agree, you may not use our services.'
    },
    
    serviceDescription: {
      title: 'Service Description',
      content: 'Wasplanning provides a digital planning system for car wash processes in garages, including real-time tracking, automatic assignment and reporting functionalities.'
    },
    
    userAccounts: {
      title: 'User Accounts',
      intro: 'To use our services, you must create an account. You are responsible for:',
      item1: 'Providing accurate and current information',
      item2: 'Keeping your account information secure',
      item3: 'All activities under your account',
      item4: 'Immediately reporting unauthorized use'
    },
    
    acceptableUse: {
      title: 'Acceptable Use',
      intro: 'You may not use our services for:',
      item1: 'Illegal activities or violating others\' rights',
      item2: 'Sending spam or unwanted communications',
      item3: 'Attempting to hack or damage our systems',
      item4: 'Sharing your account access with unauthorized persons',
      item5: 'Activities that may disrupt our services'
    },
    
    payment: {
      title: 'Payment and Billing',
      intro: 'The following terms apply to paid services:',
      item1: 'Payments are billed monthly in advance',
      item2: 'All prices exclude VAT unless otherwise stated',
      item3: 'Payments must be made within 14 days of invoice date',
      item4: 'We may suspend service for late payments'
    },
    
    intellectualProperty: {
      title: 'Intellectual Property',
      content: 'All rights to the Wasplanning software, including but not limited to copyrights, trademarks and patents, remain the property of Wasplanning. You receive a limited right to use for the duration of your subscription.'
    },
    
    dataProtection: {
      title: 'Data Protection',
      content: 'We process personal data according to our privacy policy and in compliance with the GDPR.',
      link: 'View our privacy policy'
    },
    
    liability: {
      title: 'Liability',
      content: 'Wasplanning is not liable for indirect damage, consequential damage, lost profits or missed savings. Our total liability is limited to the amount you paid in the last 12 months.'
    },
    
    termination: {
      title: 'Termination',
      intro: 'Either party may terminate the subscription:',
      item1: 'With one month\'s notice',
      item2: 'Immediately for material breach of these terms',
      item3: 'Upon termination, your data will be handled according to our data retention policy'
    },
    
    changes: {
      title: 'Changes',
      content: 'We may change these terms from time to time. We will notify you of material changes via email or through our service.'
    },
    
    governing: {
      title: 'Governing Law',
      content: 'These terms are governed by Dutch law. Disputes will be submitted to the competent court in Amsterdam.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'For questions about these terms of service:',
      email: 'Email',
      phone: 'Phone'
    }
  },
  
  // Cookie Policy
  cookies: {
    title: 'Cookie Policy',
    metaTitle: 'Cookie Policy - Wasplanning',
    metaDescription: 'Information about how Wasplanning uses cookies.',
    lastUpdated: 'Last updated: {date}',
    
    intro: {
      title: 'Introduction',
      content: 'This cookie policy explains how Wasplanning uses cookies and similar technologies to recognize you when you visit our website.'
    },
    
    what: {
      title: 'What are cookies?',
      content: 'Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to the site owners.'
    },
    
    types: {
      title: 'Types of cookies we use',
      necessary: {
        title: 'Necessary cookies',
        description: 'These cookies are essential for our website to function.',
        cookie1: {
          name: 'session_id',
          purpose: 'Maintains your session during the visit'
        },
        cookie2: {
          name: 'security_token',
          purpose: 'Protects against cross-site request forgery attacks'
        }
      },
      functional: {
        title: 'Functional cookies',
        description: 'These cookies remember your preferences and choices.',
        cookie1: {
          name: 'language',
          purpose: 'Remembers your language preference'
        },
        cookie2: {
          name: 'timezone',
          purpose: 'Saves your timezone setting'
        }
      },
      analytics: {
        title: 'Analytics cookies',
        description: 'These cookies help us understand how visitors use our website.',
        cookie1: {
          name: '_ga',
          purpose: 'Google Analytics for measuring website usage'
        },
        cookie2: {
          name: '_gid',
          purpose: 'Google Analytics for distinguishing users'
        }
      }
    },
    
    thirdParty: {
      title: 'Third-party cookies',
      content: 'Some of our pages may contain third-party cookies, for example from our payment provider or analytics services. We have no control over these cookies.'
    },
    
    manage: {
      title: 'Managing cookies',
      intro: 'You can manage cookies through your browser settings:',
      chrome: 'Settings > Privacy and security > Cookies',
      firefox: 'Options > Privacy & Security > Cookies',
      safari: 'Preferences > Privacy > Cookies',
      edge: 'Settings > Privacy, search and services > Cookies',
      warning: 'Note: disabling cookies may limit the functionality of our website.'
    },
    
    consent: {
      title: 'Consent',
      content: 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by disabling cookies in your browser.'
    },
    
    updates: {
      title: 'Updates to this policy',
      content: 'We may update this cookie policy from time to time. We recommend checking this policy regularly for any changes.'
    },
    
    contact: {
      title: 'Contact',
      intro: 'For questions about our cookie policy:',
      email: 'Email',
      phone: 'Phone'
    }
  }
}