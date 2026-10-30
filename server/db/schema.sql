-- schema.sql
-- Esquema canónico de Murim - Sendas Inmortales (SQLite, mejor-sqlite3).
-- Reconstruye la estructura COMPLETA de una BD nueva. Las mejoras de columnas
-- sobre BDs antiguas las aplica server/db/migrate.ts (idempotente).
-- Fuente: volcado de sqlite_master de server/database.sqlite (2026-10-29).

-- ── CUENTAS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_admin INTEGER NOT NULL DEFAULT 0
);

-- ── PERSONAJES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT,
  appearance_json TEXT,
  alignment TEXT NOT NULL,
  origin TEXT,
  faction TEXT,
  realm_name TEXT DEFAULT 'Refinamiento de Qi (Etapa 1)',
  stats_json TEXT NOT NULL, -- Los 12 atributos en formato JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  hp INTEGER,
  max_hp INTEGER,
  qi INTEGER,
  max_qi INTEGER,
  spirit_stones INTEGER DEFAULT 250,
  sect_merits INTEGER DEFAULT 0,
  cb_actual INTEGER DEFAULT 0,
  cb_requerido INTEGER DEFAULT 100,
  x INTEGER,
  y INTEGER,
  banned INTEGER NOT NULL DEFAULT 0,
  ban_reason TEXT,
  last_seen INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ── INVENTARIO ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'misc',
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  UNIQUE(player_id, item_key),
  FOREIGN KEY(player_id) REFERENCES players(id)
);

-- ── BITÁCORA DE ACTIVIDAD ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT,
  kind TEXT NOT NULL,                -- creation | progress | meditation | admin | debug
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',-- info | success | error
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(ts);

-- ── POIs DEL MUNDO (sembrados por server/admin/world.ts) ───────────────────
CREATE TABLE IF NOT EXISTS world_pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('capital','sect','landmark','settlement')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  province_id TEXT NOT NULL,
  lore_note TEXT
);

-- ── PANEL ADMIN: catálogos editables ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_beasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  danger_level INTEGER NOT NULL DEFAULT 1,
  habitat TEXT NOT NULL DEFAULT '',
  key_material TEXT NOT NULL DEFAULT '',
  is_aquatic INTEGER NOT NULL DEFAULT 0,
  custom INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_flora (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'Común',
  effect TEXT NOT NULL DEFAULT '',
  habitat TEXT NOT NULL DEFAULT '',
  custom INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_factions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  alignment TEXT NOT NULL,
  element TEXT NOT NULL DEFAULT 'Qi',
  description TEXT NOT NULL DEFAULT '',
  power_level INTEGER NOT NULL DEFAULT 1,
  territory TEXT NOT NULL DEFAULT '',
  custom INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── SPAWNS DE DEPURACIÓN ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debug_spawns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  beast_id TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  chunk_x INTEGER NOT NULL,
  chunk_y INTEGER NOT NULL,
  hp INTEGER NOT NULL DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
