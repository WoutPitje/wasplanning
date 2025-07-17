import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSimpleLocations1752037742128 implements MigrationInterface {
  name = 'CreateSimpleLocations1752037742128';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create simple locations table
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "name" character varying NOT NULL, "address" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );

    // Create user_locations junction table
    await queryRunner.query(
      `CREATE TABLE "user_locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "location_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4afd5dae13173e88183db3cd210" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "unique_user_location" ON "user_locations" ("user_id", "location_id") `,
    );

    // Add foreign keys
    await queryRunner.query(
      `ALTER TABLE "locations" ADD CONSTRAINT "FK_0d60360876129137646731c60c7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_locations" ADD CONSTRAINT "FK_437edca703095b237b5bdb35e22" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_locations" ADD CONSTRAINT "FK_3f495c9a559977dbbc1901a143e" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "user_locations" DROP CONSTRAINT "FK_3f495c9a559977dbbc1901a143e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_locations" DROP CONSTRAINT "FK_437edca703095b237b5bdb35e22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" DROP CONSTRAINT "FK_0d60360876129137646731c60c7"`,
    );

    // Drop tables
    await queryRunner.query(`DROP INDEX "public"."unique_user_location"`);
    await queryRunner.query(`DROP TABLE "user_locations"`);
    await queryRunner.query(`DROP TABLE "locations"`);
  }
}
