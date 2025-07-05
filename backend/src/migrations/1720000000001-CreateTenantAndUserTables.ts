import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantAndUserTables1720000000001 implements MigrationInterface {
  name = 'CreateTenantAndUserTables1720000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_role enum
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM(
        'workshop', 
        'washers', 
        'pickup_delivery_planners', 
        'wash_planners', 
        'garage_admin', 
        'super_admin'
      )
    `);

    // Create tenants table
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "display_name" character varying,
        "logo_url" character varying,
        "settings" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_name" UNIQUE ("name"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "first_name" character varying,
        "last_name" character varying,
        "role" "user_role" NOT NULL DEFAULT 'workshop',
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_tenant_id" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_tenants_name" ON "tenants" ("name")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_tenants_name"`);
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_users_tenant_id"`);

    // Drop foreign key constraint
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}