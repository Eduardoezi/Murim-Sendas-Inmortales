import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS } from '../data/worldData';
import { generateProvincePOIs, PointOfInterest } from '../data/proceduralGenerator';
import { ArrowLeft, Map, MapPin, Skull, Castle, Trees, Shield, Gem } from 'lucide-react';

interface ProvinceMapViewProps {
  onNavigateToCity: () => void;
  onNavigateToWorld: () => void;
  onNavigateToDungeon: (poi: PointOfInterest) => void;
}

export const ProvinceMapView: React.FC<ProvinceMapViewProps> = ({ onNavigateToCity, onNavigateToWorld, onNavigateToDungeon }) => {
  const { cultivator } = useGame();
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  if (!cultivator) return null;

  const currentRegionId = cultivator.currentLocationNodeId || 'prov_shaanxi';
  const region = MAP_REGIONS.find(r => r.id === currentRegionId) || MAP_REGIONS[0];

  // Generamos los POIs (memoizados para que no cambien al re-renderizar)
  const pois = useMemo(() => {
    return generateProvincePOIs(region.id, region.economy.wealthLevel, region.threatLevel);
  }, [region.id, region.economy.wealthLevel, region.threatLevel]);

  const getPOIIcon = (type: string) => {
    switch (type) {
      case 'Ciudad': return <Castle className="w-5 h-5 text-amber-400" />;
      case 'Mazmorra': return <Skull className="w-5 h-5 text-rose-500" />;
      case 'Ruina': return <MapPin className="w-5 h-5 text-stone-400" />;
      case 'Secta': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Recurso': return <Gem className="w-5 h-5 text-emerald-400" />;
      default: return <MapPin className="w-5 h-5 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="text-xs text-amber-400 font-cinzel mb-1 flex items-center gap-2">
            <Map className="w-4 h-4" />
            <span>Mapa Regional · {region.macroRegion}</span>
          </div>
          <h2 className="font-cinzel text-3xl font-bold text-amber-100">{region.name}</h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xl">
            Has entrado a la provincia. Explora los puntos de interés locales para encontrar ciudades, mazmorras y secretos.
          </p>
        </div>
        <button
          onClick={onNavigateToWorld}
          className="px-4 py-2 bg-stone-950 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer relative z-10"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Mundo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa Local (Izquierda) */}
        <div className="lg:col-span-8 bg-stone-900/60 border border-stone-800 rounded-xl p-4 flex flex-col shadow-xl min-h-[500px]">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-4">
            <span className="font-cinzel text-sm font-bold text-amber-200">Mapa de la Provincia</span>
            <span className="text-[10px] text-stone-500">Haz clic en un punto para inspeccionar</span>
          </div>
          
          {/* Lienzo del Mapa Local */}
          <div className="relative flex-1 bg-[#0a0d14] rounded-lg border border-stone-800/50 overflow-hidden">
            {/* Fondo de textura */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #1c2536 0%, transparent 70%)'
            }} />
            
            {/* Pines (POIs) */}
            {pois.map(poi => {
              const isSelected = selectedPOI?.id === poi.id;
              return (
                <button
                  key={poi.id}
                  onClick={() => setSelectedPOI(poi)}
                  style={{ left: `${poi.coords.x}%`, top: `${poi.coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-200 cursor-pointer ${isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-110'}`}
                >
                  <div className={`p-2 rounded-full border shadow-lg backdrop-blur-md ${isSelected ? 'bg-amber-900/80 border-amber-400' : 'bg-stone-900/90 border-stone-600 group-hover:border-amber-400'}`}>
                    {getPOIIcon(poi.type)}
                  </div>
                  <span className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-cinzel whitespace-nowrap bg-black/80 text-stone-200 border border-stone-700/50 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {poi.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Información del POI (Derecha) */}
        <div className="lg:col-span-4 bg-stone-900/80 border border-stone-800 rounded-xl p-5 flex flex-col shadow-xl">
          {selectedPOI ? (
            <div className="space-y-4 animate-in fade-in">
              <div className="border-b border-stone-800 pb-3">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{selectedPOI.type}</span>
                <h3 className="font-cinzel text-xl font-bold text-amber-100">{selectedPOI.name}</h3>
                <p className="text-xs text-stone-400 mt-1">{selectedPOI.description}</p>
              </div>

              <div className="bg-stone-950/50 p-3 rounded-lg border border-stone-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nivel Requerido:</span>
                  <span className="font-bold text-amber-300">Reino {selectedPOI.levelRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tu Nivel:</span>
                  <span className={`font-bold ${(cultivator.subRealm || 1) >= selectedPOI.levelRequired ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Reino {cultivator.subRealm || 1}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedPOI.type === 'Ciudad') {
                    onNavigateToCity();
                  } else {
                    // Cualquier otro punto (Mazmorra, Ruina, Secta) abre la vista de combate
                    onNavigateToDungeon(selectedPOI);
                  }
                }}
                disabled={(cultivator.subRealm || 1) < selectedPOI.levelRequired}
                className={`w-full py-3 text-sm font-bold rounded-lg transition-colors cursor-pointer border flex justify-center items-center gap-2 ${
                  (cultivator.subRealm || 1) >= selectedPOI.levelRequired
                    ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-500'
                    : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                }`}
              >
                {selectedPOI.type === 'Ciudad' ? 'Entrar a la Ciudad' : 'Entrar al Territorio'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-500 space-y-3">
              <MapPin className="w-12 h-12 text-stone-700" />
              <p className="text-sm">Selecciona un punto de interés en el mapa para ver sus detalles y entrar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};