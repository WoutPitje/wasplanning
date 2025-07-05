import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentAndSubscriptionTables1751738035949 implements MigrationInterface {
    name = 'CreatePaymentAndSubscriptionTables1751738035949'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_name_enum" AS ENUM('starter', 'groei', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_billing_type_enum" AS ENUM('subscription', 'usage_based', 'hybrid')`);
        await queryRunner.query(`CREATE TABLE "subscription_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" "public"."subscription_plans_name_enum" NOT NULL, "display_name" character varying(100) NOT NULL, "price_monthly" numeric(10,2) NOT NULL, "price_yearly" numeric(10,2), "billing_type" "public"."subscription_plans_billing_type_enum" NOT NULL, "max_locations" integer, "max_cars_per_month" integer, "max_users" integer, "features" jsonb NOT NULL DEFAULT '{}', "overage_price_per_car" numeric(10,2), "overage_price_per_location" numeric(10,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ae18a0f6e0143f06474aa8cef1f" UNIQUE ("name"), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "provider_method_id" character varying(255) NOT NULL, "type" character varying(50) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."billing_cycles_status_enum" AS ENUM('pending', 'processing', 'paid', 'failed')`);
        await queryRunner.query(`CREATE TABLE "billing_cycles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" uuid NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "base_amount" numeric(10,2) NOT NULL DEFAULT '0', "usage_amount" numeric(10,2) NOT NULL DEFAULT '0', "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "total_amount" numeric(10,2) NOT NULL, "usage_summary" jsonb NOT NULL DEFAULT '{}', "status" "public"."billing_cycles_status_enum" NOT NULL DEFAULT 'pending', "invoice_id" character varying(255), "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e2b9ae007fe8816495a934414bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_billing_cycle_dates" ON "billing_cycles" ("subscription_id", "start_date", "end_date") `);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_billing_interval_enum" AS ENUM('month', 'year')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "payment_method_id" uuid, "status" "public"."subscriptions_status_enum" NOT NULL, "current_period_start" TIMESTAMP NOT NULL, "current_period_end" TIMESTAMP NOT NULL, "billing_interval" "public"."subscriptions_billing_interval_enum" NOT NULL DEFAULT 'month', "provider" character varying(50), "provider_subscription_id" character varying(255), "trial_end" TIMESTAMP, "canceled_at" TIMESTAMP, "cancel_at_period_end" boolean NOT NULL DEFAULT false, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."usage_records_metric_type_enum" AS ENUM('cars_washed', 'active_users', 'active_locations')`);
        await queryRunner.query(`CREATE TABLE "usage_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" uuid NOT NULL, "billing_cycle_id" uuid, "metric_type" "public"."usage_records_metric_type_enum" NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10,4), "recorded_at" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_e511cf9f7dc53851569f87467a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_usage_subscription_metric" ON "usage_records" ("subscription_id", "metric_type", "recorded_at") `);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_type_enum" AS ENUM('payment', 'refund', 'subscription')`);
        await queryRunner.query(`CREATE TYPE "public"."payment_transactions_status_enum" AS ENUM('pending', 'completed', 'failed', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "provider_transaction_id" character varying(255), "type" "public"."payment_transactions_type_enum" NOT NULL, "status" "public"."payment_transactions_status_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'EUR', "description" text, "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_e65eddc13f0cb1694ce740dc6b7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_cycles" ADD CONSTRAINT "FK_28e221bc7070934a5c1829d4569" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_edf01b20528c5479952731a114a" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_records" ADD CONSTRAINT "FK_4733c4313650f4e34a8396599ee" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_records" ADD CONSTRAINT "FK_0ce51dfb6b5e548420340e8e281" FOREIGN KEY ("billing_cycle_id") REFERENCES "billing_cycles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_286456894023d6f3f7431ce66df" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_286456894023d6f3f7431ce66df"`);
        await queryRunner.query(`ALTER TABLE "usage_records" DROP CONSTRAINT "FK_0ce51dfb6b5e548420340e8e281"`);
        await queryRunner.query(`ALTER TABLE "usage_records" DROP CONSTRAINT "FK_4733c4313650f4e34a8396599ee"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_edf01b20528c5479952731a114a"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_f6ac03431c311ccb8bbd7d3af18"`);
        await queryRunner.query(`ALTER TABLE "billing_cycles" DROP CONSTRAINT "FK_28e221bc7070934a5c1829d4569"`);
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_e65eddc13f0cb1694ce740dc6b7"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_transactions_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_usage_subscription_metric"`);
        await queryRunner.query(`DROP TABLE "usage_records"`);
        await queryRunner.query(`DROP TYPE "public"."usage_records_metric_type_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_billing_interval_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_billing_cycle_dates"`);
        await queryRunner.query(`DROP TABLE "billing_cycles"`);
        await queryRunner.query(`DROP TYPE "public"."billing_cycles_status_enum"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP TABLE "subscription_plans"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_billing_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_name_enum"`);
    }

}
