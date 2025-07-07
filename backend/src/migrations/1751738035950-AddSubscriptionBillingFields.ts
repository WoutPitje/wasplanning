import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionBillingFields1751738035950 implements MigrationInterface {
    name = 'AddSubscriptionBillingFields1751738035950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to subscriptions table
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "credit_balance" numeric(10,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "next_payment_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "mollie_customer_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "mollie_mandate_id" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "mollie_subscription_id" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "mollie_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "mollie_mandate_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "mollie_customer_id"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "next_payment_date"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "credit_balance"`);
    }
}