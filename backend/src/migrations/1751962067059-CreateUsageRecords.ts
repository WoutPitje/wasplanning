import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsageRecords1751962067059 implements MigrationInterface {
  name = 'CreateUsageRecords1751962067059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create usage type enum
    await queryRunner.query(`
      CREATE TYPE "usage_type" AS ENUM('cars_washed', 'active_users')
    `);

    // Create usage_records table
    await queryRunner.query(`
      CREATE TABLE "usage_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "record_type" "usage_type" NOT NULL,
        "period_start" date NOT NULL,
        "period_end" date NOT NULL,
        "count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usage_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usage_records_tenant_type_period" UNIQUE ("tenant_id", "record_type", "period_start")
      )
    `);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX "IDX_usage_records_tenant_period" ON "usage_records" ("tenant_id", "period_start")`,
    );

    // Initialize usage records for all existing tenants
    await queryRunner.query(`
      INSERT INTO "usage_records" (
        "tenant_id",
        "record_type",
        "period_start",
        "period_end",
        "count"
      )
      SELECT 
        s.tenant_id,
        usage_type.type,
        DATE(s.current_period_start),
        DATE(s.current_period_end),
        0
      FROM subscriptions s
      CROSS JOIN (
        SELECT 'cars_washed'::usage_type as type
        UNION ALL
        SELECT 'active_users'::usage_type as type
      ) as usage_type
      WHERE s.status = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_usage_records_tenant_period"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "usage_records"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "usage_type"`);
  }
}
