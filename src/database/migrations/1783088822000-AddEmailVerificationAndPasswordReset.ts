import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationAndPasswordReset1783088822000 implements MigrationInterface {
  name = "AddEmailVerificationAndPasswordReset1783088822000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailVerificationTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailVerificationExpiresAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "passwordResetTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "passwordResetExpiresAt" TIMESTAMP`,
    );
    // Grandfather accounts that predate verification: they registered when
    // no email was ever sent, so there is nothing they could have clicked.
    await queryRunner.query(`UPDATE "user" SET "emailVerified" = true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "passwordResetExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "passwordResetTokenHash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "emailVerificationExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "emailVerificationTokenHash"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailVerified"`);
  }
}
