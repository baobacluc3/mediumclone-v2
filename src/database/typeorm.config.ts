import { join } from "path";
import { DataSourceOptions } from "typeorm";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

/**
 * Parses a boolean-ish env var. Returns `fallback` when the var is unset so the
 * default can differ per flag (e.g. synchronize defaults off, SSL defaults off).
 */
function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

/**
 * The single source of truth for how the app talks to Postgres. Both the NestJS
 * runtime (`TypeOrmModule.forRoot`) and the standalone TypeORM CLI
 * (`data-source.ts`) derive their configuration from here so migrations are
 * generated and run against the exact same schema the app uses.
 *
 * Schema is migration-driven: `synchronize` defaults to **off** in every
 * environment. The DDL lives in versioned migration files, not in whatever
 * TypeORM infers from the entities at boot. `TYPEORM_SYNC=true` can re-enable
 * auto-sync for throwaway local experiments, but it should never be set in a
 * shared or production database.
 */
export function getDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  const isProduction = env.NODE_ENV === "production";

  // Hosted Postgres providers (Render, Neon, Railway, ...) hand out a single
  // connection string; when present it takes precedence over the DB_* vars.
  const connection = env.DATABASE_URL
    ? { url: env.DATABASE_URL }
    : {
        host: env.DB_HOST ?? "localhost",
        port: Number(env.DB_PORT ?? 5432),
        username: env.DB_USER ?? "postgres",
        password: env.DB_PASS ?? "",
        database: env.DB_NAME ?? "mediumclone",
      };

  return {
    type: "postgres",
    ...connection,
    // Globs are resolved relative to this file so they work both from `src`
    // (ts-node / CLI) and from `dist` (compiled runtime).
    entities: [join(__dirname, "/../**/*.entity{.ts,.js}")],
    migrations: [join(__dirname, "/migrations/*{.ts,.js}")],
    migrationsTableName: "migrations_history",
    // Never let TypeORM mutate the schema implicitly; migrations own DDL.
    synchronize: envBool(env.TYPEORM_SYNC, false),
    // Apply pending migrations automatically on boot. Handy for containers/CI;
    // a production deploy pipeline may prefer to run `migration:run` explicitly,
    // so this is opt-in via env and defaults off.
    migrationsRun: envBool(env.MIGRATIONS_RUN, false),
    ssl: envBool(env.DB_SSL, false) ? { rejectUnauthorized: false } : undefined,
    logging: isProduction ? ["error", "warn", "migration"] : false,
  };
}

/**
 * NestJS module options. Identical to {@link getDataSourceOptions} today, but
 * kept as a distinct seam so runtime-only options (retries, autoLoadEntities)
 * can be added without leaking into the CLI DataSource.
 */
export function getTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  return getDataSourceOptions(env);
}
