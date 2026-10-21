-- ============================================================
-- MURIM: SENDAS INMORTALES — Esquema base (Fase 0)
-- ============================================================

PRAGMA foreign_keys = ON;

-- ---------- JUGADORES ----------
CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  class_type      TEXT NOT NULL,
  sect_id         TEXT,
  sect_rank       TEXT,
  realm           TEXT NOT NULL,
  sub_realm       INTEGER NOT NULL DEFAULT 1,
  qi              INTEGER NOT NULL DEFAULT 0,
  max_qi          INTEGER NOT NULL DEFAULT 100,
  hp              INTEGER NOT NULL DEFAULT 100,
  max_hp          INTEGER NOT NULL DEFAULT 100,
  spirit_stones   INTEGER NOT NULL DEFAULT 0,
  sect_merits     INTEGER NOT NULL DEFAULT 0,
  dantian_purity  INTEGER NOT NULL DEFAULT 35,
  karma           INTEGER NOT NULL DEFAULT 50,
  fama            INTEGER NOT NULL DEFAULT 50,
  current_location_node_id TEXT,
  
  -- Columnas desglosadas para queries rápidas y auditoría
  attributes_json        TEXT,
  stats_json             TEXT,
  meridians_json         TEXT,
  known_techniques_json  TEXT,
  equipped_gear_json     TEXT,
  secret_technique_json  TEXT,
  library_scrolls_json   TEXT,
  inventory_json         TEXT,
  disciples_json         TEXT,
  currency_json          TEXT,
  
  -- Snapshot completo del Cultivador para fidelidad total sin pérdida de campos
  profile_json           TEXT,
  
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_players_sect ON players(sect_id);

-- ---------- INVENTARIO ----------
CREATE TABLE IF NOT EXISTS inventory (
  id          TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_json   TEXT NOT NULL,
  equipped_slot TEXT, -- weapon / armor / artifact / boots / ring / NULL
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_player ON inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_inventory_slot   ON inventory(player_id, equipped_slot);

-- ---------- SUBASTAS ----------
CREATE TABLE IF NOT EXISTS auctions (
  id                TEXT PRIMARY KEY,
  seller_id         TEXT NOT NULL,
  seller_name       TEXT NOT NULL,
  seller_class      TEXT,
  item_json         TEXT NOT NULL,
  current_bid       INTEGER NOT NULL,
  buyout_price      INTEGER NOT NULL,
  highest_bidder_id TEXT,
  highest_bidder_name TEXT,
  currency_type     TEXT NOT NULL DEFAULT 'stones',
  expires_at        INTEGER NOT NULL,
  created_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auctions_expires  ON auctions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auctions_currency ON auctions(currency_type);
CREATE INDEX IF NOT EXISTS idx_auctions_seller   ON auctions(seller_id);

-- ---------- SECTAS ----------
CREATE TABLE IF NOT EXISTS sects (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  chinese_name      TEXT,
  element           TEXT,
  alignment         TEXT,
  description       TEXT,
  leader_name       TEXT,
  territory_control INTEGER DEFAULT 0,
  total_members     INTEGER DEFAULT 0,
  sect_treasury     INTEGER DEFAULT 0,
  active_buff       TEXT,
  specialty_skill   TEXT,
  metadata_json     TEXT
);

-- ---------- DISCÍPULOS ----------
CREATE TABLE IF NOT EXISTS disciples (
  id                    TEXT PRIMARY KEY,
  master_id             TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  realm                 TEXT,
  aptitude              TEXT,
  loyalty               INTEGER DEFAULT 50,
  assigned_task         TEXT DEFAULT 'none',
  task_progress         INTEGER DEFAULT 0,
  task_duration_seconds INTEGER,
  tribute_json          TEXT,
  created_at            INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_disciples_master ON disciples(master_id);

-- ---------- MISIONES DE JUGADOR ----------
CREATE TABLE IF NOT EXISTS player_missions (
  id            TEXT PRIMARY KEY,
  player_id     TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_id    TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  completed     INTEGER DEFAULT 0,
  claimed       INTEGER DEFAULT 0,
  accepted_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_missions_player ON player_missions(player_id);

-- ---------- DUELOS ----------
CREATE TABLE IF NOT EXISTS duels (
  id             TEXT PRIMARY KEY,
  status         TEXT NOT NULL, -- waiting / in_progress / finished
  p1_json        TEXT NOT NULL,
  p2_json        TEXT NOT NULL,
  current_turn_id TEXT,
  turn_number    INTEGER DEFAULT 1,
  combat_log_json TEXT,
  winner_id      TEXT,
  created_at     INTEGER NOT NULL,
  finished_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_duels_status ON duels(status);

-- ---------- ESTADO GLOBAL DEL MUNDO ----------
-- Almacén clave-valor para jefe mundial, clima, config, etc.
CREATE TABLE IF NOT EXISTS world_state (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ---------- LOG DE EVENTOS ----------
-- La materia prima que leerá la IA directora en fases futuras.
CREATE TABLE IF NOT EXISTS world_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tick       INTEGER NOT NULL DEFAULT 0,
  type       TEXT NOT NULL,
  actor_id   TEXT,
  target_id  TEXT,
  data_json  TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_tick   ON world_events(tick);
CREATE INDEX IF NOT EXISTS idx_events_type   ON world_events(type);
CREATE INDEX IF NOT EXISTS idx_events_actor  ON world_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON world_events(created_at);
