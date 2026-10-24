import React from 'react';
import { useGame } from '../context/GameContext';
import { 
  Volume2, 
  VolumeX, 
  Backpack, 
  ShieldAlert, 
  LogOut, 
  MessageSquare,
  Sparkles,
  Zap,
  Activity,
  Compass,
  Home,
  Flame,
  FlaskConical,
  Landmark,
  ScrollText,
  Scale,
  Swords,
  Skull,
  LucideIcon
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openInventory: () => void;
  openChat: () => void;
  unreadCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  danger?: boolean;
}

interface NavCategory {
  name: string;
  items: NavItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openInventory,
  openChat,
}) => {
  const {
    cultivator,
    toggleAudio,
    isAudioMuted,
    pendingDuelInvite,
    acceptDuel,
    declineDuel,
    resetCharacter,
    isConnected,
  } = useGame();

  // Categorized navigation structure for intuitive vanguard gaming UX
  const navCategories: NavCategory[] = [
    {
      name: 'Cultivo & Sendero',
      items: [
        { id: 'cultivation', label: 'Dantian & Qi', icon: Flame, badge: 'Núcleo' },
        { id: 'martial_arts', label: 'Técnicas Marciales', icon: Zap },
        { id: 'alchemy', label: 'Pabellón de Alquimia', icon: FlaskConical },
        { id: 'abode', label: 'Morada Silenciosa', icon: Home },
      ]
    },
    {
      name: 'Jianghu & Mundo',
      items: [
        { id: 'world_map', label: 'Mapa de Provincias', icon: Compass },
        { id: 'sect', label: 'Secta & Pabellones', icon: Landmark },
        { id: 'merits', label: 'Tablón de Méritos', icon: ScrollText },
      ]
    },
    {
      name: 'Conflicto & Comercio',
      items: [
        { id: 'auction', label: 'Casa de Subastas', icon: Scale },
        { id: 'duels', label: 'Arena de Duelos PvP', icon: Swords },
        { id: 'world_boss', label: 'Jefe Mundial', icon: Skull, danger: true },
      ]
    }
  ];

  // Flattened for quick lookups
  const allItems: NavItem[] = navCategories.flatMap(c => c.items);

  // HP and Qi calculations using exact cultivator fields: hp & qi
  const hpPercent = cultivator ? Math.max(0, Math.min(100, Math.round((cultivator.hp / cultivator.maxHp) * 100))) : 100;
  const qiPercent = cultivator ? Math.max(0, Math.min(100, Math.round((cultivator.qi / cultivator.maxQi) * 100))) : 100;

  return (
    <>
      {/* Pending Duel Banner */}
      {pendingDuelInvite && (
        <div className="bg-gradient-to-r from-red-950/90 via-amber-950/95 to-red-950/90 border-b border-amber-500/50 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-4 animate-qi-glow shadow-lg relative z-50">
          <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
          <span>
            ¡Desafío a Muerte! <strong>{pendingDuelInvite.challengerName}</strong> ({pendingDuelInvite.challengerRealm}) exige medir espadas.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={acceptDuel}
              className="px-3.5 py-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded shadow-md text-xs transition cursor-pointer"
            >
              Aceptar Desafío
            </button>
            <button
              onClick={declineDuel}
              className="px-3 py-1 bg-stone-900/90 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700/60 rounded text-xs transition cursor-pointer"
            >
              Declinar
            </button>
          </div>
        </div>
      )}

      {/* Primary Top HUD Navbar */}
      <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-stone-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-4">
          
          {/* Left Zone: Brand & Connection Status */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setCurrentTab('cultivation')}>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-950/80 via-stone-900 to-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-400 font-cinzel font-black text-base shadow-inner group-hover:border-amber-400 transition-all">
                道
              </div>
              <span
                title={isConnected ? 'Conexión activa con Servidor Murim' : 'Reconectando con el Jianghu...'}
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#090d16] ${
                  isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80' : 'bg-rose-500 animate-ping'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-base sm:text-lg font-bold tracking-wider bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                  Murim
                </span>
                <span className="hidden md:inline-block text-[11px] px-1.5 py-0.5 rounded bg-stone-800/80 text-amber-400/90 border border-amber-500/20 font-cinzel">
                  Sendas Inmortales
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono hidden sm:block">
                Jianghu Persistente en Tiempo Real
              </p>
            </div>
          </div>

          {/* Center Zone: Cultivator Health & Qi Real-time HUD */}
          {cultivator && (
            <div className="hidden lg:flex items-center gap-4 bg-stone-950/60 border border-stone-800/80 rounded-xl px-4 py-1.5 shadow-inner">
              {/* Realm & Subrealm */}
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">Reino Actual</span>
                <span className="text-xs font-bold text-amber-300 font-cinzel flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  {cultivator.realm} <span className="text-stone-400 text-[10px]">Nv.{cultivator.subRealm}</span>
                </span>
              </div>

              <div className="h-7 w-[1px] bg-stone-800" />

              {/* Vitals: HP Bar */}
              <div className="w-28 flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-rose-400 font-medium flex items-center gap-0.5">
                    <Activity className="w-2.5 h-2.5" /> Vitalidad
                  </span>
                  <span className="font-mono text-stone-400 text-[9px]">{hpPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-rose-900/40">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300" 
                    style={{ width: `${hpPercent}%` }} 
                  />
                </div>
              </div>

              {/* Vitals: Qi Bar */}
              <div className="w-28 flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-sky-400 font-medium flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Qi Espiritual
                  </span>
                  <span className="font-mono text-stone-400 text-[9px]">{qiPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-sky-900/40">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 rounded-full transition-all duration-300" 
                    style={{ width: `${qiPercent}%` }} 
                  />
                </div>
              </div>

              <div className="h-7 w-[1px] bg-stone-800" />

              {/* Currencies */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[9px] text-stone-400 uppercase font-sans">Piedras</span>
                  <span className="text-emerald-400 font-bold drop-shadow">
                    💎 {cultivator.spiritStones.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-stone-400 uppercase font-sans">Méritos</span>
                  <span className="text-amber-400 font-bold drop-shadow">
                    📜 {cultivator.sectMerits.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Right Zone: Controls & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={openChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/90 border border-stone-700/60 hover:border-amber-500/50 hover:bg-stone-800 text-stone-300 text-xs font-medium transition cursor-pointer shadow-sm group"
              title="Abrir Jianghu Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Jianghu</span>
            </button>

            <button
              onClick={openInventory}
              className="relative p-2 rounded-lg bg-stone-900/90 border border-stone-700/60 hover:border-amber-500/50 hover:bg-stone-800 text-stone-300 transition cursor-pointer shadow-sm group"
              title="Alforja Espiritual (Inventario)"
            >
              <Backpack className="w-4 h-4 text-amber-300 group-hover:rotate-6 transition-transform" />
              {cultivator && cultivator.inventory.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-600 text-stone-950 font-mono font-bold text-[9px] rounded-full border border-amber-400">
                  {cultivator.inventory.length}
                </span>
              )}
            </button>

            <button
              onClick={toggleAudio}
              className="p-2 rounded-lg bg-stone-900/90 border border-stone-800 hover:border-stone-700 hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
              title={isAudioMuted ? 'Activar Sonido Marcial' : 'Silenciar'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={resetCharacter}
              className="p-2 rounded-lg bg-stone-950 border border-stone-800 hover:border-rose-900/70 hover:bg-rose-950/20 text-stone-500 hover:text-rose-400 transition cursor-pointer"
              title="Cambiar Cultivador / Salir al Menú"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Secondary Category Navigation Bar */}
        <div className="border-t border-stone-800/60 bg-[#070a12]/80 px-2 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1 sm:gap-2">
              {allItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-semibold'
                        : item.danger
                        ? 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-600/40 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
