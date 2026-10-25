// server/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db/database';

const JWT_SECRET = 'murim-super-secret-key-change-in-production';

export const register = async (email: string, password: string) => {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('El correo ya está registrado.');

  const hash = await bcrypt.hash(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash);
  
  return jwt.sign({ userId: info.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
};

export const login = async (email: string, password: string) => {
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new Error('Credenciales inválidas.');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Credenciales inválidas.');

  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
};