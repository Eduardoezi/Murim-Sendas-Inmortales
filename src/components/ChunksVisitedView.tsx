import React from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS } from '../data/worldData';
import { Map, Eye, EyeOff } from 'lucide-react';

export const ChunksVisitedView: React.FC = () => {
  const { cultivator } = useGame();

  if (!cultivator) return null;

  // Simulamos los chunks visitados (en el futuro vendrán de la DB)
  const visitedChunks = cultivator.stats?.nodesDiscovered ? ['D9', 'D10', 'E9'] : ['D9'];
  const currentRegionId = cultivator.currentLocationNodeId || 'prov_shaanxi';
  const currentRegion = MAP_REGIONS.find(r => r.id === currentRegionId);

  // Generar matriz de 7 filas x 16 columnas (A1 a G16)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const cols = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6">
        <h2 className="font-cinzel text-2xl font-bold text-amber-100 flex items-center gap-2">
          <Map className="w-6 h-6 text-amber-400" /> Registro de Exploración (Niebla de Guerra)
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-2xl">
          Cada casilla representa un sector del continente. Ilumina el mapa viajando y descubriendo los secretos del Jianghu.
        </p>
      </div>

      <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Cabecera de columnas */}
          <div className="grid grid-cols-17 gap-1 mb-1">
            <div className="w-8"></div>
            {cols.map(c => (
              <div key={c} className="text-center text-[10px] text-stone-500 font-mono">{c}</div>
            ))}
          </div>

          {/* Filas */}
          {rows.map(row => (
            <div key={row} className="grid grid-cols-17 gap-1 mb-1">
              <div className="w-8 flex items-center justify-center text-[10px] text-stone-500 font-mono">{row}</div>
              {cols.map(col => {
                const chunkId = `${row}${col}`;
                const isVisited = visitedChunks.includes(chunkId);
                // Comprobar si este chunk pertenece a la región actual
                const isCurrentRegion = currentRegion?.chunks.includes(chunkId);

                return (
                  <div
                    key={chunkId}
                    title={chunkId}
                    className={`aspect-square rounded-sm border flex items-center justify-center transition-all duration-300 ${
                      isVisited 
                        ? isCurrentRegion 
                          ? 'bg-amber-600/40 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                          : 'bg-emerald-900/40 border-emerald-600'
                        : 'bg-stone-950 border-stone-800'
                    }`}
                  >
                    {isVisited ? (
                      isCurrentRegion ? <Eye className="w-3 h-3 text-amber-300" /> : <Eye className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-stone-700" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-amber-600/40 border border-amber-500" />
            <span className="text-stone-300">Provincia Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-emerald-900/40 border border-emerald-600" />
            <span className="text-stone-300">Visitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-stone-950 border border-stone-800" />
            <span className="text-stone-300">Inexplorado</span>
          </div>
        </div>
      </div>
    </div>
  );
};