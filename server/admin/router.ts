// server/admin/router.ts
// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DEL PORTAL DE ADMINISTRACIÓN — TODAS bajo /api/admin/* y protegidas
// por el middleware estricto `isAdmin` (401 sin token, 403 si no eres admin).
// El backend es autoritativo: el frontend solo muestra lo que aquí se calcula.
// ─────────────────────────────────────────────────────────────────────────────
import { Router, type Request, type Response, type NextFunction } from 'express';
import db from '../db/database';
import { verifyToken } from '../auth';
import { pushLog, getLogs, subscribeLogs, type LogLevel } from './logbus';
import {
  CHUNK_SIZE, MAP_SIZE, WORLD_ROOT_HASH, provinceAt, tileAt,
  generateChunkFauna, getBeastCatalog, ensurePoisSeeded, listPois,
  bumpChunkRegen, getChunkRegenCount, mulberry32, stringToHash,
} from './world';

export const adminRouter = Router();

// ── Tipos de filas (mapeos SELECT ... AS camelCase) ─────────────────────────
interface CountRow { n: number }
interface PlayerRowOut {
  id: string; user_id: number; name: string; email: string | null; gender: string;
  birth_date: string | null; origin: string | null; faction: string | null; alignment: string | null;
  realm_name: string; hp: number | null; max_hp: number | null; qi: number | null; max_qi: number | null;
  spirit_stones: number | null; sect_merits: number | null; cb_actual: number | null; cb_requerido: number | null;
  x: number | null; y: number | null; banned: number; ban_reason: string | null;
  created_at: string; last_activity: string | null;
}
interface BeastRowOut {
  id: string; name: string; tier: string; dangerLevel: number; habitat: string;
  keyMaterial: string; isAquatic: number; custom: number;
}
interface FloraRowOut { id: string; name: string; rarity: string; effect: string; habitat: string; custom: number }
interface FactionRowOut {
  id: string; name: string; type: string; alignment: string; element: string;
  description: string; powerLevel: number; territory: string; custom: number;
}

const PLAYER_SELECT = `
  SELECT p.id, p.user_id, p.name, u.email, p.gender, p.birth_date, p.origin, p.faction, p.alignment,
         COALESCE(p.realm_name, 'Refinamiento de Qi (Etapa 1)') AS realm_name,
         p.hp, p.max_hp, p.qi, p.max_qi, p.spirit_stones, p.sect_merits, p.cb_actual, p.cb_requerido,
         p.x, p.y,
         COALESCE(p.banned, 0) AS banned, p.ban_reason,
         p.created_at,
         (SELECT MAX(ts) FROM activity_log a WHERE a.player_id = p.id) AS last_activity
  FROM players p LEFT JOIN users u ON u.id = p.user_id`;

// ── Middleware estricto isAdmin ──────────────────────────────────────────────
function tableHasColumn(table: string, column: string): boolean {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return cols.some((c) => c.name === column);
  } catch { return false; }
}

function isAdminUser(userId: number): boolean {
  if (process.env.ADMIN_EMAILS) {
    const mail = (db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined)?.email;
    if (mail && process.env.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase()).includes(mail.toLowerCase())) return true;
  }
  if (!tableHasColumn('users', 'is_admin')) return false;
  const row = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId) as { is_admin: number } | undefined;
  return !!row && row.is_admin === 1;
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No autorizado: falta el token' });
    return;
  }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    return;
  }
  if (!isAdminUser(decoded.userId)) {
    pushLog('warn', 'admin', `Intento de acceso a ${req.method} ${req.originalUrl} desde user ${decoded.userId} (no admin)`);
    res.status(403).json({ success: false, message: 'Prohibido: se requieren privilegios de administrador' });
    return;
  }
  next();
}

adminRouter.use(isAdmin);

const clampInt = (v: unknown, min: number, max: number, dflt: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : dflt;
};

