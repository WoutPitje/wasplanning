import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'wasplanning',
  password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
  database: process.env.DATABASE_NAME || 'wasplanning',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

async function revertAllMigrations() {
  try {
    await dataSource.initialize();
    console.log('Data source initialized');

    // Get all executed migrations
    const executedMigrations = await dataSource.showMigrations();
    console.log(`Found ${executedMigrations ? (executedMigrations as any).length : 0} executed migrations`);

    // Keep reverting until no more migrations
    let hasMoreMigrations = true;
    let revertCount = 0;

    while (hasMoreMigrations) {
      try {
        await dataSource.undoLastMigration();
        revertCount++;
        console.log(`Reverted migration #${revertCount}`);
      } catch (error) {
        // No more migrations to revert
        hasMoreMigrations = false;
      }
    }

    if (revertCount === 0) {
      console.log('No migrations to revert');
    } else {
      console.log(`Successfully reverted ${revertCount} migrations`);
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('Error reverting migrations:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  revertAllMigrations()
    .then(() => {
      console.log('All migrations reverted successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to revert migrations:', error);
      process.exit(1);
    });
}