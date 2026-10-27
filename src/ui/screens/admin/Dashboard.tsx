import { Users, Globe, Zap, Activity, Server, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  // TODO: Reemplazar con datos reales del backend
  const metrics = [
    { label: 'Jugadores en Línea', value: '124', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-950/30' },
    { label: 'Cuentas Totales', value: '2,847', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
    { label: 'Chunks Activos', value: '45', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-950/30' },
    { label: 'Bestias Activas', value: '89', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-950/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="font-cinzel text-3xl text-amber-100 mb-2">Panel de Control</h1>
        <p className="text-stone-400 text-sm">Vista general del estado del servidor y la actividad del mundo en tiempo real.</p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">{m.label}</p>
              <p className={`text-3xl font-bold font-mono ${m.color}`}>{m.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${m.bg}`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Sección inferior: Gráficos y Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico simulado */}
        <div className="lg:col-span-2 bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> Actividad de Jugadores (24h)
            </h2>
            <select className="bg-stone-950 border border-stone-700 text-xs text-stone-300 rounded px-2 py-1 outline-none">
              <option>Últimas 24h</option>
              <option>Últimos 7 días</option>
            </select>
          </div>
          
          {/* Placeholder del gráfico */}
          <div className="h-64 flex items-end justify-between gap-2 border-b border-stone-800 pb-2">
            {[40, 70, 45, 90, 65, 80, 100, 60, 30, 85, 95, 50].map((h, i) => (
              <div key={i} className="w-full bg-amber-900/50 hover:bg-amber-500/80 transition-colors rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-stone-500 mt-2">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
          </div>
        </div>

        {/* Feed de Eventos */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <h2 className="font-cinzel text-lg text-stone-200 flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-cyan-500" /> Eventos Recientes
          </h2>
          <div className="space-y-4">
            {[
              { time: 'Hace 2 min', text: 'Nuevo personaje creado: Lin Yun', type: 'info' },
              { time: 'Hace 15 min', text: 'Servidor respaldado (Backup)', type: 'success' },
              { time: 'Hace 1 hora', text: 'Jugador "Mo Yuan" ascendió a Refinamiento de Qi (Etapa 3)', type: 'info' },
              { time: 'Hace 2 horas', text: 'Error de conexión con la base de datos (Reintentando...)', type: 'error' },
              { time: 'Hace 3 horas', text: 'Mantenimiento programado finalizado', type: 'success' },
            ].map((ev, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                  ev.type === 'error' ? 'bg-rose-500' : ev.type === 'success' ? 'bg-emerald-500' : 'bg-cyan-500'
                }`} />
                <div>
                  <p className="text-stone-300">{ev.text}</p>
                  <p className="text-[10px] text-stone-500">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};