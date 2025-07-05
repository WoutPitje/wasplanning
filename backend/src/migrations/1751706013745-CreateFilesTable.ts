import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilesTable1751706013745 implements MigrationInterface {
  name = 'CreateFilesTable1751706013745';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create file_category enum
    await queryRunner.query(`
      CREATE TYPE "file_category" AS ENUM(
        'profile_photo',
        'tenant_logo',
        'vehicle_photo',
        'wash_before',
        'wash_after',
        'damage_report',
        'invoice',
        'document',
        'other'
      )
    `);

    // Create files table
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "category" "file_category" NOT NULL DEFAULT 'other',
        "original_filename" character varying NOT NULL,
        "stored_filename" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "size_bytes" bigint NOT NULL,
        "bucket_name" character varying NOT NULL,
        "object_key" character varying NOT NULL,
        "is_public" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "FK_files_tenant_id" 
      FOREIGN KEY ("tenant_id") 
      REFERENCES "tenants"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "FK_files_user_id" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_files_tenant_id" ON "files" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_files_user_id" ON "files" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_files_category" ON "files" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_files_created_at" ON "files" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_files_stored_filename" ON "files" ("stored_filename")`);
    await queryRunner.query(`CREATE INDEX "IDX_files_bucket_object" ON "files" ("bucket_name", "object_key")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_files_bucket_object"`);
    await queryRunner.query(`DROP INDEX "IDX_files_stored_filename"`);
    await queryRunner.query(`DROP INDEX "IDX_files_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_files_category"`);
    await queryRunner.query(`DROP INDEX "IDX_files_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_files_tenant_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_user_id"`);
    await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_tenant_id"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "files"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "file_category"`);
  }
}