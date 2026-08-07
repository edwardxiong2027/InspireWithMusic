import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Pool as PgPool } from "pg";
import type { PGlite as PGliteType } from "@electric-sql/pglite";
import { editableContentDefaults, schemaStatements } from "./schema";

type QueryResult<T> = { rows: T[]; affectedRows: number };

let localDb: PGliteType | undefined;
let postgresPool: PgPool | undefined;
let initialized: Promise<void> | undefined;

function isPostgres() {
  return /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
}

async function rawQuery<T>(sqlText: string, params: unknown[] = []): Promise<QueryResult<T>> {
  if (isPostgres()) {
    if (!postgresPool) {
      const { Pool } = await import("pg");
      postgresPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
    }
    const result = await postgresPool.query(sqlText, params);
    return { rows: result.rows as T[], affectedRows: result.rowCount ?? 0 };
  }

  if (!localDb) {
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), "data", "pglite");
    await mkdir(path.dirname(dataDir), { recursive: true });
    localDb = new PGlite(dataDir);
  }
  const result = await localDb.query<T>(sqlText, params);
  return { rows: result.rows, affectedRows: result.affectedRows ?? 0 };
}

async function initialize() {
  for (const statement of schemaStatements) await rawQuery(statement);
  for (const [key, value, page, label, fieldType] of editableContentDefaults) {
    await rawQuery(
      `INSERT INTO content_entries (key, value, page, label, field_type)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (key) DO NOTHING`,
      [key, value, page, label, fieldType],
    );
  }
}

export async function query<T = Record<string, unknown>>(sqlText: string, params: unknown[] = []) {
  if (!initialized) initialized = initialize();
  await initialized;
  return rawQuery<T>(sqlText, params);
}

export async function initializeDatabase() {
  if (!initialized) initialized = initialize();
  await initialized;
}

export async function closeDatabase() {
  await localDb?.close();
  await postgresPool?.end();
  localDb = undefined;
  postgresPool = undefined;
  initialized = undefined;
}
