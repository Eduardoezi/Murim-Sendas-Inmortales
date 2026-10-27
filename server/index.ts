// server/index.ts
import express from 'express';
import cors from 'cors';
import db from './db/database';
import { register, login, verifyToken } from './auth';

const app = express();
app.use(cors());
app.use(express.json());

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
      x = COALESCE(?, x), y = COALESCE(?, y)
    WHERE id = ?`)
    .run(hp ?? null, maxHp ?? null, qi ?? null, maxQi ?? null,
         spiritStones ?? null, sectMerits ?? null,
         cbActual ?? null, cbRequerido ?? null, x ?? null, y ?? null, pid);
  const p: any = db.prepare('SELECT * FROM players WHERE id = ?').get(pid);
  res.json({ success: true, player: p });
});

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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});