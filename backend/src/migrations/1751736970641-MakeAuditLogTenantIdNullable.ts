import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAuditLogTenantIdNullable1751736970641 implements MigrationInterface {
    name = 'MakeAuditLogTenantIdNullable1751736970641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_tenant_id"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_tenant_id"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tenants_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_stored_filename"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_files_bucket_object"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('workshop', 'washers', 'pickup_delivery_planners', 'wash_planners', 'garage_admin', 'super_admin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'workshop'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
        await queryRunner.query(`ALTER TYPE "public"."file_category" RENAME TO "file_category_old"`);
        await queryRunner.query(`CREATE TYPE "public"."files_category_enum" AS ENUM('profile_photo', 'tenant_logo', 'vehicle_photo', 'wash_before', 'wash_after', 'damage_report', 'invoice', 'document', 'other')`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" TYPE "public"."files_category_enum" USING "category"::"text"::"public"."files_category_enum"`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."file_category_old"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_898d14750b88319b89b1ab66cd"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_898d14750b88319b89b1ab66cd" ON "audit_logs" ("tenant_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_484acb2ff8f3e134dfac8f01e8a" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_a7435dbb7583938d5e7d1376041" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_a7435dbb7583938d5e7d1376041"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_484acb2ff8f3e134dfac8f01e8a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_898d14750b88319b89b1ab66cd"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_898d14750b88319b89b1ab66cd" ON "audit_logs" ("tenant_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TYPE "public"."file_category_old" AS ENUM('profile_photo', 'tenant_logo', 'vehicle_photo', 'wash_before', 'wash_after', 'damage_report', 'invoice', 'document', 'other')`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" TYPE "public"."file_category_old" USING "category"::"text"::"public"."file_category_old"`);
        await queryRunner.query(`ALTER TABLE "files" ALTER COLUMN "category" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."files_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."file_category_old" RENAME TO "file_category"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_old" AS ENUM('workshop', 'washers', 'pickup_delivery_planners', 'wash_planners', 'garage_admin', 'super_admin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'workshop'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`);
        await queryRunner.query(`CREATE INDEX "IDX_files_bucket_object" ON "files" ("bucket_name", "object_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_files_stored_filename" ON "files" ("stored_filename") `);
        await queryRunner.query(`CREATE INDEX "IDX_files_created_at" ON "files" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_files_category" ON "files" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_files_user_id" ON "files" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_files_tenant_id" ON "files" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tenants_name" ON "tenants" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_tenant_id" ON "users" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
