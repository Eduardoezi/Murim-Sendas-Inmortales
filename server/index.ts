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

  // ✅ AÑADIDO: any para evitar el error de TypeScript
  const player: any = db.prepare('SELECT * FROM players WHERE user_id = ?').get(decoded.userId);
  
  if (!player) return res.json({ success: true, player: null });

  res.json({ success: true, player: { ...player, stats_json: JSON.parse(player.stats_json) } });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});