export const nl = {
  title: 'Documentatie',
  subtitle: 'Uitgebreide documentatie voor het Wasplanning systeem en API',
  metaTitle: 'Documentatie - Wasplanning',
  metaDescription: 'Volledige technische documentatie voor het Wasplanning systeem en REST API',
  
  toc: {
    title: 'Inhoudsopgave',
    systemOverview: 'Systeemoverzicht',
    authentication: 'Authenticatie',
    multiTenancy: 'Multi-Tenancy',
    apiDocumentation: 'API Documentatie',
    gettingStarted: 'Aan de Slag'
  },
  
  systemOverview: {
    title: 'Systeemoverzicht',
    description: 'Wasplanning is een moderne, multi-tenant wasplanning oplossing gebouwd met een microservices architectuur en sterke focus op veiligheid en schaalbaarheid.',
    
    architecture: {
      title: 'Technische Architectuur',
      backend: 'Backend: NestJS met TypeScript, PostgreSQL database en Redis caching',
      frontend: 'Frontend: Nuxt 3 met Vue 3, shadcn-vue components en TailwindCSS',
      database: 'Database: PostgreSQL met Row-Level Security voor tenant isolatie',
      storage: 'File Storage: MinIO S3-compatible storage met per-tenant buckets',
      cache: 'Cache: Redis met tenant-specifieke namespacing'
    },
    
    features: {
      title: 'Belangrijkste Functionaliteiten',
      multiTenant: 'Complete multi-tenant isolatie op database en applicatie niveau',
      rbac: 'Role-based access control met 6 verschillende gebruikersrollen',
      realtime: 'Real-time updates via WebSocket verbindingen',
      api: 'RESTful API met volledige Swagger/OpenAPI documentatie',
      security: 'Enterprise-grade beveiliging met JWT authenticatie en audit logging'
    }
  },
  
  authentication: {
    title: 'Authenticatie & Autorisatie',
    description: 'Het systeem gebruikt JWT tokens voor authenticatie met role-based access control (RBAC) voor autorisatie. Elke gebruiker behoort tot één tenant en heeft een specifieke rol.',
    
    jwt: {
      title: 'JWT Token Structuur',
      description: 'Alle API requests vereisen een geldig JWT token in de Authorization header.',
      structure: 'JWT Token Payload Structuur'
    },
    
    roles: {
      title: 'Gebruikersrollen',
      superAdmin: 'Beheert alle tenants, kan impersoneren en systeem configureren',
      garageAdmin: 'Beheert eigen garage tenant, gebruikers en instellingen',
      wasplanner: 'Plant en beheert wastaken binnen eigen tenant',
      werkplaats: 'Meldt auto\'s aan voor wasbeurt binnen eigen tenant'
    }
  },
  
  multiTenancy: {
    title: 'Multi-Tenant Architectuur',
    description: 'Het systeem ondersteunt complete multi-tenancy met strikte data isolatie tussen verschillende garages (tenants). Elke tenant heeft volledige scheiding van data, configuratie en gebruikers.',
    
    isolation: {
      title: 'Tenant Isolatie',
      database: 'Row-Level Security policies in PostgreSQL voor complete data scheiding',
      storage: 'Afzonderlijke MinIO buckets per tenant voor file storage',
      cache: 'Tenant-specifieke Redis namespacing voor cache data',
      api: 'Tenant context wordt automatisch toegevoegd aan alle API requests'
    },
    
    security: {
      title: 'Beveiliging',
      description: 'Tenant isolatie wordt afgedwongen op meerdere niveaus om cross-tenant data access te voorkomen.',
      alertTitle: 'Belangrijke Beveiligingsnota',
      alertDescription: 'Alle API endpoints controleren automatisch tenant toegang. Cross-tenant data access is technisch onmogelijk door Row-Level Security policies.'
    }
  },
  
  api: {
    title: 'API Documentatie',
    description: 'Wasplanning biedt een volledige REST API met OpenAPI 3.0 specificatie. Alle endpoints zijn gedocumenteerd via Swagger UI.',
    
    swagger: {
      title: 'Swagger UI',
      description: 'Interactieve API documentatie met test mogelijkheden',
      button: 'Open Swagger Documentatie'
    },
    
    endpoints: {
      title: 'Beschikbare Endpoints',
      description: 'Huidige geïmplementeerde API endpoints'
    },
    
    authentication: {
      title: 'API Authenticatie',
      description: 'Alle API requests vereisen een Bearer token in de Authorization header.',
      example: 'Voorbeeld Authorization Header'
    },
    
    rateLimiting: {
      title: 'Rate Limiting',
      description: 'API endpoints hebben rate limiting om misbruik te voorkomen:',
      global: 'Globaal: 1000 requests per uur per IP adres',
      perTenant: 'Per tenant: 5000 requests per uur',
      auth: 'Auth endpoints: 10 pogingen per 15 minuten per IP'
    }
  },
  
  gettingStarted: {
    title: 'Aan de Slag',
    description: 'Volg deze stappen om toegang te krijgen tot de Wasplanning API en uw eerste integratie te bouwen.',
    
    steps: {
      title: 'Stap-voor-stap Handleiding',
      step1: {
        title: 'Account Aanmaken',
        description: 'Registreer uw garage bij Wasplanning en kies het juiste abonnement (API toegang vanaf Groei pakket)'
      },
      step2: {
        title: 'API Credentials',
        description: 'Log in op uw dashboard en genereer API credentials in de instellingen sectie'
      },
      step3: {
        title: 'Authenticatie Testen',
        description: 'Test uw credentials door een POST request te sturen naar /api/v1/auth/login'
      },
      step4: {
        title: 'API Verkennen',
        description: 'Gebruik de Swagger UI om beschikbare endpoints te verkennen en te testen'
      }
    },
    
    support: {
      title: 'Ondersteuning',
      description: 'Heeft u vragen tijdens de integratie? Neem contact op met ons support team.',
      email: 'Email Ondersteuning',
      swagger: 'Swagger Documentatie'
    }
  }
}

