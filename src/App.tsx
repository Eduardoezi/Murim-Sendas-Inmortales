import React, { useMemo, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TitleScreen } from './components/TitleScreen';
import { Sidebar, SIDEBAR_SECTIONS } from './components/Sidebar';
import { SubNav, type SubTab } from './components/SubNav';
import { CultivationView } from './components/CultivationView';
import { PrivateAbodeView } from './components/PrivateAbodeView';
import { MartialTechniquesView } from './components/MartialTechniquesView';
import { AlchemyPavilionView } from './components/AlchemyPavilionView';
import { SectPavilionView } from './components/SectPavilionView';
import { WorldMapView } from './components/WorldMapView';
import { CityView } from './components/CityView';
import { MeritsBoardView } from './components/MeritsBoardView';
import { AuctionHouseView } from './components/AuctionHouseView';
import { DuelArenaView } from './components/DuelArenaView';
import { WorldBossView } from './components/WorldBossView';
import { InventoryModal } from './components/InventoryModal';
import { GlobalChatDrawer } from './components/GlobalChatDrawer';
import { SectionPlaceholder } from './components/SectionPlaceholder';
import { Wifi, Shield } from 'lucide-react';
import { WorldFactionsView } from './components/WorldFactionsView';
import { WorldEconomyView } from './components/WorldEconomyView';
import { MissionRegistryView } from './components/MissionRegistryView';
import { WorldNewsTicker } from './components/WorldNewsTicker';
import { ChunksVisitedView } from './components/ChunksVisitedView';
import { ProvinceMapView } from './components/ProvinceMapView';
import { DungeonView } from './components/DungeonView';
import { PointOfInterest } from './data/proceduralGenerator';

interface NavState {
  section: string;
  subTab: string;
}

const GameContent: React.FC = () => {
  const { cultivator, isConnected } = useGame();
  const [nav, setNav] = useState<NavState>({ section: 'acciones', subTab: 'cultivo' });
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  // ESTADO CLAVE: Guarda qué mazmorra está activa
  const [activeDungeon, setActiveDungeon] = useState<PointOfInterest | null>(null);

  if (!cultivator) {
    return <TitleScreen />;
  }

  const currentSection = SIDEBAR_SECTIONS.find((s) => s.id === nav.section);
  const currentSectionLabel = currentSection?.label ?? '';
  const currentSubTabs: SubTab[] = useMemo(() => {
    if (!currentSection) return [];
    return currentSection.subTabs.map((t) => t);
  }, [currentSection]);

  const handleSelectSection = (sectionId: string, firstSubTabId?: string) => {
    const section = SIDEBAR_SECTIONS.find((s) => s.id === sectionId);
    const subTab = firstSubTabId ?? section?.subTabs[0]?.id ?? '';
    setNav({ section: sectionId, subTab });
  };

  const handleSelectSubTab = (subTabId: string) => {
    setNav((prev) => ({ ...prev, subTab: subTabId }));
  };

  // ============ RENDERIZADO DEL CONTENIDO ============
  const renderContent = () => {
    const key = `${nav.section}/${nav.subTab}`;

    if (key === 'acciones/cultivo') return <CultivationView onOpenInventory={() => setIsInventoryOpen(true)} />;
    if (key === 'acciones/alquimia') return <AlchemyPavilionView />;
    if (key === 'acciones/morada') return <PrivateAbodeView onOpenInventory={() => setIsInventoryOpen(true)} />;
    if (key === 'acciones/duelos') return <DuelArenaView />;
    if (key === 'acciones/jefe') return <WorldBossView />;
    if (key === 'acciones/misiones') return <MissionRegistryView />;
    if (key === 'acciones/subasta') return <AuctionHouseView onNavigateToMerits={() => setNav({ section: 'perfil', subTab: 'cronica' })} />;

    // ============ SECCIÓN MUNDO ============
    
    if (key === 'mundo/mapa') return <WorldMapView onNavigateToCity={() => setNav({ section: 'mundo', subTab: 'provincia' })} />;
    
    if (key === 'mundo/provincia') {
      return <ProvinceMapView 
        onNavigateToCity={() => setNav({ section: 'mundo', subTab: 'ciudad' })} 
        onNavigateToWorld={() => setNav({ section: 'mundo', subTab: 'mapa' })} 
        onNavigateToDungeon={(poi) => {
          setActiveDungeon(poi);
          setNav({ section: 'mundo', subTab: 'mazmorra' });
        }}
      />;
    }

    // RUTA DE MAZMORRA: Si no hay mazmorra activa, redirige a la provincia
    if (key === 'mundo/mazmorra') {
      if (!activeDungeon) {
        return <ProvinceMapView 
          onNavigateToCity={() => setNav({ section: 'mundo', subTab: 'ciudad' })} 
          onNavigateToWorld={() => setNav({ section: 'mundo', subTab: 'mapa' })} 
          onNavigateToDungeon={(poi) => {
            setActiveDungeon(poi);
            setNav({ section: 'mundo', subTab: 'mazmorra' });
          }}
        />;
      }
      return <DungeonView 
        poi={activeDungeon} 
        onExit={() => {
          setActiveDungeon(null);
          setNav({ section: 'mundo', subTab: 'provincia' });
        }} 
      />;
    }

    if (key === 'mundo/ciudad') return <CityView onNavigateToMap={() => setNav({ section: 'mundo', subTab: 'provincia' })} />;
    if (key === 'mundo/economia') return <WorldEconomyView />;
    if (key === 'mundo/facciones') return <WorldFactionsView />;
    if (key === 'mundo/chunks') return <ChunksVisitedView />;

    // PERFIL
    if (key === 'perfil/habilidades') return <MartialTechniquesView />;
    if (key === 'clan/general') return <SectPavilionView />;
    if (key === 'perfil/cronica' && false) return <MeritsBoardView />;

    return (
      <SectionPlaceholder
        section={currentSectionLabel}
        subTab={nav.subTab}
        subTabs={currentSection?.subTabs ?? []}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-stone-200 flex font-sans selection:bg-amber-500/30 selection:text-amber-200 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[450px] h-[450px] bg-sky-500/3 blur-[140px] rounded-full" />
      </div>

      <Sidebar
        currentSection={nav.section}
        onSelectSection={handleSelectSection}
        openInventory={() => setIsInventoryOpen(true)}
        openChat={() => setIsChatOpen(true)}
      />

      <main className="flex-1 min-w-0 flex flex-col relative z-10">
        <WorldNewsTicker />
        <div className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 pt-14 md:pt-6 max-w-7xl w-full mx-auto">
          <SubNav
            title={currentSectionLabel}
            subTabs={currentSubTabs}
            currentSubTab={nav.subTab}
            onSelect={handleSelectSubTab}
          />
          <div className="transition-all duration-300">{renderContent()}</div>
        </div>

        <footer className="border-t border-stone-800/80 bg-[#070a12]/90 backdrop-blur py-3 px-4 text-xs text-stone-500 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-amber-500/80 font-bold tracking-wider">道 Murim: Sendas Inmortales</span>
              <span className="text-stone-700">|</span>
              <span className="text-stone-400">Jianghu en Tiempo Real</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-rose-500 animate-pulse'}`} />
                {isConnected ? 'Sincronizado vía SQLite + WebSockets' : 'Desconectado'}
              </span>
              <span className="text-stone-700">|</span>
              <span className="text-stone-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-500/70" /> Servidor Autoritativo v2.0
              </span>
            </div>
          </div>
        </footer>
      </main>

      <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
      <GlobalChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}