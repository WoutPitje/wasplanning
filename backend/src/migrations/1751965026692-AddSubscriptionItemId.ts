import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionItemId1751965026692 implements MigrationInterface {
  name = 'AddSubscriptionItemId1751965026692';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "cancel_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "stripe_subscription_item_id" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "stripe_subscription_item_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "cancel_at"`,
    );
  }
}
