import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export type AppDatabase = DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  apellido      TEXT NOT NULL,
  matricula     TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  user_kind  TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, user_kind);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
`;

/**
 * Crea (o abre) una base SQLite, aplica el esquema y la devuelve.
 * Usa ":memory:" para una base en memoria (útil en pruebas).
 */
export function createDatabase(location: string): AppDatabase {
  if (location !== ":memory:") {
    const dir = path.dirname(location);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(location);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);

  // Migración: si una base existente aún no tiene la columna password_hash
  // (creada antes de este cambio), la agregamos.
  const cols = db
    .prepare("PRAGMA table_info(students)")
    .all() as unknown as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "password_hash")) {
    db.exec(
      "ALTER TABLE students ADD COLUMN password_hash TEXT NOT NULL DEFAULT ''",
    );
  }

  // Crear índices si no existen (para bases existentes)
  try {
    db.exec("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, user_kind)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at)");
  } catch {
    // Los índices ya existen o la tabla aún no se crea
  }

  return db;
}