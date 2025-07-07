import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncompleteStatusToSubscriptions1751876497990 implements MigrationInterface {
    name = 'AddIncompleteStatusToSubscriptions1751876497990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'incomplete' to the subscriptions_status_enum
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" ADD VALUE 'incomplete'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing values from enums directly
        // You would need to create a new enum without the value and migrate all data
        // For simplicity, we'll leave this empty as it's rarely needed
        console.warn('Removing enum values is not directly supported in PostgreSQL');
    }
}