// ══ A. DASHBOARD ════════════════════════════════════════════════════════════
adminRouter.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const one = (sql: string): number => (db.prepare(sql).get() as CountRow).n;

    const creationsByHour = db.prepare(`
      SELECT strftime('%Y-%m-%dT%H:00:00Z', created_at) AS hour, COUNT(*) AS n
      FROM players WHERE created_at >= datetime('now', '-24 hours') GROUP BY hour`).all() as Array<{ hour: string; n: number }>;

    const actionsByHour = db.prepare(`
      SELECT strftime('%Y-%m-%dT%H:00:00Z', ts) AS hour, COUNT(*) AS n
      FROM activity_log WHERE ts >= datetime('now', '-24 hours') GROUP BY hour`).all() as Array<{ hour: string; n: number }>;

    const mapCreation = new Map(creationsByHour.map((r) => [r.hour, r.n]));
    const mapAction = new Map(actionsByHour.map((r) => [r.hour, r.n]));
    const activity: Array<{ hour: string; creations: number; actions: number }> = [];
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3600_000);
      const key = `${d.toISOString().slice(0, 13)}:00:00Z`;
      activity.push({ hour: key.slice(11, 13) + ':00', creations: mapCreation.get(key) ?? 0, actions: mapAction.get(key) ?? 0 });
    }

    const recentEvents = db.prepare(`
      SELECT id, ts AS time, message AS text, level AS type
      FROM activity_log ORDER BY id DESC LIMIT 8`).all() as Array<{ id: number; time: string; text: string; type: 'info' | 'success' | 'error' }>;

    res.json({
      success: true,
      data: {
        metrics: {
          totalAccounts: one('SELECT COUNT(*) AS n FROM users'),
          totalPlayers: one('SELECT COUNT(*) AS n FROM players'),
          onlinePlayers: one(`SELECT COUNT(*) AS n FROM activity_log WHERE ts >= datetime('now', '-5 minutes') AND player_id IS NOT NULL`),
          totalChunks: Math.ceil(MAP_SIZE / CHUNK_SIZE) ** 2,
          totalBeasts: getBeastCatalog().length,
          totalFlora: one('SELECT COUNT(*) AS n FROM admin_flora') + 14, // seeds manuales + BD
          totalFactions: one('SELECT COUNT(*) AS n FROM admin_factions') + 555, // catálogo lore sembrado
          totalPois: one('SELECT COUNT(*) AS n FROM world_pois'),
          worldSeed: WORLD_ROOT_HASH,
          creationsToday: creationsByHour.reduce((acc, r) => acc + r.n, 0),
        },
        activity,
        recentEvents,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    pushLog('error', 'admin', `dashboard: ${msg}`);
    res.status(500).json({ success: false, message: msg });
  }
});

