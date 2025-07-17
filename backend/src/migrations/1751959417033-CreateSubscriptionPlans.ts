import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionPlans1751959417033
  implements MigrationInterface
{
  name = 'CreateSubscriptionPlans1751959417033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_plans table
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "price_cents" integer NOT NULL,
        "stripe_price_id" character varying,
        "max_cars_per_month" integer,
        "max_active_users" integer,
        "max_locations" integer,
        "features" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscription_plans_name" UNIQUE ("name")
      )
    `);

    // Create index on name for fast lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_plans_name" ON "subscription_plans" ("name")`,
    );

    // Seed the three subscription plans
    await queryRunner.query(`
      INSERT INTO "subscription_plans" (
        "name",
        "display_name",
        "price_cents",
        "stripe_price_id",
        "max_cars_per_month",
        "max_active_users",
        "max_locations",
        "features"
      ) VALUES 
      (
        'free',
        'Gratis',
        0,
        NULL,
        50,
        2,
        1,
        '{
          "api_access": false,
          "advanced_reporting": false,
          "custom_branding": false,
          "priority_support": false,
          "export_data": false,
          "multi_location": false
        }'::jsonb
      ),
      (
        'standard',
        'Standaard',
        10000,
        'price_standard_monthly_eur',
        1500,
        10,
        3,
        '{
          "api_access": false,
          "advanced_reporting": true,
          "custom_branding": false,
          "priority_support": false,
          "export_data": true,
          "multi_location": true
        }'::jsonb
      ),
      (
        'enterprise',
        'Enterprise',
        40000,
        'price_enterprise_monthly_eur',
        NULL,
        NULL,
        NULL,
        '{
          "api_access": true,
          "advanced_reporting": true,
          "custom_branding": true,
          "priority_support": true,
          "export_data": true,
          "multi_location": true
        }'::jsonb
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_subscription_plans_name"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
  }
}
