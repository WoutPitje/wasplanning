import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionsToTenants1751959672601
  implements MigrationInterface
{
  name = 'AddSubscriptionsToTenants1751959672601';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription status enum
    await queryRunner.query(`
      CREATE TYPE "subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid')
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "stripe_subscription_id" character varying,
        "stripe_customer_id" character varying,
        "status" "subscription_status" NOT NULL DEFAULT 'active',
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end" TIMESTAMP NOT NULL,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "canceled_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscriptions_tenant_id" UNIQUE ("tenant_id"),
        CONSTRAINT "UQ_subscriptions_stripe_subscription_id" UNIQUE ("stripe_subscription_id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_tenant_id" ON "subscriptions" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_stripe_subscription_id" ON "subscriptions" ("stripe_subscription_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_stripe_customer_id" ON "subscriptions" ("stripe_customer_id")`,
    );

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_tenant_id" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD CONSTRAINT "FK_subscriptions_plan_id" 
      FOREIGN KEY ("plan_id") 
      REFERENCES "subscription_plans"("id") 
      ON DELETE RESTRICT 
      ON UPDATE NO ACTION
    `);

    // Get the free plan ID
    const [freePlan] = await queryRunner.query(
      `SELECT id FROM subscription_plans WHERE name = 'free'`,
    );

    if (!freePlan) {
      throw new Error(
        'Free plan not found. Please run CreateSubscriptionPlans migration first.',
      );
    }

    // Create subscriptions for all existing tenants with FREE plan
    await queryRunner.query(
      `
      INSERT INTO "subscriptions" (
        "tenant_id",
        "plan_id",
        "status",
        "current_period_start",
        "current_period_end"
      )
      SELECT 
        t.id,
        $1,
        'active',
        t.created_at,
        t.created_at + INTERVAL '30 days'
      FROM tenants t
      WHERE NOT EXISTS (
        SELECT 1 FROM subscriptions s WHERE s.tenant_id = t.id
      )
    `,
      [freePlan.id],
    );

    // Add audit log entries for subscription creation
    const hasAuditTable = await queryRunner.hasTable('audit_logs');
    if (hasAuditTable) {
      await queryRunner.query(`
        INSERT INTO "audit_logs" (
          "tenant_id",
          "user_id",
          "action",
          "resource_type",
          "resource_id",
          "details",
          "ip_address",
          "user_agent"
        )
        SELECT 
          s.tenant_id,
          NULL,
          'subscription.created',
          'subscription',
          s.id,
          jsonb_build_object(
            'plan_name', 'free',
            'auto_assigned', true,
            'reason', 'Migration: Assigned free plan to existing tenant'
          ),
          '127.0.0.1',
          'System Migration'
        FROM subscriptions s
        WHERE s.created_at >= NOW() - INTERVAL '1 minute'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_tenant_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_subscriptions_stripe_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_subscriptions_stripe_subscription_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_subscriptions_tenant_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "subscriptions"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "subscription_status"`);
  }
}