// ══ B. JUGADORES ════════════════════════════════════════════════════════════
adminRouter.get('/players', (req: Request, res: Response) => {
  const page = clampInt(req.query.page, 1, 10_000, 1);
  const pageSize = clampInt(req.query.pageSize, 1, 100, 10);
  const q = String(req.query.q ?? '').trim();

  let where = '';
  const params: Array<string | number> = [];
  if (q) {
    where = 'WHERE (p.name LIKE ? OR u.email LIKE ? OR p.id LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM players p LEFT JOIN users u ON u.id = p.user_id ${where}`).get(...params) as CountRow).n;
  const players = db.prepare(`${PLAYER_SELECT} ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as PlayerRowOut[];

  res.json({ success: true, data: { players, total, page, pageSize } });
});

adminRouter.get('/players/:id', (req: Request, res: Response) => {
  const player = db.prepare(`${PLAYER_SELECT} WHERE p.id = ?`).get(req.params.id) as PlayerRowOut | undefined;
  if (!player) { res.status(404).json({ success: false, message: 'Jugador no encontrado' }); return; }

  const raw = db.prepare('SELECT stats_json FROM players WHERE id = ?').get(req.params.id) as { stats_json: string };
  let stats: Record<string, number> = {};
  try { stats = JSON.parse(raw.stats_json) as Record<string, number>; } catch { stats = {}; }

  const inventory = db.prepare(
    'SELECT id, item_key, name, category, quantity, description FROM inventory_items WHERE player_id = ? ORDER BY category, name'
  ).all(req.params.id) as Array<{ id: number; item_key: string; name: string; category: string; quantity: number; description: string | null }>;

  res.json({ success: true, data: { player, stats, inventory } });
});

adminRouter.patch('/players/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const exists = db.prepare('SELECT id FROM players WHERE id = ?').get(id);
  if (!exists) { res.status(404).json({ success: false, message: 'Jugador no encontrado' }); return; }

  const body = req.body as Record<string, unknown>;
  const sets: string[] = [];
  const vals: Array<string | number | null> = [];
  const add = (col: string, val: string | number | null): void => { sets.push(`${col} = ?`); vals.push(val); };

  if (typeof body.name === 'string' && body.name.trim()) add('name', body.name.trim());
  if (typeof body.faction === 'string') add('faction', body.faction);
  if (typeof body.realm_name === 'string') add('realm_name', body.realm_name);
  if (body.hp !== undefined) add('hp', clampInt(body.hp, 0, 9_999_999, 0));
  if (body.max_hp !== undefined) add('max_hp', clampInt(body.max_hp, 1, 9_999_999, 1));
  if (body.qi !== undefined) add('qi', clampInt(body.qi, 0, 9_999_999, 0));
  if (body.max_qi !== undefined) add('max_qi', clampInt(body.max_qi, 1, 9_999_999, 1));
  if (body.spirit_stones !== undefined) add('spirit_stones', clampInt(body.spirit_stones, 0, 999_999_999, 0));
  if (body.sect_merits !== undefined) add('sect_merits', clampInt(body.sect_merits, 0, 999_999_999, 0));
  if (body.x !== undefined) add('x', clampInt(body.x, 0, MAP_SIZE - 1, 0));
  if (body.y !== undefined) add('y', clampInt(body.y, 0, MAP_SIZE - 1, 0));
  if (body.banned !== undefined) add('banned', body.banned ? 1 : 0);
  if (typeof body.ban_reason === 'string') add('ban_reason', body.ban_reason);

  if (sets.length === 0) { res.status(400).json({ success: false, message: 'Nada que actualizar' }); return; }

  db.prepare(`UPDATE players SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);

  const who = (db.prepare('SELECT name FROM players WHERE id = ?').get(id) as { name: string }).name;
  const actions: string[] = [];
  if (body.x !== undefined && body.y !== undefined) actions.push(`teletransportado a (${clampInt(body.x, 0, MAP_SIZE - 1, 0)}, ${clampInt(body.y, 0, MAP_SIZE - 1, 0)})`);
  if (body.banned === true) actions.push(`baneado${typeof body.ban_reason === 'string' ? ` (${body.ban_reason})` : ''}`);
  if (body.banned === false) actions.push('debaneado');
  if (actions.length === 0) actions.push(`actualizado (${sets.length} campos)`);
  for (const a of actions) {
    db.prepare("INSERT INTO activity_log (player_id, kind, message, level) VALUES (?, 'admin', ?, 'success')").run(id, `Jugador ${who}: ${a}`);
    pushLog('info', 'admin', `${who} ${a}`);
  }

  const player = db.prepare(`${PLAYER_SELECT} WHERE p.id = ?`).get(id) as PlayerRowOut;
  res.json({ success: true, data: { player } });
});

// ══ C. MUNDO Y POIs ═════════════════════════════════════════════════════════
adminRouter.get('/world/seed', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      rootHash: WORLD_ROOT_HASH,
      version: '1.0.0-alpha',
      epoch: 'Era de la Guerra de las Cien Sectas',
      worldName: 'Jianghu Central - Tierras Inmortales',
      gridSize: { width: MAP_SIZE, height: MAP_SIZE },
      globalModifiers: { qiDensity: 1.25, chaosFactor: 0.45 },
    },
  });
});

adminRouter.get('/world/pois', (_req: Request, res: Response) => {
  ensurePoisSeeded();
  res.json({ success: true, data: listPois() });
});

adminRouter.post('/world/pois/sync', (_req: Request, res: Response) => {
  const n = ensurePoisSeeded();
  pushLog('info', 'admin', `Sincronización de POIs ejecutada (${n} POIs en BD)`);
  res.json({ success: true, data: { synced: n } });
});

