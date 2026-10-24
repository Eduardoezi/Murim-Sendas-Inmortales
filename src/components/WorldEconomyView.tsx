import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS } from '../data/worldData';
import { Coins, TrendingUp, TrendingDown, MapPin, Scale, ArrowRightLeft, Gem } from 'lucide-react';

export const WorldEconomyView: React.FC = () => {
  const { cultivator } = useGame();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(MAP_REGIONS[0].id);

  if (!cultivator) return null;

  const selectedRegion = MAP_REGIONS.find(r => r.id === selectedRegionId) || MAP_REGIONS[0];

  // Función auxiliar para determinar el color de la riqueza
  const getWealthColor = (wealth: string) => {
    switch (wealth) {
      case 'Opulento': return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
      case 'Próspero': return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
      case 'Moderado': return 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30';
      default: return 'text-stone-400 bg-stone-900/30 border-stone-700/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" /> Cámara de Comercio y Economía
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
            El flujo de Piedras Espirituales mueve el Jianghu. Analiza los mercados regionales para comprar recursos a bajo precio y venderlos donde haya escasez.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-stone-950 px-4 py-2 rounded-lg border border-stone-800">
          <div className="text-right">
            <span className="text-[10px] text-stone-500 uppercase block">Tu Riqueza Actual</span>
            <span className="font-mono text-emerald-400 font-bold">{cultivator.spiritStones.toLocaleString()} Piedras</span>
          </div>
          <Coins className="w-6 h-6 text-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Provincias y su Riqueza */}
        <div className="lg:col-span-4 bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 bg-stone-950/90 border-b border-stone-800 font-cinzel text-sm font-bold text-amber-200">
            Mercados Regionales
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {MAP_REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => setSelectedRegionId(region.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${
                  selectedRegionId === region.id 
                    ? 'bg-amber-950/30 border-amber-500/50' 
                    : 'bg-stone-950/40 border-stone-800 hover:border-stone-600'
                }`}
              >
                <div>
                  <div className="font-bold text-stone-200 text-sm">{region.name}</div>
                  <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {region.macroRegion}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-semibold border ${getWealthColor(region.economy.wealthLevel)}`}>
                  {region.economy.wealthLevel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detalles del Mercado Seleccionado */}
        <div className="lg:col-span-8 bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="font-cinzel text-2xl font-bold text-amber-100">{selectedRegion.name}</h3>
            <p className="text-xs text-stone-400">{selectedRegion.chineseName} · {selectedRegion.population.toLocaleString()} habitantes</p>
          </div>

          {/* Balanza Comercial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportaciones (Comprar Barato) */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
              <h4 className="font-cinzel text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4" /> Exportaciones (Precios Bajos)
              </h4>
              <p className="text-[11px] text-stone-400 mb-3">Esta región produce en abundancia. Es el mejor lugar para comprar.</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegion.economy.exports.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-stone-950 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-1">
                    <Gem className="w-3 h-3 text-emerald-500" /> {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Importaciones (Vender Caro) */}
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4">
              <h4 className="font-cinzel text-sm font-bold text-rose-400 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" /> Importaciones (Precios Altos)
              </h4>
              <p className="text-[11px] text-stone-400 mb-3">Esta región tiene escasez. Los mercaderes pagan muy bien aquí.</p>
              <div className="flex flex-wrap gap-2">
                {selectedRegion.economy.imports.map((item, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-stone-950 border border-rose-500/20 text-xs text-rose-200 flex items-center gap-1">
                    <Gem className="w-3 h-3 text-rose-500" /> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ruta Comercial Sugerida */}
          <div className="bg-stone-950 border border-stone-800 rounded-xl p-4">
            <h4 className="font-cinzel text-sm font-bold text-amber-200 flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4" /> Oportunidad de Arbitraje
            </h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              Compra <strong className="text-emerald-400">{selectedRegion.economy.exports[0] || 'recursos'}</strong> en <strong>{selectedRegion.name}</strong> y viaja a una región que lo importe (como <strong className="text-rose-400">{MAP_REGIONS.find(r => r.economy.imports.includes(selectedRegion.economy.exports[0]))?.name || 'otra región'}</strong>) para venderlo con un margen de ganancia.
            </p>
          </div>

          {/* Tendencias del Mercado Global (Falso Dinamismo) */}
          <div>
            <h4 className="font-cinzel text-sm font-bold text-stone-200 mb-3 border-b border-stone-800 pb-2">Tendencias Globales</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-stone-950/50 border border-stone-800/50">
                <span className="text-stone-300">Precio del Hierro Frío</span>
                <span className="text-rose-400 flex items-center gap-1 font-mono"><TrendingUp className="w-3 h-3" /> +15%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-stone-950/50 border border-stone-800/50">
                <span className="text-stone-300">Demanda de Píldoras de Qi</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono"><TrendingUp className="w-3 h-3" /> +8%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-stone-950/50 border border-stone-800/50">
                <span className="text-stone-300">Precio de la Seda Imperial</span>
                <span className="text-stone-400 flex items-center gap-1 font-mono"><TrendingDown className="w-3 h-3" /> -2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};