import React from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, VolumeX, Backpack, Sparkles, ShieldAlert, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openInventory: () => void;
  openChat: () => void;
  unreadCount?: number;
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

  const navItems = [
    { id: 'cultivation', label: 'Cultivo & Dantian' },
    { id: 'abode', label: 'Morada & Patio' },
    { id: 'world_map', label: 'Mapa del Mundo' },
    { id: 'martial_arts', label: 'Artes Marciales' },
    { id: 'alchemy', label: 'Pabellón de Alquimia' },
    { id: 'sect', label: 'Secta & Pabellones' },
    { id: 'merits', label: 'Tablón de Méritos' },
    { id: 'auction', label: 'Casa de Subastas' },
    { id: 'duels', label: 'Arena de Duelos' },
    { id: 'world_boss', label: 'Jefe Mundial' },
  ];

  return (
    <>
      {/* Pending Duel Banner if challenged */}
      {pendingDuelInvite && (
        <div className="bg-amber-950/80 border-b border-amber-600/40 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-4 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>
            ¡<strong>{pendingDuelInvite.challengerName}</strong> ({pendingDuelInvite.challengerRealm}) te ha desafiado a un duelo en vivo!
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={acceptDuel}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Aceptar Desafío
            </button>
            <button
              onClick={declineDuel}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs cursor-pointer"
            >
              Declinar
            </button>
          </div>
        </div>
      )}

      {/* Top Bar following the strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-[#0a0d14]/90 backdrop-blur border-b border-stone-800/80 px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded bg-amber-900/40 border border-amber-500/50 flex items-center justify-center text-amber-400 font-cinzel font-bold text-sm">
            道
          </div>
          <span className="font-cinzel text-lg font-bold tracking-wide text-amber-100 whitespace-nowrap shrink-0">
            Murim: Sendas Inmortales
          </span>
          <span
            title={isConnected ? 'Conexión activa con SQLite en Tiempo Real' : 'Reconectando con el servidor...'}
            className={`w-2 h-2 rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 animate-ping'
            }`}
          />
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-stone-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                currentTab === item.id
                  ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
                  : 'hover:text-stone-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action & Player Status cluster */}
        <div className="flex items-center gap-4 shrink-0">
          {cultivator && (
            <div className="hidden sm:flex items-center gap-2.5 text-xs text-stone-300">
              <span className="text-amber-400 font-medium">
                {cultivator.realm} · Nv.{cultivator.subRealm}
              </span>
              <span className="text-stone-600">/</span>
              <span className="tabular-nums font-mono text-amber-300">
                {cultivator.sectMerits} Méritos
              </span>
              <span className="text-stone-600">/</span>
              <span className="tabular-nums font-mono text-emerald-400">
                {cultivator.spiritStones} Piedras
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={openChat}
              title="Chat del Jianghu"
              className="px-3 py-1.5 text-xs text-stone-300 bg-stone-900 border border-stone-700/60 rounded hover:border-amber-500/60 hover:text-amber-200 transition-colors cursor-pointer"
            >
              Jianghu Chat
            </button>

            <button
              onClick={openInventory}
              title="Abrir Alforja Espiritual"
              className="p-1.5 text-stone-400 bg-stone-900 border border-stone-800 rounded hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>

            <button
              onClick={toggleAudio}
              title={isAudioMuted ? 'Activar Sonido' : 'Silenciar'}
              className="p-1.5 text-stone-400 bg-stone-900 border border-stone-800 rounded hover:text-amber-300 transition-colors cursor-pointer"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={resetCharacter}
              title="Cambiar Cultivador / Portada"
              className="p-1.5 text-stone-500 bg-stone-950 border border-stone-800 rounded hover:text-amber-400 hover:border-amber-700/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav bar fallback */}
      <div className="lg:hidden flex overflow-x-auto gap-2 px-4 py-2 bg-stone-950/90 border-b border-stone-800 text-xs no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded cursor-pointer ${
              currentTab === item.id ? 'bg-amber-900/40 text-amber-300 font-semibold' : 'text-stone-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