adminRouter.get('/world/chunk/:cx/:cy', (req: Request, res: Response) => {
  const cx = clampInt(req.params.cx, 0, MAP_SIZE / CHUNK_SIZE - 1, -1);
  const cy = clampInt(req.params.cy, 0, MAP_SIZE / CHUNK_SIZE - 1, -1);
  if (cx < 0 || cy < 0) { res.status(400).json({ success: false, message: 'Coordenada de chunk fuera de rango' }); return; }

  const prov = provinceAt(cx * CHUNK_SIZE + CHUNK_SIZE / 2, cy * CHUNK_SIZE + CHUNK_SIZE / 2);
  const tiles: Array<{ x: number; y: number; type: string; density: number }> = [];
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      const t = tileAt(cx * CHUNK_SIZE + x, cy * CHUNK_SIZE + y, prov.biome);
      tiles.push({ x: t.x, y: t.y, type: t.type, density: t.density });
    }
  }
  res.json({
    success: true,
    data: {
      chunkX: cx, chunkY: cy, chunkSize: CHUNK_SIZE,
      provinceId: prov.id, provinceName: prov.name, biome: prov.biome,
      seedUsed: `${WORLD_ROOT_HASH}_${prov.id}`,
      tiles,
      fauna: generateChunkFauna(prov.id, cx, cy),
    },
  });
});

adminRouter.post('/world/chunk/:cx/:cy/regenerate', (req: Request, res: Response) => {
  const cx = clampInt(req.params.cx, 0, MAP_SIZE / CHUNK_SIZE - 1, -1);
  const cy = clampInt(req.params.cy, 0, MAP_SIZE / CHUNK_SIZE - 1, -1);
  if (cx < 0 || cy < 0) { res.status(400).json({ success: false, message: 'Coordenada de chunk fuera de rango' }); return; }

  const force = bumpChunkRegen();
  const prov = provinceAt(cx * CHUNK_SIZE + CHUNK_SIZE / 2, cy * CHUNK_SIZE + CHUNK_SIZE / 2);
  const fauna = generateChunkFauna(prov.id, cx, cy, force);
  db.prepare("INSERT INTO activity_log (player_id, kind, message, level) VALUES (NULL, 'admin', ?, 'info')")
    .run(`Chunk (${cx}, ${cy}) regenerado con force=${force} → ${fauna.length} bestias`);
  pushLog('info', 'admin', `Regeneración forzada de chunk (${cx}, ${cy}) [QA]`);
  res.json({ success: true, data: { chunkX: cx, chunkY: cy, regenerated: true, force, message: `Chunk (${cx}, ${cy}) de ${prov.name.split(',')[0]} regenerado: ${fauna.length} bestias sembradas` } });
});

// ══ D. BESTIARIO (fauna/flora) Y FACCIONES — CRUD ═══════════════════════════
const BEAST_SELECT = `
  SELECT id, name, tier, danger_level AS dangerLevel, habitat, key_material AS keyMaterial,
         is_aquatic AS isAquatic, custom FROM admin_beasts`;

adminRouter.get('/beasts', (_req: Request, res: Response) => {
  const rows = db.prepare(BEAST_SELECT).all() as BeastRowOut[];
  res.json({ success: true, data: rows });
});

