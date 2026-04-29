import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeArticleTags1777378000000 implements MigrationInterface {
  name = "NormalizeArticleTags1777378000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "article_tags" ("articleId" integer NOT NULL, "tagId" integer NOT NULL, CONSTRAINT "PK_article_tags" PRIMARY KEY ("articleId", "tagId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_article_tags_article" ON "article_tags" ("articleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_article_tags_tag" ON "article_tags" ("tagId")`,
    );

    await queryRunner.query(`
      INSERT INTO "tags" ("name", "description", "created_at", "updated_at")
      SELECT DISTINCT tag_name.name, NULL, now(), now()
      FROM (
        SELECT btrim(raw_tag.name) AS name
        FROM "articles"
        CROSS JOIN LATERAL regexp_split_to_table(COALESCE("articles"."tagList", ''), ',') AS raw_tag(name)
      ) AS tag_name
      WHERE tag_name.name <> ''
      ON CONFLICT ("name") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "article_tags" ("articleId", "tagId")
      SELECT article.id, tag.id
      FROM "articles" article
      CROSS JOIN LATERAL regexp_split_to_table(COALESCE(article."tagList", ''), ',') AS raw_tag(name)
      INNER JOIN "tags" tag ON tag.name = btrim(raw_tag.name)
      WHERE btrim(raw_tag.name) <> ''
      ON CONFLICT DO NOTHING
    `);

    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tagList"`);
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_article_tags_article" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" ADD CONSTRAINT "FK_article_tags_tag" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_article_tags_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "article_tags" DROP CONSTRAINT "FK_article_tags_article"`,
    );
    await queryRunner.query(
      `ALTER TABLE "articles" ADD "tagList" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`
      UPDATE "articles" article
      SET "tagList" = tag_values."tagList"
      FROM (
        SELECT article_tag."articleId", string_agg(tag.name, ',' ORDER BY tag.name) AS "tagList"
        FROM "article_tags" article_tag
        INNER JOIN "tags" tag ON tag.id = article_tag."tagId"
        GROUP BY article_tag."articleId"
      ) AS tag_values
      WHERE article.id = tag_values."articleId"
    `);
    await queryRunner.query(`DROP INDEX "public"."IDX_article_tags_tag"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_article_tags_article"`);
    await queryRunner.query(`DROP TABLE "article_tags"`);
  }
}
