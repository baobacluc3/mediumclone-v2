import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value == null) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export function getTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions & DataSourceOptions {
  const databaseUrl = env.DATABASE_URL;

  return {
    type: "postgres",
    url: databaseUrl || undefined,
    host: databaseUrl ? undefined : (env.DB_HOST ?? "localhost"),
    port: databaseUrl ? undefined : Number(env.DB_PORT ?? "5432"),
    username: databaseUrl ? undefined : (env.DB_USER ?? "postgres"),
    password: databaseUrl ? undefined : (env.DB_PASS ?? ""),
    database: databaseUrl ? undefined : (env.DB_NAME ?? "publishing_api"),
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    migrations: [__dirname + "/../migrations/*{.ts,.js}"],
    migrationsTableName: "migrations",
    synchronize: parseBoolean(env.DB_SYNCHRONIZE, false),
    logging: parseBoolean(env.DB_LOGGING, env.NODE_ENV === "development"),
  };
}