adminRouter.post('/beasts', (req: Request, res: Response) => {
  const b = req.body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) { res.status(400).json({ success: false, message: 'El nombre es obligatorio' }); return; }
  const id = typeof b.id === 'string' && b.id.trim() ? b.id.trim() : `beast_custom_${Date.now().toString(36)}`;
  const tiers = ['Mutante', 'Desolada', 'Ancestral', 'Primordial'];
  const tier = tiers.includes(String(b.tier)) ? String(b.tier) : 'Mutante';
  try {
    db.prepare(`INSERT INTO admin_beasts (id, name, tier, danger_level, habitat, key_material, is_aquatic, custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(id, name, tier, clampInt(b.dangerLevel, 1, 10, 1), String(b.habitat ?? ''), String(b.keyMaterial ?? ''), b.isAquatic ? 1 : 0);
    pushLog('info', 'admin', `Bestia creada: ${name} (${tier}, peligro ${clampInt(b.dangerLevel, 1, 10, 1)})`);
    res.json({ success: true, data: db.prepare(BEAST_SELECT + ' WHERE id = ?').get(id) as BeastRowOut });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(409).json({ success: false, message: msg });
  }
});

adminRouter.patch('/beasts/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) { res.status(400).json({ success: false, message: 'Falta el id de la bestia' }); return; }
  const body = req.body as Record<string, unknown>;
  const sets: string[] = [];
  const vals: Array<string | number> = [];
  if (typeof body.name === 'string' && body.name.trim()) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.dangerLevel !== undefined) { sets.push('danger_level = ?'); vals.push(clampInt(body.dangerLevel, 1, 10, 1)); }
  if (typeof body.tier === 'string') { sets.push('tier = ?'); vals.push(body.tier); }
  if (typeof body.habitat === 'string') { sets.push('habitat = ?'); vals.push(body.habitat); }
  if (typeof body.keyMaterial === 'string') { sets.push('key_material = ?'); vals.push(body.keyMaterial); }
  if (body.isAquatic !== undefined) { sets.push('is_aquatic = ?'); vals.push(body.isAquatic ? 1 : 0); }
  if (sets.length === 0) { res.status(400).json({ success: false, message: 'Nada que actualizar' }); return; }

  // UPSERT: permite ajustar "en caliente" incluso especies que solo viven en seeds.
  const base = getBeastCatalog().find((x) => x.id === id);
  vals.push(id, base?.name ?? id, base?.tier ?? 'Mutante', base?.dangerLevel ?? 1, base?.habitat ?? '', base?.keyMaterial ?? '', base?.isAquatic ?? 0);
  db.prepare(`
    INSERT INTO admin_beasts (id, name, tier, danger_level, habitat, key_material, is_aquatic, custom)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET ${sets.join(', ')}, custom = 1`)
    .run(...vals.slice(sets.length), ...vals.slice(0, sets.length));

  pushLog('info', 'admin', `Bestia ${id} balanceada en caliente: ${sets.map((s) => s.replace(' = ?', '')).join(', ')}`);
  res.json({ success: true, data: db.prepare(BEAST_SELECT + ' WHERE id = ?').get(id) as BeastRowOut });
});

adminRouter.delete('/beasts/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM admin_beasts WHERE id = ?').run(req.params.id);
  if (info.changes === 0) { res.status(404).json({ success: false, message: 'Bestia no encontrada en BD' }); return; }
  pushLog('info', 'admin', `Bestia eliminada del bestiario: ${req.params.id}`);
  res.json({ success: true, data: { deleted: req.params.id } });
});

const FLORA_SELECT = 'SELECT id, name, rarity, effect, habitat, custom FROM admin_flora';

adminRouter.get('/flora', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.prepare(FLORA_SELECT).all() as FloraRowOut[] });
});

adminRouter.post('/flora', (req: Request, res: Response) => {
  const f = req.body as Record<string, unknown>;
  const name = typeof f.name === 'string' ? f.name.trim() : '';
  if (!name) { res.status(400).json({ success: false, message: 'El nombre es obligatorio' }); return; }
  const id = typeof f.id === 'string' && f.id.trim() ? f.id.trim() : `flora_custom_${Date.now().toString(36)}`;
  const rarities = ['Común', 'Rara', 'Épica', 'Legendaria'];
  const rarity = rarities.includes(String(f.rarity)) ? String(f.rarity) : 'Común';
  try {
    db.prepare('INSERT INTO admin_flora (id, name, rarity, effect, habitat, custom) VALUES (?, ?, ?, ?, ?, 1)')
      .run(id, name, rarity, String(f.effect ?? ''), String(f.habitat ?? ''));
    pushLog('info', 'admin', `Flora creada: ${name} (${rarity})`);
    res.json({ success: true, data: db.prepare(FLORA_SELECT + ' WHERE id = ?').get(id) as FloraRowOut });
  } catch (err) {
    res.status(409).json({ success: false, message: err instanceof Error ? err.message : String(err) });
  }
});

adminRouter.patch('/flora/:id', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const sets: string[] = [];
  const vals: Array<string | number> = [];
  if (typeof body.name === 'string' && body.name.trim()) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (typeof body.rarity === 'string') { sets.push('rarity = ?'); vals.push(body.rarity); }
  if (typeof body.effect === 'string') { sets.push('effect = ?'); vals.push(body.effect); }
  if (typeof body.habitat === 'string') { sets.push('habitat = ?'); vals.push(body.habitat); }
  if (sets.length === 0) { res.status(400).json({ success: false, message: 'Nada que actualizar' }); return; }
  const info = db.prepare(`UPDATE admin_flora SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id);
  if (info.changes === 0) { res.status(404).json({ success: false, message: 'Especie no encontrada' }); return; }
  pushLog('info', 'admin', `Flora ${req.params.id} actualizada`);
  res.json({ success: true, data: db.prepare(FLORA_SELECT + ' WHERE id = ?').get(req.params.id) as FloraRowOut });
});

