// server/index.ts
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db/database';
import { register, login, verifyToken } from './auth';
import { adminRouter } from './admin/router';
import { pushLog } from './admin/logbus';
import { ensurePoisSeeded, getBeastCatalog } from './admin/world';
import { registerAdminRoutes, registerPlayerEventRoutes } from './admin';

const app = express();
app.use(cors());
app.use(express.json());

// Bitácora de arranque para el visor de logs del portal (/admin/logs)
pushLog('info', 'system', 'Servidor Express inicializado');

// --- ENDPOINTS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await register(email, password);
    res.json({ success: true, token });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await login(email, password);
    res.json({ success: true, token });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// --- ENDPOINTS DE JUGADOR ---
app.post('/api/player/create', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No autorizado' });

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) return res.status(401).json({ success: false, message: 'Token inválido' });

  const { id, name, gender, birth_date, origin, faction, stats_json, appearance_json, alignment } = req.body;

  try {
    // ✅ VALIDACIÓN: Comprobar si el usuario realmente existe en la BD
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.userId);
    if (!userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'El usuario ya no existe. Por favor, cierra sesión y regístrate de nuevo.' 
      });
    }

    db.prepare(`
      INSERT INTO players (id, user_id, name, gender, birth_date, origin, faction, stats_json, appearance_json, alignment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, decoded.userId, name, gender, birth_date, origin, faction, JSON.stringify(stats_json), JSON.stringify(appearance_json), alignment);

    logActivity(id, 'creation', `Nuevo personaje creado: ${name}`);
    res.json({ success: true, message: 'Personaje creado con éxito.' });
  } catch (err: any) {
    console.error("Error al crear:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/player/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No autorizado' });

  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) return res.status(401).json({ success: false, message: 'Token inválido' });

  // ✅ any para evitar el error de TypeScript
  const player: any = db.prepare('SELECT * FROM players WHERE user_id = ?').get(decoded.userId);
  
  if (!player) return res.json({ success: true, player: null });

  // Devolvemos el objeto con los datos parseados
  res.json({ 
    success: true, 
    player: { 
      ...player, 
      stats_json: JSON.parse(player.stats_json),
      appearance_json: player.appearance_json ? JSON.parse(player.appearance_json) : null
    } 
  });
});
// ── MIGRACIÓN: columnas de progresión (idempotente, SQLite) ───────────────
const ensureProgressColumns = () => {
  const cols: Array<[string, string]> = [
    ['hp', 'INTEGER'], ['max_hp', 'INTEGER'], ['qi', 'INTEGER'], ['max_qi', 'INTEGER'],
    ['spirit_stones', 'INTEGER DEFAULT 250'], ['sect_merits', 'INTEGER DEFAULT 0'],
    ['cb_actual', 'INTEGER DEFAULT 0'], ['cb_requerido', 'INTEGER DEFAULT 100'],
    ['x', 'INTEGER'], ['y', 'INTEGER'],
  ];
  const existing = db.prepare(`PRAGMA table_info(players)`).all() as any[];
  const names = new Set(existing.map((c) => c.name));
  for (const [name, type] of cols) {
    if (!names.has(name)) db.prepare(`ALTER TABLE players ADD COLUMN ${name} ${type}`).run();
  }
};
ensureProgressColumns();

// Tabla de inventario (fuente real para la pantalla Alforja)
db.prepare(`
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
);`).run();

// Inventario inicial determinista para personajes recién creados (kit básico del GDD)
function seedInventoryIfEmpty(playerId: string) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM inventory_items WHERE player_id = ?').get(playerId) as any).n;
  if (count > 0) return;
  const starter = [
    ['rice_balls', 'Bolas de Arroz', 'consumible', 3, 'Ración sencilla: recupera algo de HP fuera de casa.'],
    ['minor_qi_pill', 'Píldora de Qi Menor', 'elixir', 1, 'Refina una gota de Qi al instante.'],
    ['traveler_token', 'Ficha del Errante', 'llave', 1, 'Credencial de paso en postos y portales.'],
  ] as const;
  const ins = db.prepare('INSERT INTO inventory_items (player_id, item_key, name, category, quantity, description) VALUES (?, ?, ?, ?, ?, ?)');
  for (const it of starter) ins.run(playerId, it[0], it[1], it[2], it[3], it[4]);
}

const requirePlayer = (req: any, res: any): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) { res.status(401).json({ success: false, message: 'No autorizado' }); return null; }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) { res.status(401).json({ success: false, message: 'Token inválido' }); return null; }
  const player: any = db.prepare('SELECT id FROM players WHERE user_id = ?').get(decoded.userId);
  if (!player) { res.status(404).json({ success: false, message: 'Sin personaje' }); return null; }
  return player.id;
};

// --- ESTADO COMPLETO DEL PERSONAJE (HUD React: ya no hay cifras locales) ---
app.get('/api/player/state', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  const p: any = db.prepare('SELECT * FROM players WHERE id = ?').get(pid);
  res.json({ success: true, player: p });
});

// --- Persistir progreso desde el cliente (HP/Qi/piedras/CB/posición) ---
app.post('/api/player/progress', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  const { hp, maxHp, qi, maxQi, spiritStones, sectMerits, cbActual, cbRequerido, x, y } = req.body;
  db.prepare(`UPDATE players SET
      hp = COALESCE(?, hp), max_hp = COALESCE(?, max_hp),
      qi = COALESCE(?, qi), max_qi = COALESCE(?, max_qi),
      spirit_stones = COALESCE(?, spirit_stones), sect_merits = COALESCE(?, sect_merits),
      cb_actual = COALESCE(?, cb_actual), cb_requerido = COALESCE(?, cb_requerido),
      x = COALESCE(?, x), y = COALESCE(?, y), last_seen = ?
    WHERE id = ?`)
    .run(hp ?? null, maxHp ?? null, qi ?? null, maxQi ?? null,
         spiritStones ?? null, sectMerits ?? null,
         cbActual ?? null, cbRequerido ?? null, x ?? null, y ?? null, Date.now(), pid);
  const p2: any = db.prepare('SELECT * FROM players WHERE id = ?').get(pid);
  logActivity(pid, 'progress', `Progreso guardado (HP ${p2.hp ?? '-'} → ${hp ?? '-'}, posición (${x ?? p2.x}, ${y ?? p2.y}))`);
  res.json({ success: true, player: p2 });
});

// --- Bitácora de actividad (alimenta el gráfico de 24h del Dashboard admin) ---
function logActivity(playerId: string | null, kind: string, message: string, level: 'info' | 'success' | 'error' = 'info'): void {
  try {
    db.prepare("INSERT INTO activity_log (player_id, kind, message, level) VALUES (?, ?, ?, ?)").run(playerId, kind, message, level);
  } catch (err) {
    console.error('No se pudo registrar actividad:', err);
  }
}

// --- Tick de meditación AUTORITATIVO (servidor aplica fórmula y guarda) ---
app.post('/api/player/meditate', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  const ganancia = Math.max(1, Math.floor(Number(req.body?.ganancia) || 0));
  const p: any = db.prepare('SELECT * FROM players WHERE id = ?').get(pid);
  seedInventoryIfEmpty(pid);

  let cb = (p.cb_actual ?? 0) + ganancia;
  let req_ = p.cb_requerido ?? 100;
  let realmName = p.realm_name;
  let breakthrough = false;
  // Ascenso simple por etapas dentro del reino actual (GDD: cuello de botella CB)
  if (cb >= req_) {
    cb -= req_;
    req_ = Math.floor(req_ * 1.6);
    const stage = parseInt(realmName.match(/Etapa (\d+)/)?.[1] ?? '1', 10);
    realmName = realmName.replace(/Etapa \d+/, `Etapa ${stage + 1}`);
    breakthrough = true;
    db.prepare("UPDATE players SET realm_name = ? WHERE id = ?").run(realmName, pid);
  }
  db.prepare('UPDATE players SET cb_actual = ?, cb_requerido = ? WHERE id = ?').run(cb, req_, pid);
  logActivity(pid, 'meditation', breakthrough ? `Ascenso: ${realmName} (CB ${cb}/${req_})` : `Meditación +${ganancia} CB (${cb}/${req_})`, breakthrough ? 'success' : 'info');
  res.json({ success: true, cb_actual: cb, cb_requerido: req_, breakthrough, realm_name: realmName });
});

// --- Inventario REAL (pantalla Alforja) ---
app.get('/api/player/inventory', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  seedInventoryIfEmpty(pid);
  const items = db.prepare('SELECT id, item_key, name, category, quantity, description FROM inventory_items WHERE player_id = ? ORDER BY category, name').all(pid);
  res.json({ success: true, items, capacity: 15 });
});

// ── PORTAL DE ADMINISTRACIÓN: tablas propias (idempotentes, SQLite) ────────
db.exec(`
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT,
  kind TEXT NOT NULL,             -- creation | progress | meditation | admin | debug
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info', -- info | success | error
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(ts);

