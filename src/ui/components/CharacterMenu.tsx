// src/ui/components/CharacterMenu.tsx
import { useState } from 'react';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { 
  Sword, Shield, Crown, Shirt, Footprints, Gem, 
  Backpack, User, Star, ScrollText, X 
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const CharacterMenu = ({ onClose }: Props) => {
  const { name, realmName, hp, maxHp, qi, maxQi, attributes, appearance } = usePlayerStore();
  const [rightTab, setRightTab] = useState<'stats' | 'inventory'>('stats');

  const equipmentSlots = [
    { id: 'head', label: 'Cabeza', icon: Crown, item: 'Cinta de Seda' },
    { id: 'chest', label: 'Túnica', icon: Shirt, item: 'Túnica de Discípulo' },
    { id: 'weapon', label: 'Arma', icon: Sword, item: 'Espada de Madera' },
    { id: 'offhand', label: 'Mano Izq.', icon: Shield, item: 'Vacío' },
    { id: 'feet', label: 'Calzado', icon: Footprints, item: 'Botas de Tela' },
    { id: 'accessory', label: 'Amuleto', icon: Gem, item: 'Jade Menor' },
  ];

  const inventorySlots = Array(15).fill(null).map((_, i) => {
    if (i === 0) return { name: 'Píldora de Qi', qty: 3, icon: Star };
    if (i === 1) return { name: 'Hierba Espiritual', qty: 12, icon: ScrollText };
    return null;
  });

  return (
    // Fondo oscuro que cubre el juego (Backdrop)
    <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* Ventana del Menú (Estilo SWTOR) */}
      <div className="bg-stone-900 border border-amber-900/60 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-6xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header del Menú */}
        <div className="bg-stone-950 border-b border-stone-800 p-3 flex justify-between items-center">
          <h2 className="font-cinzel text-xl text-amber-500 font-bold tracking-widest uppercase">Personaje</h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-800 rounded-md text-stone-400 hover:text-rose-400 transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido scrolleable (por si la pantalla es pequeña) */}
        <div className="flex flex-col xl:flex-row gap-6 p-6 overflow-y-auto">
          
          {/* COLUMNA IZQUIERDA: EQUIPAMIENTO */}
          <div className="w-full xl:w-64 flex flex-col gap-2 shrink-0">
            <h3 className="text-xs text-stone-500 uppercase tracking-widest mb-2 border-b border-stone-800 pb-1">Equipamiento</h3>
            {equipmentSlots.map((slot) => (
              <div key={slot.id} className="group bg-stone-950 border border-stone-800 hover:border-amber-500/50 rounded-lg p-2 flex items-center gap-3 cursor-pointer transition-colors">
                <div className="w-10 h-10 bg-stone-900 rounded flex items-center justify-center border border-stone-700 shadow-inner">
                  <slot.icon className="w-5 h-5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-[9px] text-stone-500 uppercase tracking-wider">{slot.label}</p>
                  <p className="text-sm text-stone-300 font-semibold">{slot.item}</p>
                </div>
              </div>
            ))}
          </div>

          {/* COLUMNA CENTRAL: PAPERDOLL */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] border-l border-r border-stone-800 px-4">
            <div className="text-center mb-4">
              <h1 className="font-cinzel text-3xl text-amber-100">{name || 'Cultivador'}</h1>
              <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mt-1">{realmName}</p>
            </div>

            <div className="relative w-48 h-64 bg-gradient-to-b from-stone-800/20 to-transparent rounded-full flex flex-col items-center justify-end pb-4 border-b-2 border-amber-900/30">
               <div className="absolute bottom-2 w-24 h-6 bg-black/60 rounded-[100%] blur-md" />
               <div className="relative flex flex-col items-center z-10 animate-in slide-in-from-bottom-5 fade-in duration-500">
                  <div className="w-14 h-14 rounded-full border-4 border-stone-900 shadow-xl" style={{ backgroundColor: appearance?.skinTone || '#fcd34d' }}>
                    <div className="flex justify-center gap-2 pt-4">
                      <div className="w-2 h-2 rounded-full bg-black" />
                      <div className="w-2 h-2 rounded-full bg-black" />
                    </div>
                  </div>
                  <div className="w-20 h-28 rounded-t-[40%] rounded-b-xl shadow-lg mt-[-8px]" style={{ backgroundColor: appearance?.outfitColor || '#2d4a22' }} />
               </div>
            </div>

            <div className="w-full max-w-sm mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-rose-400 mb-1">
                  <span>HP</span><span>{hp} / {maxHp}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <div className="bg-gradient-to-r from-rose-700 to-rose-500 h-full" style={{ width: `${(hp / maxHp) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-400 mb-1">
                  <span>Qi</span><span>{qi} / {maxQi}</span>
                </div>
                <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                  <div className="bg-gradient-to-r from-cyan-700 to-cyan-400 h-full" style={{ width: `${(qi / maxQi) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: ESTADÍSTICAS / INVENTARIO */}
          <div className="w-full xl:w-80 bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col shrink-0">
            <div className="flex gap-2 mb-4 border-b border-stone-800 pb-2">
              <button onClick={() => setRightTab('stats')} className={`flex-1 py-1 text-xs font-bold rounded ${rightTab === 'stats' ? 'bg-amber-950/50 text-amber-400' : 'text-stone-500'}`}>Atributos</button>
              <button onClick={() => setRightTab('inventory')} className={`flex-1 py-1 text-xs font-bold rounded ${rightTab === 'inventory' ? 'bg-amber-950/50 text-amber-400' : 'text-stone-500'}`}>Alforja</button>
            </div>

            {rightTab === 'stats' && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                {Object.entries(attributes).map(([key, val]) => (
                  <div key={key} className="bg-stone-900 p-2 rounded border border-stone-800 flex flex-col items-center">
                    <span className="text-[9px] text-stone-500 uppercase">{key}</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">{Number(val)}</span>
                  </div>
                ))}
              </div>
            )}

            {rightTab === 'inventory' && (
              <div className="animate-in fade-in flex-1 flex flex-col">
                <div className="grid grid-cols-4 gap-2">
                  {inventorySlots.map((item, index) => (
                    <div key={index} className={`aspect-square rounded border flex items-center justify-center relative ${item ? 'bg-stone-800 border-amber-700' : 'bg-stone-900 border-stone-800'}`}>
                      {item && <item.icon className="w-5 h-5 text-amber-400" />}
                      {item && <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-white bg-black px-1 rounded">{item.qty}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};