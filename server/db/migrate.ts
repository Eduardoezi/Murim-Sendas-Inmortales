// server/db/migrate.ts
// ─────────────────────────────────────────────────────────────────────────────
// Migraciones idempotentes para BDs ya existentes. schema.sql define el estado
// FINAL (para BDs nuevas); aquí solo se garantizan las columnas que llegaron
// tarde (ALTER TABLE históricos). Nunca DROPdea ni toca datos.
// ─────────────────────────────────────────────────────────────────────────────
import type Database from 'better-sqlite3';

type ColumnSpec = readonly [name: string, decl: string];

const COLUMN_UPGRADES: Record<string, ColumnSpec[]> = {
  users: [
    ['is_admin', 'INTEGER NOT NULL DEFAULT 0'],
  ],
  players: [
    ['hp', 'INTEGER'],
    ['max_hp', 'INTEGER'],
    ['qi', 'INTEGER'],
    ['max_qi', 'INTEGER'],
    ['spirit_stones', 'INTEGER DEFAULT 250'],
    ['sect_merits', 'INTEGER DEFAULT 0'],
    ['cb_actual', 'INTEGER DEFAULT 0'],
    ['cb_requerido', 'INTEGER DEFAULT 100'],
    ['x', 'INTEGER'],
    ['y', 'INTEGER'],
    ['banned', 'INTEGER NOT NULL DEFAULT 0'],
    ['ban_reason', 'TEXT'],
    ['last_seen', 'INTEGER'],
  ],
};

export function ensureColumn(db: Database.Database, table: string, column: string, decl: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`).run();
  }
}

/** Aplica schema.sql (idempotente por IF NOT EXISTS) y luego las mejoras de columnas. */
export function runMigrations(db: Database.Database): void {
  for (const [table, specs] of Object.entries(COLUMN_UPGRADES)) {
    for (const [column, decl] of specs) ensureColumn(db, table, column, decl);
  }
}
