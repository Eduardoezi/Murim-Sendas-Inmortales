// src/types/admin.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// CONTRATO DE TIPOS DEL PORTAL DE ADMINISTRACIÓN (/admin)
// Todas las respuestas de /api/admin/* deben tiparse aquí. Prohibido `any`:
// el frontend solo muestra datos; el backend (SQLite/Express) es autoritativo.
// ─────────────────────────────────────────────────────────────────────────────

/** Respuesta base envuelta por todos los endpoints de administración. */
export interface AdminApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ── A. DASHBOARD ─────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  /** Cuentas de usuario registradas (users). */
  totalAccounts: number;
  /** Personajes creados (players). */
  totalPlayers: number;
  /** Jugadores "en línea": con actividad en los últimos 5 minutos. */
  onlinePlayers: number;
  /** Chunks del mapa 1000x1000 con tamaño 16 (simétrico al CHUNK_SIZE del cliente). */
  totalChunks: number;
  /** Bestias únicas catalogadas (lore + overrides de balanceo). */
  totalBeasts: number;
  /** Especies de flora catalogadas. */
  totalFlora: number;
  /** Facciones registradas (sectas, clanes, cultos, gremios, organizaciones). */
  totalFactions: number;
  /** Puntos de interés persistidos en la BD de POIs. */
  totalPois: number;
  /** Semilla raíz actual del mundo (WORLD_SEED.rootHash). */
  worldSeed: string;
  /** Contador global de creaciones de personaje (serie 24h). */
  creationsToday: number;
}

export interface ActivityPoint {
  /** Hora del bucket, formato HH:00 (últimas 24 horas). */
  hour: string;
  /** Creaciones de personaje en ese bucket. */
  creations: number;
  /** Acciones de juego registradas (meditación, progreso, teletransportes...). */
  actions: number;
}

export interface RecentEvent {
  id: number;
  time: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

export interface DashboardPayload {
  metrics: DashboardMetrics;
  activity: ActivityPoint[];
  recentEvents: RecentEvent[];
}

// ── B. JUGADORES ─────────────────────────────────────────────────────────────

export interface AdminPlayerRow {
  id: string;
  user_id: number;
  name: string;
  email: string | null;
  gender: string;
  birth_date: string | null;
  origin: string | null;
  faction: string | null;
  alignment: string | null;
  realm_name: string;
  hp: number | null;
  max_hp: number | null;
  qi: number | null;
  max_qi: number | null;
  spirit_stones: number | null;
  sect_merits: number | null;
  cb_actual: number | null;
  cb_requerido: number | null;
  x: number | null;
  y: number | null;
  banned: number; // 0/1
  ban_reason: string | null;
  created_at: string;
  last_activity: string | null;
}

export interface PaginatedPlayers {
  players: AdminPlayerRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlayerInventoryLine {
  id: number;
  item_key: string;
  name: string;
  category: string;
  quantity: number;
  description: string | null;
}

export interface PlayerDetailPayload {
  player: AdminPlayerRow;
  stats: Record<string, number>;
  inventory: PlayerInventoryLine[];
}

/** Campos editables vía PATCH /api/admin/players/:id */
export interface PlayerPatch {
  name?: string;
  faction?: string;
  realm_name?: string;
  hp?: number;
  max_hp?: number;
  qi?: number;
  max_qi?: number;
  spirit_stones?: number;
  sect_merits?: number;
  x?: number;
  y?: number;
  banned?: boolean;
  ban_reason?: string;
}

// ── C. MUNDO Y POIs ──────────────────────────────────────────────────────────

export interface WorldSeedInfo {
  rootHash: string;
  version: string;
  epoch: string;
  worldName: string;
  gridSize: { width: number; height: number };
  globalModifiers: { qiDensity: number; chaosFactor: number };
}

export interface PoiRow {
  id: string;
  name: string;
  kind: 'capital' | 'sect' | 'landmark' | 'settlement';
  x: number;
  y: number;
  provinceId: string;
  loreNote: string | null;
}

export interface ChunkPreviewTile {
  x: number;
  y: number;
  type: string;
  density: number;
}

export interface ChunkPreviewPayload {
  chunkX: number;
  chunkY: number;
  chunkSize: number;
  provinceId: string;
  provinceName: string;
  biome: string;
  seedUsed: string;
  tiles: ChunkPreviewTile[];
  fauna: Array<{ id: string; name: string; x: number; y: number; tier: string }>;
}

export interface RegenerateChunkPayload {
  chunkX: number;
  chunkY: number;
  regenerated: boolean;
  force: number;
  message: string;
}

// ── D. FAUNA, FLORA Y FACCCIONES (CRUD) ─────────────────────────────────────

export interface BeastRow {
  id: string;
  name: string;
  tier: 'Mutante' | 'Desolada' | 'Ancestral' | 'Primordial';
  dangerLevel: number;
  habitat: string;
  keyMaterial: string;
  isAquatic: number; // 0/1
  custom: number;   // 1 = creada/editada desde el admin (override sobre seeds)
}

export interface FloraRow {
  id: string;
  name: string;
  rarity: 'Común' | 'Rara' | 'Épica' | 'Legendaria';
  effect: string;
  habitat: string;
  custom: number;
}

export interface FactionRow {
  id: string;
  name: string;
  type: 'Secta' | 'Clan' | 'Culto' | 'Gremio' | 'Organización';
  alignment: 'Ortodoxa' | 'Heterodoxa' | 'Demoníaca' | 'Neutral';
  element: string;
  description: string;
  powerLevel: number;
  territory: string;
  custom: number;
}

export interface BeastInput {
  id?: string;
  name: string;
  tier: BeastRow['tier'];
  dangerLevel: number;
  habitat: string;
  keyMaterial: string;
  isAquatic?: boolean;
}

export interface FloraInput {
  id?: string;
  name: string;
  rarity: FloraRow['rarity'];
  effect: string;
  habitat: string;
}

export interface FactionInput {
  id?: string;
  name: string;
  type: FactionRow['type'];
  alignment: FactionRow['alignment'];
  element: string;
  description: string;
  powerLevel: number;
  territory: string;
}

// ── E. LOGS Y HERRAMIENTAS DE DEBUG ─────────────────────────────────────────

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: number;
  ts: string;          // ISO
  level: LogLevel;
  source: string;      // http | db | admin | debug | system
  message: string;
}

export interface CommandResult {
  ok: boolean;
  output: string;
  logs?: LogEntry[];
}
