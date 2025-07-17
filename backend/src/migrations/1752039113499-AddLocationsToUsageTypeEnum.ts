import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationsToUsageTypeEnum1752039113499
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'locations' to the usage_records_record_type_enum
    await queryRunner.query(
      `ALTER TYPE "usage_records_record_type_enum" ADD VALUE 'locations'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing values from enums directly
    // We would need to recreate the entire enum and all dependent columns
    // This is left as a no-op for safety
  }
}
