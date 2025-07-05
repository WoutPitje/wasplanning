import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageToTenant1751656577843 implements MigrationInterface {
  name = 'AddLanguageToTenant1751656577843';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD "language" character varying(2) NOT NULL DEFAULT 'nl'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "language"`);
  }
}
