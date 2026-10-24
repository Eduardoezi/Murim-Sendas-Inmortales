import { useState } from 'react';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Flame, Map, Backpack, LogOut, Heart, Zap } from 'lucide-react';

export const AdminPage = () => {
  const { name, realm, qi, maxQi, spiritStones, resetPlayer } = usePlayerStore();
  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'world' | 'cultivation' | 'inventory'>('world');
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    resetPlayer();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-stone-200 flex flex-col">
      
      {/* HUD SUPERIOR */}
      <header className="bg-stone-950 border-b border-stone-800 p-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <h1 className="font-cinzel text-xl font-bold text-amber-400">{name}</h1>
          <span className="text-xs bg-amber-950/50 border border-amber-900/50 text-amber-200 px-2 py-1 rounded">
            {realm}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Heart className="w-4 h-4 text-rose-500" />
            <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div className="w-24 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${(qi/maxQi)*100}%` }} />
            </div>
          </div>
          <div className="text-amber-300 text-xs font-mono border-l border-stone-800 pl-4 ml-2">
            💎 {spiritStones} Piedras
          </div>
          <button onClick={handleLogout} className="ml-4 p-2 text-stone-500 hover:text-rose-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (Instancia Administrativa o Mundo) */}
      <main className="flex-1 relative overflow-hidden flex">
        
        {/* Instancia del Mundo (Phaser se montará aquí) */}
        {activeTab === 'world' && (
          <div className="w-full h-full flex items-center justify-center bg-stone-900/50">
            <div className="text-center">
              <Map className="w-16 h-16 text-stone-700 mx-auto mb-4" />
              <h2 className="text-2xl font-cinzel text-stone-500 mb-2">Mundo Isométrico (Fase 0)</h2>
              <p className="text-sm text-stone-600">Aquí se renderizará el canvas de Phaser.</p>
              <p className="text-xs text-stone-700 mt-4 max-w-md mx-auto">
                (El jugador caminará por el mapa 20x20. Al tocar un edificio, se pausará el mundo y se abrirán los modales de React).
              </p>
            </div>
          </div>
        )}

        {/* Instancia Administrativa (UI de Cultivo) */}
        {activeTab === 'cultivation' && (
          <div className="w-full h-full p-8 flex items-center justify-center">
            <div className="bg-stone-900/80 border border-amber-900/30 rounded-xl p-8 max-w-2xl w-full">
              <h2 className="font-cinzel text-3xl text-amber-100 mb-6">Dantian & Meditación</h2>
              <p className="text-sm text-stone-400 mb-8">Siéntate en el loto y deja que el Qi del mundo fluya hacia ti.</p>
              
              <button 
                onClick={() => usePlayerStore.getState().setPlayer({ qi: Math.min(maxQi, qi + 20) })}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-stone-950 font-cinzel font-bold text-xl rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
              >
                Meditar (Absorber Qi)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="w-full h-full p-8 flex items-center justify-center">
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-8 max-w-2xl w-full text-center">
              <Backpack className="w-12 h-12 text-stone-600 mx-auto mb-4" />
              <h2 className="font-cinzel text-2xl text-stone-300">Inventario Vacío</h2>
            </div>
          </div>
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR (El Dock) */}
      <nav className="bg-stone-950 border-t border-stone-800 p-2 flex justify-center gap-6 z-20">
        <button 
          onClick={() => setActiveTab('world')} 
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'world' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Map className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Mundo</span>
        </button>
        <button 
          onClick={() => setActiveTab('cultivation')} 
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'cultivation' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Flame className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Cultivo</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')} 
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === 'inventory' ? 'text-amber-400 bg-amber-950/30' : 'text-stone-500 hover:text-stone-300'}`}
        >
          <Backpack className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase">Alforja</span>
        </button>
      </nav>
    </div>
  );
};