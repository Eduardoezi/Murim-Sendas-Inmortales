import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.MURIM_DB_PATH || path.join(__dirname, '..', 'data', 'murim.db');
const SCHEMA_PATH = path.join(__dirname, 'db', 'schema.sql');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');
  _db.pragma('busy_timeout = 5000');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  _db.exec(schema);

  // Migraciones seguras para columnas añadidas
  try {
    _db.exec('ALTER TABLE players ADD COLUMN profile_json TEXT;');
  } catch {
    // Columna ya existe
  }

  console.log(`[db] SQLite inicializada en ${DB_PATH}`);
  return _db;
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
    console.log('[db] SQLite cerrada');
  }
}
