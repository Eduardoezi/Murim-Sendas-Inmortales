// src/ui/screens/AdminPage.tsx
import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { MeditationPanel } from '../components/MeditationPanel';
import { PhaserGame } from '../../game/PhaserGame'; // <--- IMPORTANTE
import { EventBus, PoiModalData } from '../../game/events/EventBus'; // <--- IMPORTANTE
import { playerService, InventoryItemRow } from '../../core/services/playerService';
import { adminService, AdminDashboardData, AdminWorldData } from '../../core/services/adminService';
import { getBiomeCached } from '../../core/data/world/generators/geoTileCache';
import { Map as MapIcon, Flame, Backpack, LogOut, Heart, Zap, Shield, Sword, X, Server, Globe2, Users, Activity } from 'lucide-react';

export const AdminPage = () => {
  const { 
    name, realmName, hp, maxHp, qi, maxQi, spiritStones, resetPlayer, 
    isMeditating, stopMeditation, attributes 
  } = usePlayerStore();
  
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'world' | 'admin' | 'cultivation' | 'inventory' | 'stats'>('world');
  // Modal de POI: payload COMPLETO del mundo real (nombre/provincia/lore/distancia vivos)
  const [poiModal, setPoiModal] = useState<PoiModalData | null>(null);
  const navigate = useNavigate();

  // ESCUCHAR EVENTOS DE PHASER
  useEffect(() => {
    const handleOpenModal = (data: PoiModalData) => {
      setPoiModal(data);
      // Phaser ya se pausa desde WorldScene al emitir el evento
    };

    EventBus.on('ui:open-modal', handleOpenModal);

    return () => {
      EventBus.off('ui:open-modal', handleOpenModal);
    };
  }, []);

  const handleTabChange = (tab: 'world' | 'admin' | 'cultivation' | 'inventory' | 'stats') => {
    if (isMeditating && tab !== 'cultivation') stopMeditation();
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    resetPlayer();
    navigate('/');
  };

  return (
    // En AdminPage.tsx
    <div className="min-h-screen h-screen overflow-hidden bg-[#05070c] text-stone-200 flex flex-col font-sans relative">
      
      {/* HUD SUPERIOR */}
      <header className="bg-stone-950 border-b border-stone-800 p-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <h1 className="font-cinzel text-xl font-bold text-amber-400">{name || 'Cultivador'}</h1>
          <span className="text-xs bg-cyan-950/50 border border-cyan-900/50 text-cyan-200 px-2 py-1 rounded">
            {realmName}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Heart className="w-4 h-4 text-rose-500" />
            <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full" style={{ width: `${Math.min(100, Math.max(0, (hp / maxHp) * 100))}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(100, Math.max(0, (qi / maxQi) * 100))}%` }} />
            </div>
          </div>
          <div className="text-amber-300 text-xs font-mono border-l border-stone-800 pl-4 ml-2">
            💎 {spiritStones} Piedras
          </div>
          <button onClick={handleLogout} className="ml-4 p-2 text-stone-500 hover:text-rose-400 cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative overflow-hidden flex">
        
        {/* Phaser se queda montado siempre, pero lo ocultamos si no estamos en el mundo para no perder el estado */}
        <div className={`w-full h-full ${activeTab === 'world' ? 'block' : 'hidden'}`}>
          <PhaserGame />
        </div>

        {activeTab === 'admin' && <ServerDashboardTab />}

        {activeTab === 'cultivation' && <MeditationPanel />}

        {activeTab === 'inventory' && <InventoryTab />}

        {activeTab === 'stats' && (
          <div className="w-full h-full p-8 flex items-center justify-center">
            <div className="bg-stone-900/80 border border-amber-900/30 rounded-xl p-8 max-w-4xl w-full">
              <h2 className="font-cinzel text-2xl text-amber-100 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" /> Atributos del Alma y Cuerpo (GDD V3)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="bg-stone-950 border border-stone-800 p-4 rounded-lg text-center">
                    <div className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">{key}</div>
                    <div className="text-2xl font-bold text-amber-400 font-mono">{Number(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DEL MUNDO: datos reales del registry (geoChina + provincias) */}
      {poiModal && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-stone-900 border border-amber-500 p-8 rounded-xl max-w-md w-full text-center relative">
            <button onClick={() => { setPoiModal(null); EventBus.emit('game:resume'); }} className="absolute top-4 right-4 text-stone-400 hover:text-white"><X className="w-5 h-5"/></button>
            <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-1">
              {poiModal.poi.kind === 'capital' ? 'Asentamiento' : poiModal.poi.kind === 'sect' ? 'Secta Marcial' : 'Hito del Jianghu'}
            </div>
            <h2 className="font-cinzel text-2xl text-amber-100 mb-2">{poiModal.poi.name}</h2>
            <p className="text-xs text-stone-500 mb-4">
              Provincia de {poiModal.poi.provinceName} · Bioma: {getBiomeCached(poiModal.poi.pos.x, poiModal.poi.pos.y)} ·
              {' '}{poiModal.distanceTiles} tiles desde tu posición
            </p>
            {poiModal.poi.loreNote && (
              <p className="text-sm text-stone-400 italic mb-6">{poiModal.poi.loreNote}</p>
            )}
            <button onClick={() => { setPoiModal(null); EventBus.emit('game:resume'); }} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded">Volver al Mundo</button>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      <nav className="bg-stone-950 border-t border-stone-800 p-2 flex justify-center gap-4 z-20">
        <button onClick={() => handleTabChange('world')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'world' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <MapIcon className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Mundo</span>
        </button>
        <button onClick={() => handleTabChange('admin')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'admin' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <Server className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Admin</span>
        </button>
        <button onClick={() => handleTabChange('cultivation')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'cultivation' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <Flame className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Cultivo</span>
        </button>
        <button onClick={() => handleTabChange('stats')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'stats' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <Sword className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button onClick={() => handleTabChange('inventory')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'inventory' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <Backpack className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Alforja</span>
        </button>
      </nav>
    </div>
  );
};
// ── Panel de Administración: métricas GLOBALES desde /api/admin/* ───────────
// Separación estricta: NUNCA lee /api/player/me (eso hidrata el HUD del juego).
// Aquí todo proviene de consultas agregadas de SQLite (todos los jugadores,
// POIs sincronizados desde el World Layout Registry y eventos de sesión reales).
const KIND_LABEL: Record<string, string> = { capital: 'Asentamiento', sect: 'Secta', landmark: 'Hito' };

function ServerDashboardTab() {
  const [metrics, setMetrics] = useState<AdminDashboardData | null>(null);
  const [world, setWorld] = useState<AdminWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      Promise.all([adminService.getDashboard(), adminService.getWorldState()])
        .then(([d, w]) => { if (alive) { setMetrics(d.data); setWorld(w.data); } })
        .catch((e) => { if (alive) setError(String(e)); });
    };
    load();
    const id = setInterval(load, 15_000); // refresco tipo "radar" sin saturar
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (error) return <div className="w-full h-full p-8 text-rose-400 text-sm">Sin conexión con el servidor: {error}</div>;
  if (!metrics || !world) return <div className="w-full h-full p-8 text-stone-500 text-sm">Consultando el reino…</div>;

  const cards = [
    { label: 'Jugadores en Línea', value: metrics.onlinePlayers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-950/30' },
    { label: 'Personajes Totales', value: metrics.totalPlayers, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-950/30' },
    { label: 'Cuentas Registradas', value: metrics.totalAccounts, icon: Server, color: 'text-violet-400', bg: 'bg-violet-950/30' },
    { label: 'Chunks Activos', value: `${metrics.activeChunks}/${metrics.totalChunks}`, icon: Globe2, color: 'text-amber-400', bg: 'bg-amber-950/30' },
  ];

  return (
    <div className="w-full h-full p-8 overflow-auto space-y-6">
      {/* Tarjetas de métricas (reales, no mock) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {cards.map((c) => (
          <div key={c.label} className="bg-stone-900/70 border border-stone-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Habitantes del reino: TODOS los personajes de la BD */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5">
          <h3 className="font-cinzel text-lg text-amber-100 mb-3">Habitantes del Reino ({world.players.length})</h3>
          {world.players.length === 0 ? (
            <p className="text-xs text-stone-500">Aún no hay personajes en la base.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-auto">
              {world.players.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs bg-stone-950 border border-stone-800 rounded px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.online ? 'bg-emerald-400' : 'bg-stone-600'}`} />
                    <span className="text-stone-200 font-semibold">{p.name}</span>
                    <span className="text-stone-500">{p.realm}</span>
                  </span>
                  <span className="font-mono text-stone-500">
                    {p.pos ? `(${p.pos.x}, ${p.pos.y})` : 'sin posición'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Puntos de interés sincronizados desde el juego + feed de eventos */}
        <div className="space-y-6">
          <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5">
            <h3 className="font-cinzel text-lg text-amber-100 mb-3">
              Cartografía del Reino · {metrics.pois.capitals} asentamientos · {metrics.pois.sects} sectas · {metrics.pois.landmarks} hitos
            </h3>
            {world.pois.length === 0 ? (
              <p className="text-xs text-stone-500">El juego aún no ha sincronizado el registry (se sube al cargar el mundo).</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                {world.pois.slice(0, 30).map((poi) => (
                  <li key={poi.id} className="text-[11px] bg-stone-950 border border-stone-800 rounded px-2 py-1.5 flex justify-between">
                    <span className="text-stone-300 truncate">{poi.name}</span>
                    <span className="text-cyan-500 ml-2 shrink-0">{KIND_LABEL[poi.kind] ?? poi.kind}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5">
            <h3 className="font-cinzel text-lg text-amber-100 mb-3">Últimos Eventos Reales</h3>
            {metrics.recentEvents.length === 0 ? (
              <p className="text-xs text-stone-500">Sin eventos registrados todavía (llegadas a POIs, meditaciones…).</p>
            ) : (
              <ul className="space-y-1">
                {metrics.recentEvents.map((e, i) => (
                  <li key={i} className="flex justify-between text-xs text-stone-400">
                    <span>{e.event}</span><span className="font-mono text-stone-500">×{e.n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alforja Espiritual: inventario REAL desde SQLite (/api/player/inventory) ──
const CATEGORY_LABEL: Record<string, string> = {
  consumible: 'Consumible', elixir: 'Elixir', llave: 'Llave', arma: 'Arma', misc: 'Varios',
};

function InventoryTab() {
  const [items, setItems] = useState<InventoryItemRow[] | null>(null);
  const [capacity, setCapacity] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    playerService.getInventory()
      .then((res) => { if (alive) { setItems(res.items); setCapacity(res.capacity); } })
      .catch((e) => { if (alive) setError(String(e)); });
    return () => { alive = false; };
  }, []);

  if (error) return <div className="w-full h-full p-8 text-rose-400 text-sm">No se pudo leer el inventario: {error}</div>;
  if (!items) return <div className="w-full h-full p-8 text-stone-500 text-sm">Abriendo la alforja…</div>;

  return (
    <div className="w-full h-full p-8 overflow-auto flex items-start justify-center">
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-8 max-w-3xl w-full">
        <div className="flex items-center gap-3 mb-6">
          <Backpack className="w-8 h-8 text-amber-500" />
          <div>
            <h2 className="font-cinzel text-2xl text-stone-200">Alforja Espiritual</h2>
            <p className="text-xs text-stone-500">{items.length} / {capacity} ranuras (datos de la base del personaje)</p>
          </div>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">Tu alforja está vacía. Comercia en los asentamientos del reino.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((it) => (
              <div key={it.id} className="bg-stone-950 border border-stone-800 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-amber-100">{it.name}</span>
                  <span className="text-xs font-mono text-stone-400">x{it.quantity}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-cyan-500 mt-1">{CATEGORY_LABEL[it.category] ?? it.category}</div>
                {it.description && <p className="text-xs text-stone-500 mt-2 italic">{it.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