adminRouter.delete('/flora/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM admin_flora WHERE id = ?').run(req.params.id);
  if (info.changes === 0) { res.status(404).json({ success: false, message: 'Especie no encontrada' }); return; }
  pushLog('info', 'admin', `Flora eliminada: ${req.params.id}`);
  res.json({ success: true, data: { deleted: req.params.id } });
});

const FACTION_SELECT = `
  SELECT id, name, type, alignment, element, description, power_level AS powerLevel, territory, custom
  FROM admin_factions`;

adminRouter.get('/factions', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.prepare(FACTION_SELECT).all() as FactionRowOut[] });
});

adminRouter.post('/factions', (req: Request, res: Response) => {
  const f = req.body as Record<string, unknown>;
  const name = typeof f.name === 'string' ? f.name.trim() : '';
  if (!name) { res.status(400).json({ success: false, message: 'El nombre es obligatorio' }); return; }
  const id = typeof f.id === 'string' && f.id.trim() ? f.id.trim() : `faction_custom_${Date.now().toString(36)}`;
  const types = ['Secta', 'Clan', 'Culto', 'Gremio', 'Organización'];
  const alignments = ['Ortodoxa', 'Heterodoxa', 'Demoníaca', 'Neutral'];
  try {
    db.prepare(`INSERT INTO admin_factions (id, name, type, alignment, element, description, power_level, territory, custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`)
      .run(id, name,
           types.includes(String(f.type)) ? String(f.type) : 'Secta',
           alignments.includes(String(f.alignment)) ? String(f.alignment) : 'Neutral',
           String(f.element ?? 'Qi'), String(f.description ?? ''),
           clampInt(f.powerLevel, 1, 10, 1), String(f.territory ?? ''));
    pushLog('info', 'admin', `Facción creada: ${name}`);
    res.json({ success: true, data: db.prepare(FACTION_SELECT + ' WHERE id = ?').get(id) as FactionRowOut });
  } catch (err) {
    res.status(409).json({ success: false, message: err instanceof Error ? err.message : String(err) });
  }
});

adminRouter.patch('/factions/:id', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const sets: string[] = [];
  const vals: Array<string | number> = [];
  if (typeof body.name === 'string' && body.name.trim()) { sets.push('name = ?'); vals.push(body.name.trim()); }
  if (body.powerLevel !== undefined) { sets.push('power_level = ?'); vals.push(clampInt(body.powerLevel, 1, 10, 1)); }
  if (typeof body.alignment === 'string') { sets.push('alignment = ?'); vals.push(body.alignment); }
  if (typeof body.element === 'string') { sets.push('element = ?'); vals.push(body.element); }
  if (typeof body.description === 'string') { sets.push('description = ?'); vals.push(body.description); }
  if (typeof body.territory === 'string') { sets.push('territory = ?'); vals.push(body.territory); }
  if (sets.length === 0) { res.status(400).json({ success: false, message: 'Nada que actualizar' }); return; }
  const info = db.prepare(`UPDATE admin_factions SET ${sets.join(', ')} WHERE id = ?`).run(...vals, req.params.id);
  if (info.changes === 0) { res.status(404).json({ success: false, message: 'Facción no encontrada' }); return; }
  pushLog('info', 'admin', `Facción ${req.params.id} balanceada en caliente`);
  res.json({ success: true, data: db.prepare(FACTION_SELECT + ' WHERE id = ?').get(req.params.id) as FactionRowOut });
});

