import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { DataSource } from "typeorm";

import { getDataSourceOptions } from "./typeorm.config";

// The TypeORM CLI runs outside the Nest application context, so nothing has
// loaded `.env` for us. Do it here before reading any DB_* variables.
loadEnv();

/**
 * Standalone DataSource consumed by the TypeORM CLI (`-d src/database/data-source.ts`).
 * Drives `migration:generate`, `migration:run` and `migration:revert`. The app
 * itself does NOT import this file — it builds its connection from
 * {@link getDataSourceOptions} via `TypeOrmModule.forRoot` — but both share the
 * same options function so the CLI and runtime can never drift apart.
 */
export const AppDataSource = new DataSource(getDataSourceOptions());