export const en = {
  title: 'Documentation',
  subtitle: 'Comprehensive documentation for the Wasplanning system and API',
  metaTitle: 'Documentation - Wasplanning',
  metaDescription: 'Complete technical documentation for the Wasplanning system and REST API',
  
  toc: {
    title: 'Table of Contents',
    systemOverview: 'System Overview',
    authentication: 'Authentication',
    multiTenancy: 'Multi-Tenancy',
    apiDocumentation: 'API Documentation',
    gettingStarted: 'Getting Started'
  },
  
  systemOverview: {
    title: 'System Overview',
    description: 'Wasplanning is a modern, multi-tenant wash planning solution built with microservices architecture and strong focus on security and scalability.',
    
    architecture: {
      title: 'Technical Architecture',
      backend: 'Backend: NestJS with TypeScript, PostgreSQL database and Redis caching',
      frontend: 'Frontend: Nuxt 3 with Vue 3, shadcn-vue components and TailwindCSS',
      database: 'Database: PostgreSQL with Row-Level Security for tenant isolation',
      storage: 'File Storage: MinIO S3-compatible storage with per-tenant buckets',
      cache: 'Cache: Redis with tenant-specific namespacing'
    },
    
    features: {
      title: 'Key Features',
      multiTenant: 'Complete multi-tenant isolation at database and application level',
      rbac: 'Role-based access control with 6 different user roles',
      realtime: 'Real-time updates via WebSocket connections',
      api: 'RESTful API with full Swagger/OpenAPI documentation',
      security: 'Enterprise-grade security with JWT authentication and audit logging'
    }
  },
  
  authentication: {
    title: 'Authentication & Authorization',
    description: 'The system uses JWT tokens for authentication with role-based access control (RBAC) for authorization. Each user belongs to one tenant and has a specific role.',
    
    jwt: {
      title: 'JWT Token Structure',
      description: 'All API requests require a valid JWT token in the Authorization header.',
      structure: 'JWT Token Payload Structure'
    },
    
    roles: {
      title: 'User Roles',
      superAdmin: 'Manages all tenants, can impersonate and configure system',
      garageAdmin: 'Manages own garage tenant, users and settings',
      wasplanner: 'Plans and manages wash tasks within own tenant',
      werkplaats: 'Reports cars for washing within own tenant'
    }
  },
  
  multiTenancy: {
    title: 'Multi-Tenant Architecture',
    description: 'The system supports complete multi-tenancy with strict data isolation between different garages (tenants). Each tenant has complete separation of data, configuration and users.',
    
    isolation: {
      title: 'Tenant Isolation',
      database: 'Row-Level Security policies in PostgreSQL for complete data separation',
      storage: 'Separate MinIO buckets per tenant for file storage',
      cache: 'Tenant-specific Redis namespacing for cache data',
      api: 'Tenant context is automatically added to all API requests'
    },
    
    security: {
      title: 'Security',
      description: 'Tenant isolation is enforced at multiple levels to prevent cross-tenant data access.',
      alertTitle: 'Important Security Note',
      alertDescription: 'All API endpoints automatically check tenant access. Cross-tenant data access is technically impossible due to Row-Level Security policies.'
    }
  },
  
  api: {
    title: 'API Documentation',
    description: 'Wasplanning provides a complete REST API with OpenAPI 3.0 specification. All endpoints are documented via Swagger UI.',
    
    swagger: {
      title: 'Swagger UI',
      description: 'Interactive API documentation with testing capabilities',
      button: 'Open Swagger Documentation'
    },
    
    endpoints: {
      title: 'Available Endpoints',
      description: 'Currently implemented API endpoints'
    },
    
    authentication: {
      title: 'API Authentication',
      description: 'All API requests require a Bearer token in the Authorization header.',
      example: 'Example Authorization Header'
    },
    
    rateLimiting: {
      title: 'Rate Limiting',
      description: 'API endpoints have rate limiting to prevent abuse:',
      global: 'Global: 1000 requests per hour per IP address',
      perTenant: 'Per tenant: 5000 requests per hour',
      auth: 'Auth endpoints: 10 attempts per 15 minutes per IP'
    }
  },
  
  gettingStarted: {
    title: 'Getting Started',
    description: 'Follow these steps to get access to the Wasplanning API and build your first integration.',
    
    steps: {
      title: 'Step-by-step Guide',
      step1: {
        title: 'Create Account',
        description: 'Register your garage with Wasplanning and choose the right subscription (API access from Growth package)'
      },
      step2: {
        title: 'API Credentials',
        description: 'Log into your dashboard and generate API credentials in the settings section'
      },
      step3: {
        title: 'Test Authentication',
        description: 'Test your credentials by sending a POST request to /api/v1/auth/login'
      },
      step4: {
        title: 'Explore API',
        description: 'Use the Swagger UI to explore and test available endpoints'
      }
    },
    
    support: {
      title: 'Support',
      description: 'Have questions during integration? Contact our support team.',
      email: 'Email Support',
      swagger: 'Swagger Documentation'
    }
  }
}