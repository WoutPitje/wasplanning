import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentMethods1751964307205 implements MigrationInterface {
  name = 'AddPaymentMethods1751964307205';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_usage_records_tenant_period"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscription_plans_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscriptions_tenant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscriptions_stripe_subscription_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_subscriptions_stripe_customer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_records" DROP CONSTRAINT "UQ_usage_records_tenant_type_period"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_methods_type_enum" AS ENUM('card', 'ideal', 'sepa_debit')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "stripe_payment_method_id" character varying NOT NULL, "type" "public"."payment_methods_type_enum" NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "card_brand" character varying, "card_last4" character varying, "card_exp_month" integer, "card_exp_year" integer, "card_fingerprint" character varying, "bank_name" character varying, "bank_last4" character varying, "billing_name" character varying, "billing_email" character varying, "billing_phone" character varying, "billing_address" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1f03501f788e64bf699d206fa51" UNIQUE ("stripe_payment_method_id"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e65eddc13f0cb1694ce740dc6b" ON "payment_methods" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f03501f788e64bf699d206fa5" ON "payment_methods" ("stripe_payment_method_id") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."usage_type" RENAME TO "usage_type_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usage_records_record_type_enum" AS ENUM('cars_washed', 'active_users')`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_records" ALTER COLUMN "record_type" TYPE "public"."usage_records_record_type_enum" USING "record_type"::"text"::"public"."usage_records_record_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."usage_type_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_status" RENAME TO "subscription_status_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'past_due', 'unpaid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" USING "status"::"text"::"public"."subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscription_status_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c84aab004c3233dec60d1f832c" ON "usage_records" ("tenant_id", "period_start") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae18a0f6e0143f06474aa8cef1" ON "subscription_plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6ac03431c311ccb8bbd7d3af1" ON "subscriptions" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a2d09d943f39912a01831a927" ON "subscriptions" ("stripe_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7aa77f6636d26cac1b731cac3a" ON "subscriptions" ("stripe_customer_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_records" ADD CONSTRAINT "UQ_067b215d70d25994365182a7238" UNIQUE ("tenant_id", "record_type", "period_start")`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_e65eddc13f0cb1694ce740dc6b7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_e65eddc13f0cb1694ce740dc6b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_records" DROP CONSTRAINT "UQ_067b215d70d25994365182a7238"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7aa77f6636d26cac1b731cac3a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a2d09d943f39912a01831a927"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6ac03431c311ccb8bbd7d3af1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae18a0f6e0143f06474aa8cef1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c84aab004c3233dec60d1f832c"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_status_old" AS ENUM('active', 'canceled', 'past_due', 'unpaid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscription_status_old" USING "status"::"text"::"public"."subscription_status_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."subscription_status_old" RENAME TO "subscription_status"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usage_type_old" AS ENUM('cars_washed', 'active_users')`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_records" ALTER COLUMN "record_type" TYPE "public"."usage_type_old" USING "record_type"::"text"::"public"."usage_type_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."usage_records_record_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."usage_type_old" RENAME TO "usage_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f03501f788e64bf699d206fa5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e65eddc13f0cb1694ce740dc6b"`,
    );
    await queryRunner.query(`DROP TABLE "payment_methods"`);
    await queryRunner.query(`DROP TYPE "public"."payment_methods_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "usage_records" ADD CONSTRAINT "UQ_usage_records_tenant_type_period" UNIQUE ("tenant_id", "record_type", "period_start")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_stripe_customer_id" ON "subscriptions" ("stripe_customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_stripe_subscription_id" ON "subscriptions" ("stripe_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscriptions_tenant_id" ON "subscriptions" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_subscription_plans_name" ON "subscription_plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_usage_records_tenant_period" ON "usage_records" ("tenant_id", "period_start") `,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
