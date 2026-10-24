import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS } from '../data/worldData';
import { generateCityBuildings, Building, DistrictType } from '../data/localityGenerator';
import { MarketplaceView } from './MarketplaceView'; // <--- IMPORTACIÓN
import { ArrowLeft, Store, Hammer, Coffee, Heart, MapPin, Building2, Shield, Utensils, BedDouble } from 'lucide-react';

interface CityViewProps {
  onNavigateToMap?: () => void;
}

export const CityView: React.FC<CityViewProps> = ({ onNavigateToMap }) => {
  const { cultivator } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  if (!cultivator) return null;

  const currentRegion = MAP_REGIONS.find(r => r.id === cultivator.currentLocationNodeId) || MAP_REGIONS[0];
  const buildings = generateCityBuildings(currentRegion.id);

  const districts = buildings.reduce((acc, building) => {
    if (!acc[building.district]) acc[building.district] = [];
    acc[building.district].push(building);
    return acc;
  }, {} as Record<DistrictType, Building[]>);

  const getBuildingIcon = (type: string) => {
    switch (type) {
      case 'Mercado': return <Store className="w-5 h-5 text-amber-400" />;
      case 'Forja': return <Hammer className="w-5 h-5 text-rose-400" />;
      case 'Taberna': return <Coffee className="w-5 h-5 text-emerald-400" />;
      case 'Burdel': return <Heart className="w-5 h-5 text-pink-400" />;
      case 'Restaurante': return <Utensils className="w-5 h-5 text-orange-400" />;
      case 'Posada': return <BedDouble className="w-5 h-5 text-cyan-400" />;
      case 'Sede de Facción': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'Tienda': return <Store className="w-5 h-5 text-purple-400" />;
      default: return <Building2 className="w-5 h-5 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Header de la Ciudad */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="text-xs text-amber-400 font-cinzel mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Provincia de {currentRegion.name} · {currentRegion.economy.wealthLevel}</span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-amber-100">Calles de la Ciudad</h2>
          </div>
          <button
            onClick={onNavigateToMap}
            className="px-4 py-2 bg-stone-950 border border-stone-700 hover:border-amber-500 text-stone-300 hover:text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Mapa
          </button>
        </div>
      </div>

      {!selectedBuilding ? (
        <div className="space-y-8">
          {(Object.entries(districts) as [DistrictType, Building[]][]).map(([districtName, districtBuildings]) => (
            <div key={districtName}>
              <h3 className="font-cinzel text-lg font-bold text-stone-200 border-b border-stone-800 pb-2 mb-4">
                {districtName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {districtBuildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBuilding(b)}
                    className="bg-stone-900/60 border border-stone-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all hover:scale-105 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
                      {getBuildingIcon(b.type)}
                    </div>
                    <div>
                      <h4 className="font-cinzel font-bold text-sm text-stone-100 group-hover:text-amber-200">{b.name}</h4>
                      <span className="text-[9px] text-stone-500 uppercase">{b.type} · Nivel {b.tier}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : selectedBuilding.type === 'Mercado' ? (
        // SI EL EDIFICIO ES EL MERCADO, MOSTRAMOS LA TIENDA
        <div className="flex justify-center mt-6">
          <MarketplaceView onClose={() => setSelectedBuilding(null)} />
        </div>
      ) : (
        // PARA OTROS EDIFICIOS, MANTENEMOS EL MODAL (O LO DEJAMOS EN CONSTRUCCIÓN)
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 border-b border-stone-800 pb-4 mb-4">
            <button onClick={() => setSelectedBuilding(null)} className="p-2 bg-stone-950 rounded-lg hover:text-amber-300 transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-cinzel text-xl font-bold text-amber-100">{selectedBuilding.name}</h3>
              <span className="text-xs text-stone-400">{selectedBuilding.type} · {selectedBuilding.district}</span>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-stone-400 text-sm italic">{selectedBuilding.description}</p>
            <p className="text-stone-500 text-xs mt-4">Este edificio se implementará en la siguiente fase.</p>
          </div>
        </div>
      )}
    </div>
  );
};