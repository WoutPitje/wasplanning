import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRolesToEnglish1736066600000 implements MigrationInterface {
  name = 'UpdateUserRolesToEnglish1736066600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a new enum type with English values
    await queryRunner.query(`
      CREATE TYPE "user_role_new" AS ENUM(
        'workshop', 
        'washers', 
        'pickup_delivery_planners', 
        'wash_planners', 
        'garage_admin', 
        'super_admin'
      )
    `);

    // Update the default value constraint to null temporarily
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);

    // Change the column to use the new enum, mapping old values to new ones
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE "user_role_new" 
      USING CASE 
        WHEN "role"::text = 'werkplaats' THEN 'workshop'
        WHEN "role"::text = 'wassers' THEN 'washers'
        WHEN "role"::text = 'haal_breng_planners' THEN 'pickup_delivery_planners'
        WHEN "role"::text = 'wasplanners' THEN 'wash_planners'
        WHEN "role"::text = 'garage_admin' THEN 'garage_admin'
        WHEN "role"::text = 'super_admin' THEN 'super_admin'
      END::"user_role_new"
    `);

    // Set the new default
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'workshop'`);

    // Drop the old enum type
    await queryRunner.query(`DROP TYPE "user_role"`);

    // Rename the new enum to the original name
    await queryRunner.query(`ALTER TYPE "user_role_new" RENAME TO "user_role"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create the old enum type with Dutch values
    await queryRunner.query(`
      CREATE TYPE "user_role_old" AS ENUM(
        'werkplaats', 
        'wassers', 
        'haal_breng_planners', 
        'wasplanners', 
        'garage_admin', 
        'super_admin'
      )
    `);

    // Drop the default value constraint temporarily
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);

    // Change the column to use the old enum
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE "user_role_old" 
      USING CASE 
        WHEN "role"::text = 'workshop' THEN 'werkplaats'
        WHEN "role"::text = 'washers' THEN 'wassers'
        WHEN "role"::text = 'pickup_delivery_planners' THEN 'haal_breng_planners'
        WHEN "role"::text = 'wash_planners' THEN 'wasplanners'
        WHEN "role"::text = 'garage_admin' THEN 'garage_admin'
        WHEN "role"::text = 'super_admin' THEN 'super_admin'
      END::"user_role_old"
    `);

    // Set the old default
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'werkplaats'`);

    // Drop the new enum type
    await queryRunner.query(`DROP TYPE "user_role"`);

    // Rename the old enum to the original name
    await queryRunner.query(`ALTER TYPE "user_role_old" RENAME TO "user_role"`);
  }
}