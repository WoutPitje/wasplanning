import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncompleteStatusToSubscriptionEnum1751978771339
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'incomplete' to the subscription status enum
    await queryRunner.query(
      `ALTER TYPE "subscriptions_status_enum" ADD VALUE 'incomplete'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // We would need to recreate the enum and update all references
    // For now, we'll leave this empty as it's a destructive operation
    console.warn(
      'Removing enum values is not supported. Manual intervention required.',
    );
  }
}
