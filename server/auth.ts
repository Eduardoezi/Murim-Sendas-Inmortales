import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'murim-dev-secret-change-me';
const JWT_EXPIRES = '7d';

export interface AuthUser {
  id: number;
  email: string;
  characters: any[];
}

export async function registerUser(email: string, password: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (existing) return { success: false, message: 'Ese email ya está registrado.' };

  const hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
    .run(normalized, hash, Date.now());

  const token = jwt.sign({ userId: info.lastInsertRowid }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { success: true, token, user: { id: Number(info.lastInsertRowid), email: normalized, characters: [] } };
}

export async function loginUser(email: string, password: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const row: any = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) return { success: false, message: 'Credenciales inválidas.' };

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return { success: false, message: 'Credenciales inválidas.' };

  const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { success: true, token, user: { id: row.id, email: row.email, characters: [] } };
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    if (!decoded || typeof decoded.userId !== 'number') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getUserById(userId: number): AuthUser | null {
  const db = getDb();
  const user: any = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  let characters: any[] = [];
  try {
    characters = db
      .prepare(`SELECT id, name, realm, sect_id, class_type FROM players WHERE json_extract(profile_json, '$.userId') = ?`)
      .all(userId);
  } catch {
    characters = [];
  }

  return { id: user.id, email: user.email, characters };
}