adminRouter.delete('/factions/:id', (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM admin_factions WHERE id = ?').run(req.params.id);
  if (info.changes === 0) { res.status(404).json({ success: false, message: 'Facción no encontrada' }); return; }
  pushLog('info', 'admin', `Facción eliminada: ${req.params.id}`);
  res.json({ success: true, data: { deleted: req.params.id } });
});

// ══ E. LOGS (REST + SSE) Y CONSOLA DE DEBUG ═════════════════════════════════
adminRouter.get('/logs', (req: Request, res: Response) => {
  const level = req.query.level as LogLevel | undefined;
  const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug'];
  res.json({
    success: true,
    data: getLogs({
      level: level && validLevels.includes(level) ? level : undefined,
      q: String(req.query.q ?? ''),
      limit: clampInt(req.query.limit, 1, 500, 200),
    }),
  });
});

// SSE en tiempo real. EventSource no puede mandar headers, así que aceptamos
// también el token por query string (?token=...), validado de igual forma.
adminRouter.get('/logs/stream', (req: Request, res: Response) => {
  const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined;
  const token = bearer ?? String(req.query.token ?? '');
  const decoded = verifyToken(token);
  if (!decoded || !isAdminUser(decoded.userId)) {
    res.status(401).json({ success: false, message: 'No autorizado para el stream de logs' });
    return;
  }
  const cleanup = subscribeLogs(res);
  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch { /* noop */ } }, 25_000);
  req.on('close', () => { clearInterval(heartbeat); cleanup(); });
});

interface CommandOutcome { ok: boolean; output: string }

