import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS, WORLD_RESOURCES } from '../data/worldData';
import { Item } from '../types/game';
import { Coins, ShoppingBag, ArrowLeft, Gem, Shield, Swords } from 'lucide-react';

interface MarketplaceViewProps {
  onClose: () => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onClose }) => {
  const { cultivator, buyItem, sellItem } = useGame();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  if (!cultivator) return null;

  const currentRegion = MAP_REGIONS.find(r => r.id === cultivator.currentLocationNodeId) || MAP_REGIONS[0];
  const isRich = currentRegion.economy.wealthLevel === 'Opulento' || currentRegion.economy.wealthLevel === 'Próspero';

  // Generar inventario de la tienda basado en la región
  const storeItems: Item[] = useMemo(() => {
    const items: Item[] = [];
    
    // Añadir recursos de la región
    const localResources = WORLD_RESOURCES.filter(r => r.location === currentRegion.id);
    localResources.forEach(res => {
      items.push({
        id: `market_${res.id}`,
        name: res.name,
        category: 'material',
        rarity: res.rarity,
        description: res.description,
        value: res.rarity === 'Celestial' ? 500 : res.rarity === 'Alma' ? 200 : 80,
      });
    });

    // Añadir ítems genéricos dependiendo de la riqueza
    items.push({
      id: 'market_pill_qi',
      name: 'Píldora de Qi Básica',
      category: 'pill',
      rarity: 'Mortal',
      description: 'Restaura 100 de Qi.',
      cultivationBoost: 100,
      value: 50,
    });

    if (isRich) {
      items.push({
        id: 'market_sword_steel',
        name: 'Espada de Acero Espiritual',
        category: 'weapon',
        rarity: 'Tierra',
        description: 'Una espada bien forjada para discípulos internos.',
        statBonus: { attack: 25 },
        value: 300,
      });
    } else {
      items.push({
        id: 'market_sword_rusty',
        name: 'Espada Oxidada',
        category: 'weapon',
        rarity: 'Común',
        description: 'Apenas corta, pero es mejor que nada.',
        statBonus: { attack: 5 },
        value: 20,
      });
    }

    return items;
  }, [currentRegion.id, isRich]);

  // Lógica de precios
  const getBuyPrice = (item: Item) => {
    // Si es un recurso exportado por la región, es más barato
    if (currentRegion.economy.exports.includes(item.name)) return Math.floor(item.value * 0.7);
    // Si es importado, es más caro
    if (currentRegion.economy.imports.includes(item.name)) return Math.floor(item.value * 1.3);
    return item.value;
  };

  const getSellPrice = (item: Item) => Math.floor(item.value * 0.5); // Se vende al 50% de su valor

  return (
    <div className="bg-stone-900/95 border border-stone-700 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
      
      {/* Header */}
      <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/50">
        <div>
          <h3 className="font-cinzel text-2xl font-bold text-amber-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" /> Mercado de {currentRegion.name}
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Riqueza local: <span className="text-amber-300">{currentRegion.economy.wealthLevel}</span> · 
            Exporta: {currentRegion.economy.exports.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-400 font-bold">{cultivator.spiritStones}</span>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-900 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-800 bg-stone-950/30">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'buy' ? 'text-amber-300 border-amber-500' : 'text-stone-400 border-transparent hover:text-stone-200'}`}
        >
          Comprar Artículos
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'sell' ? 'text-amber-300 border-amber-500' : 'text-stone-400 border-transparent hover:text-stone-200'}`}
        >
          Vender tu Inventario
        </button>
      </div>

      {/* Contenido */}
      <div className="p-6 overflow-y-auto flex-1 space-y-3">
        {activeTab === 'buy' ? (
          storeItems.map(item => {
            const price = getBuyPrice(item);
            const canAfford = cultivator.spiritStones >= price;

            return (
              <div key={item.id} className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-stone-100">{item.name}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-amber-300 border border-stone-700">{item.rarity}</span>
                  </div>
                  <p className="text-xs text-stone-400">{item.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {price} <span className="text-[10px]">Piedras</span>
                  </div>
                  <button
                    onClick={() => buyItem(item, price)}
                    disabled={!canAfford}
                    className={`mt-1 px-4 py-1.5 text-xs font-bold rounded transition-colors ${
                      canAfford ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer' : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          cultivator.inventory.length === 0 ? (
            <p className="text-center text-stone-500 italic py-8">No tienes nada que vender.</p>
          ) : (
            cultivator.inventory.map(item => {
              const price = getSellPrice(item);
              return (
                <div key={item.id} className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-stone-100">{item.name}</h4>
                    <p className="text-xs text-stone-400">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-emerald-400">
                      +{price} <span className="text-[10px]">Piedras</span>
                    </div>
                    <button
                      onClick={() => sellItem(item.id, price)}
                      className="mt-1 px-4 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 cursor-pointer transition-colors"
                    >
                      Vender
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};