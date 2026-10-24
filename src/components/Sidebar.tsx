import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  User,
  Users,
  Landmark,
  Compass,
  CalendarClock,
  Swords,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Volume2,
  VolumeX,
  Backpack,
  MessageSquare,
  LogOut,
  Activity,
  Zap,
  Gem,
  Scroll,
  type LucideIcon,
} from 'lucide-react';

export interface SectionSubTab {
  id: string;
  label: string;
  badge?: string | number;
}

export interface SidebarSection {
  id: string;
  label: string;
  icon: LucideIcon;
  subTabs: SectionSubTab[];
}

interface SidebarProps {
  currentSection: string;
  onSelectSection: (sectionId: string, firstSubTabId?: string) => void;
  openInventory: () => void;
  openChat: () => void;
}

const STORAGE_KEY = 'murim_sidebar_collapsed';

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    subTabs: [
      { id: 'identidad', label: 'Identidad' },
      { id: 'atributos', label: 'Atributos' },
      { id: 'cultivo', label: 'Cultivo' },
      { id: 'alma', label: 'Alma' },
      { id: 'habilidades', label: 'Habilidades' },
      { id: 'equipo', label: 'Equipo' },
      { id: 'biblioteca', label: 'Biblioteca' },
      { id: 'cronica', label: 'Crónica' },
    ],
  },
  {
    id: 'vinculos',
    label: 'Vínculos',
    icon: Users,
    subTabs: [
      { id: 'familia', label: 'Familia / Linaje' },
      { id: 'esposas', label: 'Esposas' },
      { id: 'hijos', label: 'Hijos' },
      { id: 'discipulos', label: 'Discípulos' },
      { id: 'bestias', label: 'Bestias' },
      { id: 'relaciones', label: 'Relaciones' },
      { id: 'favores', label: 'Favores' },
      { id: 'deudas', label: 'Deudas de Sangre' },
    ],
  },
  {
    id: 'clan',
    label: 'Clan',
    icon: Landmark,
    subTabs: [
      { id: 'general', label: 'Vista General' },
      { id: 'ramas', label: 'Ramas' },
      { id: 'ejercito', label: 'Ejército' },
      { id: 'bovedas', label: 'Bóvedas' },
      { id: 'ciudades', label: 'Ciudades y Fortalezas' },
      { id: 'defensas', label: 'Defensas' },
      { id: 'imperio', label: 'Imperio Wei del Norte' },
    ],
  },
 {
    id: 'mundo',
    label: 'Mundo',
    icon: Compass,
    subTabs: [
      { id: 'mapa', label: 'Mapa / Geografía' },
      { id: 'ciudad', label: 'Ciudad Actual' },
      { id: 'facciones', label: 'Facciones' },
      { id: 'economia', label: 'Economía' },
      { id: 'chunks', label: 'Chunks Visitados' },
      // ELIMINA O COMENTA LA LÍNEA DE MAZMORRA SI LA TIENES AQUÍ
    ],
  },
  {
    id: 'eventos',
    label: 'Eventos',
    icon: CalendarClock,
    subTabs: [
      { id: 'proximos', label: 'Próximos Eventos' },
      { id: 'tramas', label: 'Tramas Activas' },
      { id: 'brotando', label: 'Tramas Brotando' },
      { id: 'amenazas', label: 'Amenazas Globales' },
      { id: 'momentos', label: 'Momentos Definitorios' },
    ],
  },
  {
    id: 'acciones',
    label: 'Acciones',
    icon: Swords,
    subTabs: [
      { id: 'cultivo', label: 'Cultivo & Dantian' },
      { id: 'alquimia', label: 'Alquimia' },
      { id: 'subasta', label: 'Subasta' },
      { id: 'duelos', label: 'Duelos' },
      { id: 'jefe', label: 'Jefe Mundial' },
      { id: 'morada', label: 'Morada' },
      { id: 'misiones', label: 'Misiones Activas' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    subTabs: [],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  openInventory,
  openChat,
}) => {
  const {
    cultivator,
    isConnected,
    toggleAudio,
    isAudioMuted,
    resetCharacter,
    worldBoss,
  } = useGame();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  // Badges dinámicos
  const eventosBadge = worldBoss?.activeStatus === 'alive' ? 'Jefe' : undefined;

  const getBadge = (sectionId: string): string | undefined => {
    if (sectionId === 'eventos') return eventosBadge;
    return undefined;
  };

  const handleSectionClick = (section: SidebarSection) => {
    const firstSub = section.subTabs[0]?.id;
    onSelectSection(section.id, firstSub);
    setMobileOpen(false);
  };

  const hpPercent = cultivator
    ? Math.max(0, Math.min(100, Math.round((cultivator.hp / cultivator.maxHp) * 100)))
    : 100;
  const qiPercent = cultivator
    ? Math.max(0, Math.min(100, Math.round((cultivator.qi / cultivator.maxQi) * 100)))
    : 100;

  // ============ CONTENIDO INTERNO REUSABLE ============
  const renderInner = (isCollapsed: boolean, isMobile: boolean) => (
    <>
      {/* Brand */}
      <div
        className={`flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        } px-3 py-3 border-b border-stone-800/80`}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onSelectSection('acciones', 'cultivo')}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-950/80 via-stone-900 to-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-400 font-cinzel font-black text-base shadow-inner">
              道
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#090d16] ${
                isConnected
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80'
                  : 'bg-rose-500 animate-ping'
              }`}
            />
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-cinzel text-sm font-bold tracking-wider bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent">
                Murim
              </div>
              <div className="text-[9px] text-stone-500 font-mono uppercase tracking-wider">
                Sendas Inmortales
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Secciones */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2 py-3">
        <div className="space-y-1">
          {SIDEBAR_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;
            const badge = getBadge(section.id);

            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section)}
                title={isCollapsed ? section.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-stone-500'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{section.label}</span>
                  )}
                </div>
                {!isCollapsed && badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/40 font-mono shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* HUD compacto */}
      {cultivator && (
        <div className="border-t border-stone-800/80 px-2 py-3 space-y-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-1 text-[10px] text-stone-500 uppercase tracking-wider">
              <span>{cultivator.realm}</span>
              <span className="font-mono text-amber-400">Nv.{cultivator.subRealm}</span>
            </div>
          )}

          {/* HP */}
          <div className="px-1">
            {!isCollapsed && (
              <div className="flex justify-between items-center text-[10px] mb-0.5">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5" /> HP
                </span>
                <span className="font-mono text-stone-400 text-[9px]">{hpPercent}%</span>
              </div>
            )}
            <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-rose-900/40">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Qi */}
          <div className="px-1">
            {!isCollapsed && (
              <div className="flex justify-between items-center text-[10px] mb-0.5">
                <span className="text-sky-400 font-medium flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Qi
                </span>
                <span className="font-mono text-stone-400 text-[9px]">{qiPercent}%</span>
              </div>
            )}
            <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-sky-900/40">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${qiPercent}%` }}
              />
            </div>
          </div>

          {/* Monedas */}
          <div
            className={`flex ${
              isCollapsed ? 'flex-col items-center gap-1' : 'items-center justify-between'
            } text-[10px] font-mono px-1 pt-1`}
          >
            <span
              className="flex items-center gap-1 text-emerald-400 font-bold"
              title="Piedras Espirituales"
            >
              <Gem className="w-3 h-3" />
              {isCollapsed ? cultivator.spiritStones : cultivator.spiritStones.toLocaleString()}
            </span>
            <span
              className="flex items-center gap-1 text-amber-400 font-bold"
              title="Méritos de Secta"
            >
              <Scroll className="w-3 h-3" />
              {isCollapsed ? cultivator.sectMerits : cultivator.sectMerits.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div
        className={`border-t border-stone-800/80 p-2 flex ${
          isCollapsed ? 'flex-col items-center gap-1.5' : 'items-center justify-between'
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={openChat}
            title="Chat del Jianghu"
            className="p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openInventory}
            title="Alforja Espiritual"
            className="relative p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Backpack className="w-3.5 h-3.5" />
            {cultivator && cultivator.inventory.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-amber-600 text-stone-950 font-mono font-bold text-[8px] rounded-full border border-amber-400">
                {cultivator.inventory.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'Activar sonido' : 'Silenciar'}
            className="p-1.5 rounded-md bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
          <button
            onClick={() => {
              if (window.confirm('¿Cambiar cultivador? Perderás la sesión actual.')) {
                resetCharacter();
              }
            }}
            title="Cambiar cultivador"
            className="p-1.5 rounded-md bg-stone-950 border border-stone-800 hover:border-rose-900/70 hover:bg-rose-950/20 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  // ============ RENDER DESKTOP ============
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-[#070a12]/95 backdrop-blur-md border-r border-stone-800/80 z-40 transition-[width] duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[280px]'
        }`}
      >
        {renderInner(collapsed, false)}
      </aside>

      {/* Mobile FAB para abrir */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-stone-900/95 border border-stone-700 text-amber-400 hover:text-amber-300 shadow-lg backdrop-blur cursor-pointer"
        title="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-[#070a12] border-r border-stone-800/80 flex flex-col shadow-2xl">
            {renderInner(false, true)}
          </aside>
        </div>
      )}
    </>
  );
};