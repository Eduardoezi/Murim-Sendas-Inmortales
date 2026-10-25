// server/db/database.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Corregimos __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ La base de datos se creará en server/database.sqlite (un nivel arriba de db)
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// ✅ El schema.sql está en la misma carpeta db/
const schemaPath = path.resolve(__dirname, './schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export default db;