/** Ejecuta un comando interno de QA sobre la BD autoritativa. */
function runDebugCommand(raw: string, actorPlayerId: string | null): CommandOutcome {
  const parts = raw.trim().replace(/^\//, '').split(/\s+/);
  const cmd = (parts[0] ?? '').toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      return { ok: true, output: 'Comandos: /spawn_wolf <x> <y> | /give_item <playerId|me> <nombre> <cat> <qty> | /tp <playerId> <x> <y> | /set_danger <beastId> <1-10> | /stats | /who_online' };

    case 'spawn_wolf': {
      const x = Number(args[0]), y = Number(args[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) {
        return { ok: false, output: 'Uso: /spawn_wolf <x> <y> (coordenadas 0..999)' };
      }
      const wolf = getBeastCatalog().find((b) => b.name.toLowerCase().includes('lobo'));
      const beastId = wolf?.id ?? 'beast_ice_wolf';
      const chunkX = Math.floor(x / CHUNK_SIZE), chunkY = Math.floor(y / CHUNK_SIZE);
      const rng = mulberry32(stringToHash(`spawn_${beastId}_${x}_${y}_${getChunkRegenCount()}`));
      const hp = 40 + Math.floor(rng() * 60);
      db.prepare('INSERT INTO debug_spawns (beast_id, x, y, chunk_x, chunk_y, hp) VALUES (?, ?, ?, ?, ?, ?)')
        .run(beastId, Math.round(x), Math.round(y), chunkX, chunkY, hp);
      pushLog('debug', 'debug', `/spawn_wolf → ${beastId} en (${x}, ${y}) HP=${hp} (chunk ${chunkX},${chunkY})`);
      return { ok: true, output: `Lobo sembrado: ${beastId} en (${Math.round(x)}, ${Math.round(y)}) con ${hp} HP. Chunk (${chunkX}, ${chunkY}).` };
    }

    case 'give_item': {
      const target = args[0] === 'me' || args[0] === undefined ? actorPlayerId : args[0];
      const itemName = args[1];
      const category = args[2] ?? 'misc';
      const qty = clampInt(args[3], 1, 999, 1);
      if (!target) return { ok: false, output: 'Indica un playerId o usa /give_item me <nombre> <cat> <qty>' };
      if (!itemName) return { ok: false, output: 'Uso: /give_item <playerId|me> <nombre> <categoria> <cantidad>' };
      const player = db.prepare('SELECT id FROM players WHERE id = ?').get(target);
      if (!player) return { ok: false, output: `Jugador ${target} no existe.` };
      db.prepare(`INSERT INTO inventory_items (player_id, item_key, name, category, quantity, description)
                  VALUES (?, ?, ?, ?, ?, 'Otorgado vía consola de depuración.')
                  ON CONFLICT(player_id, item_key) DO UPDATE SET quantity = quantity + excluded.quantity`)
        .run(target, `dbg_${itemName.toLowerCase().replace(/\s+/g, '_')}`, itemName, category, qty);
      pushLog('debug', 'debug', `/give_item → ${qty}x ${itemName} para ${target}`);
      return { ok: true, output: `${qty}x "${itemName}" (${category}) añadidos al inventario de ${target}.` };
    }

    case 'tp': {
      const target = args[0]; const x = Number(args[1]); const y = Number(args[2]);
      if (!target || !Number.isFinite(x) || !Number.isFinite(y)) return { ok: false, output: 'Uso: /tp <playerId> <x> <y>' };
      const info = db.prepare('UPDATE players SET x = ?, y = ? WHERE id = ?').run(Math.round(x), Math.round(y), target);
      if (info.changes === 0) return { ok: false, output: `Jugador ${target} no existe.` };
      db.prepare("INSERT INTO activity_log (player_id, kind, message, level) VALUES (?, 'admin', ?, 'success')")
        .run(target, `Teletransporte por consola de debug a (${Math.round(x)}, ${Math.round(y)})`);
      pushLog('debug', 'debug', `/tp ${target} → (${x}, ${y})`);
      return { ok: true, output: `${target} teletransportado a (${Math.round(x)}, ${Math.round(y)}).` };
    }

    case 'set_danger': {
      const id = args[0]; const lvl = clampInt(args[1], 1, 10, -1);
      if (!id || lvl < 0) return { ok: false, output: 'Uso: /set_danger <beastId> <1-10>' };
      db.prepare(`INSERT INTO admin_beasts (id, name, tier, danger_level, habitat, key_material, is_aquatic, custom)
                  VALUES (?, ?, 'Mutante', ?, '', '', 0, 1)
                  ON CONFLICT(id) DO UPDATE SET danger_level = excluded.danger_level, custom = 1`)
        .run(id, id, lvl);
      pushLog('debug', 'debug', `/set_danger ${id} → ${lvl}`);
      return { ok: true, output: `dangerLevel de ${id} fijado en ${lvl} (aplica a la próxima generación de chunks).` };
    }

    case 'stats': {
      const players = (db.prepare('SELECT COUNT(*) AS n FROM players').get() as CountRow).n;
      const spawns = (db.prepare('SELECT COUNT(*) AS n FROM debug_spawns').get() as CountRow).n;
      const pois = (db.prepare('SELECT COUNT(*) AS n FROM world_pois').get() as CountRow).n;
      return { ok: true, output: `players=${players} debug_spawns=${spawns} pois=${pois} regen=${getChunkRegenCount()}` };
    }

    case 'who_online': {
      const rows = db.prepare(`
        SELECT DISTINCT p.name FROM activity_log a JOIN players p ON p.id = a.player_id
        WHERE a.ts >= datetime('now', '-5 minutes') LIMIT 20`).all() as Array<{ name: string }>;
      return { ok: true, output: rows.length ? rows.map((r) => r.name).join(', ') : 'Nadie activo en los últimos 5 minutos.' };
    }

    default:
      return { ok: false, output: `Comando desconocido: "${cmd}". Prueba /help` };
  }
}

adminRouter.post('/debug/command', (req: Request, res: Response) => {
  const raw = typeof req.body?.command === 'string' ? req.body.command : '';
  if (!raw.trim()) { res.status(400).json({ success: false, message: 'Comando vacío' }); return; }
  try {
    const result = runDebugCommand(raw, null);
    res.json({ success: true, data: { ...result, logs: getLogs({ limit: 5 }) } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    pushLog('error', 'debug', `Fallo ejecutando "${raw}": ${msg}`);
    res.json({ success: true, data: { ok: false, output: `Error interno: ${msg}`, logs: getLogs({ limit: 5 }) } });
  }
});
