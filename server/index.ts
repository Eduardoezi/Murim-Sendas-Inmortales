// server/index.ts
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db/database';
import { register, login, verifyToken } from './auth';
import { adminRouter } from './admin/router';
import { pushLog } from './admin/logbus';
import { ensurePoisSeeded, getBeastCatalog } from './admin/world';

const app = express();
app.use(cors());
app.use(express.json());

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
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.userId);
    if (!userExists) {
      return res.status(400).json({ success: false, message: 'El usuario ya no existe.' });
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

  const player: any = db.prepare('SELECT * FROM players WHERE user_id = ?').get(decoded.userId);
  if (!player) return res.json({ success: true, player: null });

  res.json({ 
    success: true, 
    player: { 
      ...player, 
      stats_json: JSON.parse(player.stats_json),
      appearance_json: player.appearance_json ? JSON.parse(player.appearance_json) : null
    } 
  });
});

// ── MIGRACIÓN: columnas de progresión ──────────────────────────────────────
const ensureProgressColumns = () => {
  const cols: Array<[string, string]> = [
    ['hp', 'INTEGER'], ['max_hp', 'INTEGER'], ['qi', 'INTEGER'], ['max_qi', 'INTEGER'],
    ['spirit_stones', 'INTEGER DEFAULT 250'], ['sect_merits', 'INTEGER DEFAULT 0'],
    ['cb_actual', 'INTEGER DEFAULT 0'], ['cb_requerido', 'INTEGER DEFAULT 100'],
    ['x', 'INTEGER'], ['y', 'INTEGER'], ['last_seen', 'INTEGER']
  ];
  const existing = db.prepare(`PRAGMA table_info(players)`).all() as any[];
  const names = new Set(existing.map((c) => c.name));
  for (const [name, type] of cols) {
    if (!names.has(name)) db.prepare(`ALTER TABLE players ADD COLUMN ${name} ${type}`).run();
  }
};
ensureProgressColumns();

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

function seedInventoryIfEmpty(playerId: string) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM inventory_items WHERE player_id = ?').get(playerId) as any).n;
  if (count > 0) return;
  const starter = [
    ['rice_balls', 'Bolas de Arroz', 'consumible', 3, 'Ración sencilla.'],
    ['minor_qi_pill', 'Píldora de Qi Menor', 'elixir', 1, 'Refina una gota de Qi.'],
    ['traveler_token', 'Ficha del Errante', 'llave', 1, 'Credencial de paso.'],
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

app.get('/api/player/state', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  const p: any = db.prepare('SELECT * FROM players WHERE id = ?').get(pid);
  res.json({ success: true, player: p });
});

// ✅ RUTA ARREGLADA: Sintaxis limpia, sin código huérfano
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
  logActivity(pid, 'progress', `Progreso guardado`);
  res.json({ success: true, player: p2 });
});

function logActivity(playerId: string | null, kind: string, message: string, level: 'info' | 'success' | 'error' = 'info'): void {
  try {
    db.prepare("INSERT INTO activity_log (player_id, kind, message, level) VALUES (?, ?, ?, ?)").run(playerId, kind, message, level);
  } catch (err) {
    console.error('No se pudo registrar actividad:', err);
  }
}

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
  
  if (cb >= req_) {
    cb -= req_;
    req_ = Math.floor(req_ * 1.6);
    const stage = parseInt(realmName.match(/Etapa (\d+)/)?.[1] ?? '1', 10);
    realmName = realmName.replace(/Etapa \d+/, `Etapa ${stage + 1}`);
    breakthrough = true;
    db.prepare("UPDATE players SET realm_name = ? WHERE id = ?").run(realmName, pid);
  }
  db.prepare('UPDATE players SET cb_actual = ?, cb_requerido = ? WHERE id = ?').run(cb, req_, pid);
  logActivity(pid, 'meditation', breakthrough ? `Ascenso: ${realmName}` : `Meditación +${ganancia} CB`, breakthrough ? 'success' : 'info');
  res.json({ success: true, cb_actual: cb, cb_requerido: req_, breakthrough, realm_name: realmName });
});

app.get('/api/player/inventory', (req, res) => {
  const pid = requirePlayer(req, res);
  if (!pid) return;
  seedInventoryIfEmpty(pid);
  const items = db.prepare('SELECT id, item_key, name, category, quantity, description FROM inventory_items WHERE player_id = ? ORDER BY category, name').all(pid);
  res.json({ success: true, items, capacity: 15 });
});

// ── PORTAL DE ADMINISTRACIÓN: TABLAS BASE ──────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  ts DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(ts);
`);

// Semillas y configuración de admin
const ensureColumn = (table: string, column: string, decl: string): void => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`).run();
};
ensureColumn('users', 'is_admin', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('players', 'banned', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('players', 'ban_reason', 'TEXT');

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

// ✅ Solo montamos el enrutador oficial de administración
app.use('/api/admin', adminRouter);

const origError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  origError(...args);
  pushLog('error', 'http', args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
};

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});