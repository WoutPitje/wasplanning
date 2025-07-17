import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPaymentTracking1751968000000
  implements MigrationInterface
{
  name = 'AddSubscriptionPaymentTracking1751968000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add payment failure tracking fields to subscriptions table
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD COLUMN "payment_failed_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD COLUMN "payment_failure_count" INTEGER NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD COLUMN "grace_period_end" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      DROP COLUMN "grace_period_end"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      DROP COLUMN "payment_failure_count"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      DROP COLUMN "payment_failed_at"
    `);
  }
}
