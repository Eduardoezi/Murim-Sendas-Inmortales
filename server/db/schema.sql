-- schema.sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT,
  appearance_json TEXT,
  alignment TEXT NOT NULL,  
  origin TEXT,
  faction TEXT,
  realm_name TEXT DEFAULT 'Refinamiento de Qi (Etapa 1)',
  stats_json TEXT NOT NULL, -- Guardamos los 12 atributos aquí en formato JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

