// src/ui/screens/admin/LogsViewer.tsx
// ─────────────────────────────────────────────────────────────────────────────
// E. VISOR DE LOGS — streaming SSE en tiempo real desde /api/admin/logs/stream
// (el token viaja por query porque EventSource no admite headers). Incluye
// snapshot inicial vía REST, filtro por nivel/búsqueda y desconexión limpia.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import { Radio, WifiOff, Trash2, ScrollText } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import type { LogEntry, LogLevel } from '../../../types/admin.types';
import { PageHeader } from '../../components/admin/Spinner';

const LEVEL_STYLE: Record<LogLevel, string> = {
  info: 'text-cyan-300',
  warn: 'text-amber-400',
  error: 'text-rose-400',
  debug: 'text-stone-500',
};

const LEVEL_BADGE: Record<LogLevel, string> = {
  info: 'bg-cyan-950/60 border-cyan-800 text-cyan-300',
  warn: 'bg-amber-950/60 border-amber-800 text-amber-400',
  error: 'bg-rose-950/60 border-rose-800 text-rose-400',
  debug: 'bg-stone-800/70 border-stone-700 text-stone-400',
};

type StreamState = 'connecting' | 'live' | 'offline';

export const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<'' | LogLevel>('');
  const [search, setSearch] = useState('');
  const [stream, setStream] = useState<StreamState>('connecting');
  const [paused, setPaused] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Snapshot inicial (REST) + suscripción SSE (tiempo real).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const snapshot = await adminService.getLogs({ limit: 200 });
        if (!cancelled) setLogs(snapshot);
      } catch { /* si falla el snapshot, el SSE traerá el init igualmente */ }
    })();

    const es = new EventSource(adminService.logsStreamUrl());
    esRef.current = es;

    es.onopen = () => { if (!cancelled) setStream('live'); };
    es.onerror = () => { if (!cancelled) setStream('offline'); };

    es.addEventListener('init', (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as LogEntry[];
        if (!cancelled) setLogs(data);
      } catch { /* payload corrupto: ignorar */ }
    });

    es.addEventListener('log', (ev: MessageEvent<string>) => {
      if (cancelled || pausedRef.current) return;
      try {
        const entry = JSON.parse(ev.data) as LogEntry;
        setLogs((prev) => [entry, ...prev].slice(0, 500));
      } catch { /* payload corrupto: ignorar */ }
    });

    return () => {
      cancelled = true;
      es.close();
      esRef.current = null;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      setLogs(await adminService.getLogs({ level: levelFilter || undefined, q: search, limit: 300 }));
    } catch { /* mantener lo que hay en pantalla */ }
  }, [levelFilter, search]);

  const q = search.trim().toLowerCase();
  const visible = logs.filter(
    (l) => (!levelFilter || l.level === levelFilter) && (!q || l.message.toLowerCase().includes(q) || l.source.includes(q)),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logs del Servidor"
        subtitle="Anillo circular de eventos del backend · streaming Server-Sent Events en vivo"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
                stream === 'live'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : stream === 'connecting'
                    ? 'bg-stone-900 border-stone-700 text-stone-400'
                    : 'bg-rose-950/60 border-rose-800 text-rose-400'
              }`}
            >
              {stream === 'offline' ? <WifiOff className="w-3.5 h-3.5" /> : <Radio className={`w-3.5 h-3.5 ${stream === 'live' ? 'animate-pulse' : ''}`} />}
              {stream === 'live' ? 'EN VIVO' : stream === 'connecting' ? 'Conectando…' : 'Desconectado'}
            </span>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                paused ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {paused ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Limpiar
            </button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(['', 'info', 'warn', 'error', 'debug'] as const).map((lv) => (
            <button
              key={lv || 'all'}
              onClick={() => setLevelFilter(lv)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                levelFilter === lv ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
              }`}
            >
              {lv === '' ? 'Todos' : lv.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void reload(); }}
          placeholder="Buscar en mensajes… (Enter para refrescar desde BD)"
          className="flex-1 min-w-52 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:border-amber-700 focus:outline-none"
        />
        <span className="text-xs text-stone-500 font-mono">{visible.length}/{logs.length}</span>
      </div>

      {/* Consola de logs */}
      <div className="bg-[#0b0d12] border border-stone-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-950 border-b border-stone-800">
          <ScrollText className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono text-stone-400">activity ring · más reciente primero</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto font-mono text-xs divide-y divide-stone-800/40">
          {visible.length === 0 ? (
            <p className="text-stone-600 text-center py-12">Sin entradas que coincidan. Los nuevos eventos aparecerán aquí en vivo.</p>
          ) : (
            visible.map((l) => (
              <div key={`${l.id}-${l.ts}`} className="flex items-start gap-3 px-4 py-2 hover:bg-stone-900/40 transition-colors">
                <span className="text-stone-600 w-36 flex-shrink-0">{new Date(l.ts).toLocaleTimeString('es-ES')}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border w-14 text-center flex-shrink-0 uppercase ${LEVEL_BADGE[l.level]}`}>{l.level}</span>
                <span className={`w-16 flex-shrink-0 ${LEVEL_STYLE[l.level]}`}>{l.source}</span>
                <span className="text-stone-300 break-all">{l.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
