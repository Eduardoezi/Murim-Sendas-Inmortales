// src/ui/screens/admin/Dashboard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A. DASHBOARD — salud del servidor en tiempo real.
// Los datos provienen SIEMPRE del backend autoritativo (GET /api/admin/dashboard);
// aquí solo se muestran. Incluye spinner de carga, estado de error con reintento
// y auto-refresh cada 30 s. Gráfico de actividad 24h con Recharts.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react';
import { Users, Globe, Zap, Activity, Server, TrendingUp, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { adminService } from '../../../core/services/adminService';
import type { DashboardPayload } from '../../../types/admin.types';
import { Spinner, ErrorState } from '../../components/admin/Spinner';

const REFRESH_MS = 30_000;

const fmtNumber = (n: number): string => n.toLocaleString('es-ES');

/** "2026-10-28T09:12:00Z" → "Hace 5 min" (relativo, sin dependencias externas). */
const timeAgo = (iso: string): string => {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
};

interface MetricCard {
  label: string;
  value: string;
  icon: typeof Users;
  color: string;
  bg: string;
}

export const Dashboard = () => {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminService.getDashboard();
      setPayload(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar con /api/admin/dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !payload) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Consultando el estado del servidor…" />
      </div>
    );
  }
  if (!payload) {
    return <ErrorState message={error ?? 'Sin datos del dashboard'} onRetry={() => void load()} />;
  }

  const m = payload.metrics;
  const metrics: MetricCard[] = [
    { label: 'Jugadores en Línea', value: fmtNumber(m.onlinePlayers), icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-950/30' },
    { label: 'Cuentas Totales', value: fmtNumber(m.totalAccounts), icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
    { label: 'Chunks del Mundo', value: fmtNumber(m.totalChunks), icon: Globe, color: 'text-amber-400', bg: 'bg-amber-950/30' },
    { label: 'Bestias Catalogadas', value: fmtNumber(m.totalBeasts), icon: Zap, color: 'text-rose-400', bg: 'bg-rose-950/30' },
  ];

  const maxHourLabel = payload.activity.length > 12 ? 3 : 6; // etiquetas cada N horas

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-cinzel text-3xl text-amber-100 mb-2">Panel de Control</h1>
          <p className="text-stone-400 text-sm">
            Vista general del estado del servidor y la actividad del mundo en tiempo real.
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-stone-500">
              <span className={`w-2 h-2 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
              {error ? 'Actualización fallida — reintentando' : 'En vivo · refresco cada 30 s'}
            </span>
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-stone-700 bg-stone-900/60 text-stone-300 hover:border-amber-600/60 hover:text-amber-300 transition-colors"
          title="Refrescar ahora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>

      {/* Tarjetas de Métricas (datos reales del backend) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((mc) => (
          <div key={mc.label} className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{mc.label}</p>
              <p className={`text-3xl font-bold font-mono ${mc.color}`}>{mc.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${mc.bg}`}>
              <mc.icon className={`w-6 h-6 ${mc.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Fila secundaria: métricas de balanceo/mundo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Personajes', value: fmtNumber(m.totalPlayers) },
          { label: 'Flora', value: fmtNumber(m.totalFlora) },
          { label: 'Facciones', value: fmtNumber(m.totalFactions) },
          { label: 'POIs', value: fmtNumber(m.totalPois) },
          { label: 'Creaciones hoy', value: fmtNumber(m.creationsToday) },
        ].map((s) => (
          <div key={s.label} className="bg-stone-900/40 border border-stone-800/70 rounded-lg px-4 py-3">
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-mono text-stone-200">{s.value}</p>
          </div>
        ))}
        <div className="bg-stone-900/40 border border-stone-800/70 rounded-lg px-4 py-3 min-w-0">
          <p className="text-[10px] text-stone-500 uppercase tracking-wider">Semilla del mundo</p>
          <p className="text-sm font-mono text-amber-300 truncate" title={m.worldSeed}>{m.worldSeed}</p>
        </div>
      </div>

      {/* Sección inferior: Gráfico real (Recharts) y Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> Actividad de Jugadores (24h)
            </h2>
            <span className="text-[11px] text-stone-500">barras = acciones · línea = creaciones</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={payload.activity} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="#292524" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="hour"
                  interval={maxHourLabel}
                  tick={{ fill: '#78716c', fontSize: 10 }}
                  axisLine={{ stroke: '#44403c' }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#78716c', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c0a09', border: '1px solid #44403c', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#e7e5e4' }}
                  formatter={(value: number | string, name: string) => [Number(value), name === 'actions' ? 'Acciones' : 'Creaciones']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => (v === 'actions' ? 'Acciones' : 'Creaciones')} />
                <Bar dataKey="actions" fill="#b45309" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="creations" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feed de eventos recientes (activity_log del backend) */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-cyan-500" /> Eventos Recientes
          </h2>
          {payload.recentEvents.length === 0 ? (
            <p className="text-sm text-stone-500">Sin actividad registrada todavía.</p>
          ) : (
            <div className="space-y-4">
              {payload.recentEvents.map((ev) => (
                <div key={ev.id} className="flex gap-3 text-sm">
                  <div
                    className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                      ev.type === 'error' ? 'bg-rose-500' : ev.type === 'success' ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-stone-300 break-words">{ev.text}</p>
                    <p className="text-[10px] text-stone-500">{timeAgo(ev.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
