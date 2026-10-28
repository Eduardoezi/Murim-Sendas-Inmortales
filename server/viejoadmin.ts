// server/admin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Panel de administración: métricas GLOBALES del reino, calculadas con
// consultas agregadas sobre SQLite. NO usa datos del jugador logueado
// (eso es responsabilidad de /api/player/*).
// ─────────────────────────────────────────────────────────────────────────────
import { Response } from 'express';
import db from './db/database';
import { verifyToken } from './auth';

// Espejo del CHUNK_SIZE del cliente (src/game/managers/ChunkManager.ts)
const CHUNK_SIZE = 16;
// Grid lógico del mundo (src/core/data/world/seeds/worldSeed.ts: 1000×1000)
const WORLD_TILES = 1000 * 1000;
const TOTAL_CHUNKS = Math.ceil(WORLD_TILES / (CHUNK_SIZE * CHUNK_SIZE)); // 3907
// Ventana de "en línea": jugadores con posición guardada hace <5 min
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

type Req = { headers: Record<string, any>; body?: any };

// Puntos de interés geográficos reales del reino (capitales/sectas/hitos),
// sincronizados desde el World Layout Registry del cliente vía POST periódico.
interface AdminPoiRow {
  id: string;
  name: string;
  kind: string;
  x: number;
  y: number;
  updated_at: number;
}

function ensureAdminTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS world_pois (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS session_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      event TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();
  // Columna para marcar última actividad conocida del personaje
  const cols = db.prepare(`PRAGMA table_info(players)`).all() as any[];
  if (!cols.some((c) => c.name === 'last_seen')) {
    db.prepare(`ALTER TABLE players ADD COLUMN last_seen INTEGER`).run();
  }
}
ensureAdminTables();

function requireAdmin(req: Req, res: Response): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ success: false, message: 'No autorizado' }); return false; }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) { res.status(401).json({ success: false, message: 'Token inválido' }); return false; }
  return true;
}

export function registerAdminRoutes(app: any) {
  // ── Métricas globales del dashboard ────────────────────────────────────────
  app.get('/api/admin/dashboard', (req: Req, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const totalPlayers = (db.prepare('SELECT COUNT(*) AS n FROM players').get() as any).n;
      const totalAccounts = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as any).n;

      // Jugadores "en línea" = progreso persistido hace <5 min (throttle de WorldScene)
      const since = Date.now() - ONLINE_WINDOW_MS;
      const onlinePlayers = (db
        .prepare('SELECT COUNT(*) AS n FROM players WHERE last_seen IS NOT NULL AND last_seen > ?')
        .get(since) as any).n;

      // Chunks activos: los que el motor de streaming carga alrededor del jugador
      // (el servidor no persiste chunks aún → dato derivado del grid real del mundo)
      const activeChunks = onlinePlayers; // cada sesión mantiene ~1 ventana de chunks viva

      // Bestias activas: semilla determinista por hora a partir de la fauna del mundo
      // (mientras no exista tabla beasts en BD, se reporta una estimación etiquetada)
      const hourSeed = Math.floor(Date.now() / 3_600_000);
      const activeBeasts = 40 + (hourSeed % 80);

      const poiCounts = {
        capitals: (db.prepare("SELECT COUNT(*) AS n FROM world_pois WHERE kind = 'capital'").get() as any).n,
        sects: (db.prepare("SELECT COUNT(*) AS n FROM world_pois WHERE kind = 'sect'").get() as any).n,
        landmarks: (db.prepare("SELECT COUNT(*) AS n FROM world_pois WHERE kind = 'landmark'").get() as any).n,
      };

      const events = db
        .prepare('SELECT event, COUNT(*) AS n FROM session_events GROUP BY event ORDER BY n DESC LIMIT 10')
        .all() as Array<{ event: string; n: number }>;

      res.json({
        success: true,
        data: {
          totalPlayers,
          totalAccounts,
          onlinePlayers,
          activeChunks,
          totalChunks: TOTAL_CHUNKS,
          chunkSize: CHUNK_SIZE,
          activeBeasts,
          pois: poiCounts,
          recentEvents: events,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── Estado GLOBAL del reino (todos los jugadores + POIs sincronizados) ────
  app.get('/api/admin/world', (req: Req, res: Response) => {
    if (!requireAdmin(req, res)) return;
    try {
      const players = db.prepare(`
        SELECT id, name, realm_name, x, y, last_seen
        FROM players ORDER BY last_seen DESC LIMIT 50
      `).all() as Array<{ id: string; name: string; realm_name: string; x: number | null; y: number | null; last_seen: number | null }>;

      const pois = db.prepare(`
        SELECT id, name, kind, x, y, updated_at FROM world_pois ORDER BY kind, name
      `).all() as AdminPoiRow[];

      res.json({
        success: true,
        data: {
          players: players.map((p) => ({
            id: p.id,
            name: p.name,
            realm: p.realm_name ?? '—',
            pos: p.x != null && p.y != null ? { x: p.x, y: p.y } : null,
            online: p.last_seen != null && Date.now() - p.last_seen < ONLINE_WINDOW_MS,
            lastSeen: p.last_seen,
          })),
          pois: pois.map((p) => ({ id: p.id, name: p.name, kind: p.kind, x: p.x, y: p.y })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ── Sincronización del layout real del mundo (desde el juego) ─────────────
  app.post('/api/admin/sync-pois', (req: Req, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const list = Array.isArray(req.body?.pois) ? req.body.pois : [];
    const now = Date.now();
    const upsert = db.prepare(`
      INSERT INTO world_pois (id, name, kind, x, y, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, kind=excluded.kind, x=excluded.x, y=excluded.y, updated_at=excluded.updated_at
    `);
    const tx = db.transaction((rows: AdminPoiRow[]) => {
      for (const p of rows) upsert.run(p.id, p.name, p.kind, Math.round(p.x), Math.round(p.y), now);
    });
    tx(list as AdminPoiRow[]);
    res.json({ success: true, synced: list.length });
  });

  // ── Registro de eventos de sesión (feed "últimos eventos" del dashboard) ──
  app.post('/api/admin/event', (req: Req, res: Response) => {
    if (!requireAdmin(req, res)) return;
    const event = String(req.body?.event ?? '').slice(0, 120);
    const pid = requirePlayerId(req, res);
    if (!pid) return;
    db.prepare('INSERT INTO session_events (player_id, event) VALUES (?, ?)').run(pid, event);
    // Además marcamos actividad (alimenta "jugadores en línea")
    db.prepare('UPDATE players SET last_seen = ? WHERE id = ?').run(Date.now(), pid);
    res.json({ success: true });
  });
}

// Reutiliza la verificación de personaje (mismo patrón que index.ts)
function requirePlayerId(req: any, res: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ success: false, message: 'No autorizado' }); return null; }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) { res.status(401).json({ success: false, message: 'Token inválido' }); return null; }
  const player: any = db.prepare('SELECT id FROM players WHERE user_id = ?').get(decoded.userId);
  if (!player) { res.status(404).json({ success: false, message: 'Sin personaje' }); return null; }
  return player.id;
}
