// server/admin/logbus.ts
// ─────────────────────────────────────────────────────────────────────────────
// Anillo circular de logs del servidor + streaming SSE para /admin/logs.
// Todo evento relevante (errores Node, acciones de admin, comandos de debug)
// pasa por aquí; así el portal ve el Jianghu "en caliente" sin reiniciar nada.
// ─────────────────────────────────────────────────────────────────────────────
import type { Response } from 'express';
import db from '../db/database';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: number;
  ts: string;          // ISO
  level: LogLevel;
  source: string;      // http | db | admin | debug | system
  message: string;
}

const RING_CAPACITY = 500;
const ring: LogEntry[] = [];
let seq = 0;
const listeners = new Set<Response>();

/** Publica un log en el anillo y lo empuja a todos los clientes SSE conectados. */
export function pushLog(level: LogLevel, source: string, message: string): LogEntry {
  const entry: LogEntry = { id: ++seq, ts: new Date().toISOString(), level, source, message };
  ring.push(entry);
  if (ring.length > RING_CAPACITY) ring.shift();

  const payload = `event: log\ndata: ${JSON.stringify(entry)}\n\n`;
  for (const res of listeners) {
    try { res.write(payload); } catch { listeners.delete(res); }
  }

  // Persistencia ligera: solo warn/error (para auditoría post-mortem).
  if (level === 'warn' || level === 'error') {
    try {
      db.prepare('INSERT INTO admin_logs (level, source, message) VALUES (?, ?, ?)')
        .run(level, source, message);
    } catch { /* la BD puede estar migrando aún; no romper el request */ }
  }
  return entry;
}

/** Snapshot del anillo con filtro opcional por nivel/fuente/texto. */
export function getLogs(opts: { level?: LogLevel; q?: string; limit?: number } = {}): LogEntry[] {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), RING_CAPACITY);
  const q = (opts.q ?? '').toLowerCase();
  return ring
    .filter((l) => (!opts.level || l.level === opts.level) && (!q || l.message.toLowerCase().includes(q)))
    .slice(-limit)
    .reverse(); // más reciente primero
}

/** Registra una respuesta SSE y devuelve la función de limpieza. */
export function subscribeLogs(res: Response): () => void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  // Snapshot inicial para que el visor no arranque vacío.
  res.write(`event: init\ndata: ${JSON.stringify(getLogs({ limit: 100 }))}\n\n`);
  listeners.add(res);
  return () => { listeners.delete(res); };
}

/** Captura global: errores NO manejados de Node van al anillo (requisito E). */
process.on('uncaughtException', (err: Error) => {
  pushLog('error', 'system', `uncaughtException: ${err.stack?.split('\n')[0] ?? err.message}`);
});
process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  pushLog('error', 'system', `unhandledRejection: ${msg}`);
});
