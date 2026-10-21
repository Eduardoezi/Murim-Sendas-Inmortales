import React from 'react';
import { useGame } from '../context/GameContext';
import { Item } from '../types/game';
import { X, Shield, Swords, Sparkles, Backpack } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose }) => {
  const { cultivator, equipGear, consumePill } = useGame();

  if (!isOpen || !cultivator) return null;

  const equipped = cultivator.equippedGear;

  const rarityColors: Record<Item['rarity'], string> = {
    Común: 'text-stone-300 border-stone-700',
    Mortal: 'text-stone-400 border-stone-600/50',
    Raro: 'text-sky-400 border-sky-600/50',
    Tierra: 'text-emerald-400 border-emerald-600/50',
    Alma: 'text-purple-400 border-purple-600/50',
    Celestial: 'text-rose-400 border-rose-500/50',
    Primordial: 'text-amber-400 border-amber-500/50',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Backpack className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-lg font-bold text-amber-100">
              Alforja Espiritual & Equipamiento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equipped Gear Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
            <div className="text-[10px] text-stone-500 uppercase mb-1 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Arma Principal</span>
            </div>
            {equipped.weapon ? (
              <div>
                <div className="font-semibold text-xs text-stone-200">{equipped.weapon.name}</div>
                <div className="text-[10px] text-amber-400">
                  +{equipped.weapon.statBonus?.attack || 0} Ataque
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-600 italic">Ranura Vacía</div>
            )}
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
            <div className="text-[10px] text-stone-500 uppercase mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Túnica / Armadura</span>
            </div>
            {equipped.armor ? (
              <div>
                <div className="font-semibold text-xs text-stone-200">{equipped.armor.name}</div>
                <div className="text-[10px] text-cyan-400">
                  +{equipped.armor.statBonus?.defense || 0} Defensa
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-600 italic">Ranura Vacía</div>
            )}
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg">
            <div className="text-[10px] text-stone-500 uppercase mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Artefacto Taoísta</span>
            </div>
            {equipped.artifact ? (
              <div>
                <div className="font-semibold text-xs text-stone-200">{equipped.artifact.name}</div>
                <div className="text-[10px] text-purple-400">
                  +{equipped.artifact.statBonus?.spirit || 0} Espíritu
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-600 italic">Ranura Vacía</div>
            )}
          </div>
        </div>

        {/* Inventory Items List */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-stone-300 uppercase tracking-wider">
              Objetos Almacenados ({cultivator.inventory.length})
            </span>
            <span className="font-mono text-emerald-400">
              {cultivator.spiritStones} Piedras Espirituales
            </span>
          </div>

          {cultivator.inventory.length === 0 ? (
            <p className="text-xs text-stone-500 text-center py-6">Tu alforja está vacía.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cultivator.inventory.map((item) => {
                const isGear = item.category === 'weapon' || item.category === 'armor' || item.category === 'artifact';
                const isPill = item.category === 'pill';

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex flex-col justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-stone-200">{item.name}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            rarityColors[item.rarity] || 'text-stone-400'
                          }`}
                        >
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mb-2">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
                      <span className="text-[10px] text-stone-500">Valor: {item.value} Piedras</span>

                      {isGear && (
                        <button
                          onClick={() => equipGear(item)}
                          className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-500 text-stone-950 font-semibold rounded text-[10px] cursor-pointer"
                        >
                          Equipar
                        </button>
                      )}

                      {isPill && (
                        <button
                          onClick={() => consumePill(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-semibold rounded text-[10px] cursor-pointer"
                        >
                          Ingerir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
