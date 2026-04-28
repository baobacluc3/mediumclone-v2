import { MigrationInterface, QueryRunner } from "typeorm";

export class GeneratedMigration1777377153278 implements MigrationInterface {
    name = 'GeneratedMigration1777377153278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "body" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "articleId" integer, "authorId" integer, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" SERIAL NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL DEFAULT '', "body" text NOT NULL DEFAULT '', "tagList" text NOT NULL DEFAULT '', "favoriteCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" integer, CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "bio" character varying NOT NULL DEFAULT '', "image" character varying NOT NULL DEFAULT '', "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "description" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d90243459a697eadb8ad56e909" ON "tags" ("name") `);
        await queryRunner.query(`CREATE TABLE "follows" ("id" SERIAL NOT NULL, "followerId" integer NOT NULL, "followingId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_105079775692df1f8799ed0fac8" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdb91868b03a2040db408a5333" ON "follows" ("followerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef463dd9a2ce0d673350e36e0f" ON "follows" ("followingId") `);
        await queryRunner.query(`CREATE TABLE "user_favorites_articles" ("userId" integer NOT NULL, "articlesId" integer NOT NULL, CONSTRAINT "PK_2fa8a5bd94301a2985b59f5d397" PRIMARY KEY ("userId", "articlesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_81b77658546f148f69db2e7a48" ON "user_favorites_articles" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa78cf32d784957ec6ae8b1943" ON "user_favorites_articles" ("articlesId") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_b0011304ebfcb97f597eae6c31f" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4548cc4a409b8651ec75f70e280" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_favorites_articles" ADD CONSTRAINT "FK_81b77658546f148f69db2e7a487" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_favorites_articles" ADD CONSTRAINT "FK_aa78cf32d784957ec6ae8b19436" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_favorites_articles" DROP CONSTRAINT "FK_aa78cf32d784957ec6ae8b19436"`);
        await queryRunner.query(`ALTER TABLE "user_favorites_articles" DROP CONSTRAINT "FK_81b77658546f148f69db2e7a487"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4548cc4a409b8651ec75f70e280"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_b0011304ebfcb97f597eae6c31f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa78cf32d784957ec6ae8b1943"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81b77658546f148f69db2e7a48"`);
        await queryRunner.query(`DROP TABLE "user_favorites_articles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef463dd9a2ce0d673350e36e0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdb91868b03a2040db408a5333"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d90243459a697eadb8ad56e909"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
