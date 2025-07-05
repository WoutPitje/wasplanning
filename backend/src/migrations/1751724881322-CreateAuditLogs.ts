import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1751724881322 implements MigrationInterface {
  name = 'CreateAuditLogs1751724881322';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid, "action" character varying(100) NOT NULL, "resource_type" character varying(50) NOT NULL, "resource_id" uuid, "details" jsonb, "ip_address" character varying(45), "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d04b6f2b05825501c1427f0d9" ON "audit_logs" ("resource_type", "resource_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_99fca4a3a4a93c26a756c5aca5" ON "audit_logs" ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f68e345c05e8166ff9deea1ab" ON "audit_logs" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_898d14750b88319b89b1ab66cd" ON "audit_logs" ("tenant_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_6f18d459490bb48923b1f40bdb7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_898d14750b88319b89b1ab66cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f68e345c05e8166ff9deea1ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99fca4a3a4a93c26a756c5aca5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d04b6f2b05825501c1427f0d9"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
  }
}
