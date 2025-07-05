# Database Module

This module contains database setup utilities, seed data, and database management scripts.

## Overview

The database module provides tools for database initialization, seeding, and management. It works in conjunction with TypeORM migrations to ensure a consistent database state across environments.

## Structure

```
database/
└── seeds/
    ├── index.ts           # Main seeding entry point
    └── super-admin.seed.ts # Super admin user seeding
```

## Components

### Seeds

#### index.ts
Main seeding orchestrator that:
- Establishes database connection
- Runs all seed files in order
- Handles seeding errors gracefully
- Provides logging and status updates

#### super-admin.seed.ts
Creates the initial super admin user required for system access:
- Creates default tenant for super admin
- Generates super admin user with secure password
- Handles existing user detection
- Provides feedback on seed status

## Usage

### Running Seeds

#### Development
```bash
npm run seed
```

#### Production
```bash
npm run seed:prod
```

#### Manual Execution
```typescript
import { runSeeds } from './src/database/seeds';

// Run all seeds
await runSeeds();
```

### Seed Data

The seeding process creates:

1. **Default Super Admin Tenant**
   - Name: `system`
   - Display Name: `System`
   - Language: `nl` (Dutch)
   - Active status: `true`

2. **Super Admin User**
   - Email: From `SUPER_ADMIN_EMAIL` environment variable
   - Password: From `SUPER_ADMIN_PASSWORD` environment variable
   - Role: `SUPER_ADMIN`
   - Name: "Super" "Admin"
   - Active status: `true`

## Environment Variables

Required environment variables for seeding:

```env
SUPER_ADMIN_EMAIL=admin@wasplanning.nl
SUPER_ADMIN_PASSWORD=secure-password-here
```

## Seed Files Structure

### Creating New Seeds

1. Create new seed file in `seeds/` directory:
```typescript
// seeds/new-seed.seed.ts
import { DataSource } from 'typeorm';
import { YourEntity } from '../entities/your-entity.entity';

export async function seedYourData(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(YourEntity);
  
  // Check if data already exists
  const existing = await repository.findOne({ where: { /* criteria */ } });
  if (existing) {
    console.log('Your data already exists, skipping...');
    return;
  }
  
  // Create seed data
  const entity = repository.create({
    // your data here
  });
  
  await repository.save(entity);
  console.log('Your data seeded successfully');
}
```

2. Add to main index.ts:
```typescript
import { seedYourData } from './new-seed.seed';

export async function runSeeds(): Promise<void> {
  // ... existing code
  
  await seedYourData(dataSource);
  
  // ... rest of code
}
```

## Database Connection

Seeds use the same configuration as the main application:
- Reads from environment variables
- Uses TypeORM data source
- Automatically handles connection lifecycle

## Error Handling

The seeding system includes:
- **Idempotent Operations**: Seeds can be run multiple times safely
- **Error Recovery**: Failed seeds don't crash the entire process
- **Logging**: Detailed logging for troubleshooting
- **Validation**: Checks for required environment variables

## Best Practices

1. **Idempotency**: Always check if data exists before creating
2. **Environment Variables**: Use environment variables for sensitive data
3. **Error Handling**: Wrap seed operations in try-catch blocks
4. **Logging**: Provide clear feedback on seed operations
5. **Dependencies**: Consider seed order and dependencies
6. **Testing**: Test seeds in isolated environments

## Integration with Migrations

Seeds work alongside TypeORM migrations:

1. **Migrations**: Handle schema changes
2. **Seeds**: Handle initial data requirements
3. **Order**: Run migrations first, then seeds

## Production Considerations

- Seeds should be run after deploying migrations
- Use secure passwords and credentials
- Consider using secrets management for sensitive data
- Monitor seed execution for failures
- Have rollback procedures for seed failures