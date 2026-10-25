// src/ui/screens/AdminPage.tsx
import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { MeditationPanel } from '../components/MeditationPanel';
import { PhaserGame } from '../../game/PhaserGame'; // <--- IMPORTANTE
import { EventBus } from '../../game/events/EventBus'; // <--- IMPORTANTE
import { Map, Flame, Backpack, LogOut, Heart, Zap, Shield, Sword, X } from 'lucide-react';

export const AdminPage = () => {
  const { 
    name, realmName, hp, maxHp, qi, maxQi, spiritStones, resetPlayer, 
    isMeditating, stopMeditation, attributes 
  } = usePlayerStore();
  
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'world' | 'cultivation' | 'inventory' | 'stats'>('world');
  const [modalOpen, setModalOpen] = useState<string | null>(null); // Estado para el modal de Phaser
  const navigate = useNavigate();

  // ESCUCHAR EVENTOS DE PHASER
  useEffect(() => {
    const handleOpenModal = (data: { type: string }) => {
      setModalOpen(data.type);
      // Pausar Phaser si es necesario
      EventBus.emit('game:pause');
    };

    EventBus.on('ui:open-modal', handleOpenModal);

    return () => {
      EventBus.off('ui:open-modal', handleOpenModal);
    };
  }, []);

  const handleTabChange = (tab: 'world' | 'cultivation' | 'inventory' | 'stats') => {
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

        {activeTab === 'cultivation' && <MeditationPanel />}

        {activeTab === 'inventory' && (
          <div className="w-full h-full p-8 flex items-center justify-center">
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-8 max-w-2xl w-full text-center">
              <Backpack className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <h2 className="font-cinzel text-2xl text-stone-300">Alforja Espiritual</h2>
              <p className="text-sm text-stone-500 mt-2">Capacidad inicial: 15 ranuras</p>
            </div>
          </div>
        )}

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

      {/* MODAL DE PRUEBA (Aparece cuando Phaser lo pide) */}
      {modalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-stone-900 border border-amber-500 p-8 rounded-xl max-w-md w-full text-center relative">
            <button onClick={() => { setModalOpen(null); EventBus.emit('game:resume'); }} className="absolute top-4 right-4 text-stone-400 hover:text-white"><X className="w-5 h-5"/></button>
            <h2 className="font-cinzel text-2xl text-amber-100 mb-4">¡Ciudad Descubierta!</h2>
            <p className="text-stone-400 mb-6">Has llegado a los suburbios de Chang'an. Aquí podrás comerciar y descansar.</p>
            <button onClick={() => { setModalOpen(null); EventBus.emit('game:resume'); }} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded">Volver al Mundo</button>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN INFERIOR */}
      <nav className="bg-stone-950 border-t border-stone-800 p-2 flex justify-center gap-4 z-20">
        <button onClick={() => handleTabChange('world')} className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'world' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}>
          <Map className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold uppercase">Mundo</span>
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