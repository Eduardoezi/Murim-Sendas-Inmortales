import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TitleScreen } from './components/TitleScreen';
import { Navbar } from './components/Navbar';
import { CultivationView } from './components/CultivationView';
import { PrivateAbodeView } from './components/PrivateAbodeView';
import { MartialTechniquesView } from './components/MartialTechniquesView';
import { AlchemyPavilionView } from './components/AlchemyPavilionView';
import { SectPavilionView } from './components/SectPavilionView';
import { WorldMapView } from './components/WorldMapView';
import { MeritsBoardView } from './components/MeritsBoardView';
import { AuctionHouseView } from './components/AuctionHouseView';
import { DuelArenaView } from './components/DuelArenaView';
import { WorldBossView } from './components/WorldBossView';
import { InventoryModal } from './components/InventoryModal';
import { GlobalChatDrawer } from './components/GlobalChatDrawer';

const GameContent: React.FC = () => {
  const { cultivator } = useGame();
  const [currentTab, setCurrentTab] = useState<string>('cultivation');
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  if (!cultivator) {
    return <TitleScreen />;
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-stone-200 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openInventory={() => setIsInventoryOpen(true)}
        openChat={() => setIsChatOpen(true)}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {currentTab === 'cultivation' && (
          <CultivationView onOpenInventory={() => setIsInventoryOpen(true)} />
        )}
        {currentTab === 'abode' && (
          <PrivateAbodeView onOpenInventory={() => setIsInventoryOpen(true)} />
        )}
        {currentTab === 'world_map' && <WorldMapView />}
        {currentTab === 'martial_arts' && <MartialTechniquesView />}
        {currentTab === 'alchemy' && <AlchemyPavilionView />}
        {currentTab === 'sect' && <SectPavilionView />}
        {currentTab === 'merits' && (
          <MeritsBoardView onNavigateToAuction={() => setCurrentTab('auction')} />
        )}
        {currentTab === 'auction' && (
          <AuctionHouseView onNavigateToMerits={() => setCurrentTab('merits')} />
        )}
        {currentTab === 'duels' && <DuelArenaView />}
        {currentTab === 'world_boss' && <WorldBossView />}
      </main>

      {/* Global Modals */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
      />

      <GlobalChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Quiet Footer adhering to anti-slop rules */}
      <footer className="border-t border-stone-800/80 py-4 px-6 text-center text-xs text-stone-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-6xl mx-auto">
          <span>Murim: Sendas Inmortales · Jianghu en Tiempo Real</span>
          <span>Sincronizado vía WebSockets en Servidor Autoritativo</span>
        </div>
      </footer>
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
