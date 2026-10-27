// server/admin.ts
// ─────────────────────────────────────────────────────────────────────────────
// Panel de administración: métricas GLOBALES del reino, calculadas con
// consultas agregadas sobre SQLite. NO usa datos del jugador logueado
// (eso es responsabilidad de /api/player/*).
// ─────────────────────────────────────────────────────────────────────────────
import express, { Response, Request } from 'express';
import db from './db/database';
import { verifyToken } from './auth';
import { isAdmin } from './admin/router';
import { pushLog } from './admin/logbus';

// Ventana de "en línea": jugadores con actividad guardada hace <5 min
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

type Req = Request;

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
  // Columna para marcar última actividad conocida del personaje
  const cols = db.prepare(`PRAGMA table_info(players)`).all() as any[];
  if (!cols.some((c) => c.name === 'last_seen')) {
    db.prepare(`ALTER TABLE players ADD COLUMN last_seen INTEGER`).run();
  }
}
ensureAdminTables();

interface CountRow { n: number }
const one = (sql: string, ...params: Array<string | number>): number =>
  (db.prepare(sql).get(...params) as CountRow).n;

/** Alias del middleware estricto isAdmin del router modular (401/403 + bitácora). */
const requireAdmin = isAdmin;

export function registerAdminRoutes(app: express.Application) {
  // ── Estado GLOBAL del reino (todos los jugadores + POIs sincronizados) ────
  // NOTA: /api/admin/dashboard lo sirve el router modular (server/admin/router.ts)
  // con métricas agregadas completas; aquí solo se registran rutas complementarias.
  app.get('/api/admin/world', requireAdmin, (req: Req, res: Response) => {
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
  app.post('/api/admin/sync-pois', requireAdmin, (req: Req, res: Response) => {
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

}

/**
 * Rutas NO-administrativas usadas por el JUGADOR (token de usuario normal):
 * feed de eventos de sesión que alimenta "Últimos Eventos" y el gráfico de
 * 24h del dashboard (activity_log). Debe montarse ANTES de /api/admin/* para
 * que Express no lo intercepte con el isAdmin del router modular.
 */
export function registerPlayerEventRoutes(app: express.Application) {
  // Alimenta last_seen (presencia online) aunque aún no exista la columna.
  ensureAdminTables();

  app.post('/api/events', (req: Req, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No autorizado' });
      return;
    }
    const decoded = verifyToken(authHeader.split(' ')[1]);
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Token inválido o expirado' });
      return;
    }
    const player = db.prepare('SELECT id FROM players WHERE user_id = ?').get(decoded.userId) as { id: string } | undefined;
    if (!player) {
      res.status(404).json({ success: false, message: 'El usuario no tiene personaje' });
      return;
    }
    const raw = String(req.body?.event ?? '').trim().slice(0, 120);
    if (!raw) {
      res.status(400).json({ success: false, message: 'Falta el campo "event"' });
      return;
    }
    const now = Date.now();
    db.prepare('INSERT INTO activity_log (player_id, kind, message, level) VALUES (?, ?, ?, ?)')
      .run(player.id, 'session', raw, 'info');
    db.prepare('UPDATE players SET last_seen = ? WHERE id = ?').run(now, player.id);
    pushLog('debug', 'game', `Evento de sesión [${player.id}]: ${raw}`);
    res.json({ success: true });
  });
}
