import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export function getTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    type: "postgres",
    host: env.DB_HOST ?? "localhost",
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? "postgres",
    password: env.DB_PASS ?? "",
    database: env.DB_NAME ?? "mediumclone",
    entities: [__dirname + "/../**/*.entity{.ts,.js}"],
    synchronize: env.TYPEORM_SYNC ? env.TYPEORM_SYNC === "true" : !isProduction,
  };
}