CREATE TABLE IF NOT EXISTS world_pois (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('capital','sect','landmark','settlement')),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  province_id TEXT NOT NULL,
  lore_note TEXT
);

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
`);

// Migraciones aditivas sobre tablas existentes (users/players)
const ensureColumn = (table: string, column: string, decl: string): void => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`).run();
};
ensureColumn('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('players', 'banned', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('players', 'ban_reason', 'TEXT');

// Semilla de conveniencia para desarrollo: admin@murim.dev / admin123 (bcrypt)
{
  const existingAdmin = db.prepare('SELECT id, is_admin FROM users WHERE email = ?').get('admin@murim.dev') as { id: number; is_admin: number } | undefined;
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    const info = db.prepare("INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)").run('admin@murim.dev', hash);
    console.log(`[admin] Usuario administrador sembrado: admin@murim.dev / admin123 (id=${info.lastInsertRowid})`);
  } else if (existingAdmin.is_admin !== 1) {
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existingAdmin.id);
  }
}

// Semilla del bestiario/facciones/flora desde el catálogo autoritativo del servidor
function seedCatalogTables(): void {
  const beasts = getBeastCatalog();
  const insBeast = db.prepare(`INSERT OR IGNORE INTO admin_beasts (id, name, tier, danger_level, habitat, key_material, is_aquatic, custom)
                               VALUES (?, ?, ?, ?, ?, ?, ?, 0)`);
  for (const b of beasts) insBeast.run(b.id, b.name, b.tier, b.dangerLevel, b.habitat, b.keyMaterial, b.isAquatic);

  const flora = [
    ['flora_spirit_grass', 'Hierba del Qi Espiritual', 'Común', 'Restaura una pequeña cantidad de Qi.', 'prov_henan'],
    ['flora_blood_lotus', 'Loto de Sangre Milenario', 'Épica', 'Permite a un cultivador romper un cuello de botella sin tribulación.', 'prov_hubei'],
    ['flora_void_crystal', 'Cristal del Vacío', 'Legendaria', 'Material necesario para forjar armas de grado Celestial.', 'prov_xizang'],
    ['flora_jade_orchid', 'Orquídea de Jade', 'Rara', 'Base de elixires de claridad mental.', 'prov_yunnan'],
    ['flora_dragon_blood_mushroom', 'Hongo de Sangre de Dragón', 'Épica', 'Multiplica la absorción de Qi durante la meditación.', 'prov_sichuan'],
  ] as const;
  const insFlora = db.prepare('INSERT OR IGNORE INTO admin_flora (id, name, rarity, effect, habitat, custom) VALUES (?, ?, ?, ?, ?, 0)');
  for (const f of flora) insFlora.run(f[0], f[1], f[2], f[3], f[4]);

  const factions = [
    ['sect_tianjian', 'Secta de la Espada Celestial', 'Secta', 'Ortodoxa', 'Rayo', 'Los espadachines más honorables del Jianghu.', 9, 'prov_shaanxi'],
    ['sect_shaolin', 'Templo Shaolin', 'Secta', 'Ortodoxa', 'Metal', 'Cuna de las artes marciales budistas.', 10, 'prov_henan'],
    ['sect_wudang', 'Secta Wudang', 'Secta', 'Ortodoxa', 'Agua', 'Maestros del boxeo interno y la dualidad Yin-Yang.', 9, 'prov_hubei'],
    ['sect_xuelian', 'Pabellón del Loto de Nieve', 'Secta', 'Ortodoxa', 'Agua', 'Soberanas de los picos helados, maestras de alquimia de hielo.', 8, 'prov_xizang'],
    ['cult_shadow', 'Culto de la Sombra Eterna', 'Culto', 'Demoníaca', 'Oscuridad', 'Herejes que cosechan almas para el Dao Prohibido.', 7, 'prov_guangxi'],
    ['guild_golden', 'Gremio de la Caravana Dorada', 'Gremio', 'Neutral', 'Tierra', 'Comerciantes armados que dominan la Ruta de la Seda.', 5, 'prov_gansu'],
  ] as const;
  const insFaction = db.prepare(`INSERT OR IGNORE INTO admin_factions (id, name, type, alignment, element, description, power_level, territory, custom)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`);
  for (const f of factions) insFaction.run(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7]);

  pushLog('info', 'db', `Catálogos sembrados: ${beasts.length} bestias, ${flora.length} plantas, ${factions.length} facciones`);
}
seedCatalogTables();

// POIs persistidos en la nueva base de datos de POIs
ensurePoisSeeded();

// --- Feed de eventos de JUGADOR (/api/events) — auth de usuario, ANTES del router admin ---
registerPlayerEventRoutes(app);

// --- Rutas del back office: TODO bajo /api/admin/* protegido por isAdmin ---
app.use('/api/admin', adminRouter);

// --- Logging de errores del servidor hacia el anillo de logs (SSE en /admin/logs) ---
const origError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  origError(...args);
  pushLog('error', 'http', args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
};
// --- RUTAS DE ADMINISTRACIÓN (métricas globales, no datos del jugador) ---
registerAdminRoutes(app);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});