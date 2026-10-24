import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { MAP_REGIONS, WORLD_FACTIONS, WORLD_BEASTS, WORLD_RESOURCES, MapRegion, WorldBeast } from '../data/worldData';
import { Item } from '../types/game';
import {
  Compass, MapPin, Shield, Sparkles, Swords, AlertTriangle, 
  CheckCircle, Dice5, Grid3X3, Leaf, Gem, Users, TrendingUp, Skull, Store
} from 'lucide-react';

interface WorldMapViewProps {
  onNavigateToCity?: () => void;
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({ onNavigateToCity }) => {
  const { cultivator, travelToNode, exploreNodeEvent, huntBeastEncounter } = useGame();

  const initialRegionId = useMemo(() => {
    if (!cultivator) return 'prov_shaanxi';
    if (cultivator.currentLocationNodeId?.startsWith('prov_')) return cultivator.currentLocationNodeId;
    return 'prov_shaanxi';
  }, [cultivator]);

  const [selectedRegionId, setSelectedRegionId] = useState<string>(initialRegionId);
  const [activeTab, setActiveTab] = useState<'overview' | 'explore' | 'bestiary'>('overview');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const [eventResult, setEventResult] = useState<{ roll: number; eventText: string; rewardText: string; loot?: Item } | null>(null);
  const [huntLog, setHuntLog] = useState<{ victory: boolean; log: string; dropItem?: Item } | null>(null);
  const [selectedBeast, setSelectedBeast] = useState<WorldBeast | null>(null);

  if (!cultivator) return null;

  const currentRegion = MAP_REGIONS.find(r => r.id === initialRegionId) || MAP_REGIONS[0];
  const selectedRegion = MAP_REGIONS.find(r => r.id === selectedRegionId) || currentRegion;
  const isHere = initialRegionId === selectedRegion.id;

  const localFactions = WORLD_FACTIONS.filter(f => f.location === selectedRegion.id);
  const localBeasts = WORLD_BEASTS.filter(b => b.habitat === selectedRegion.id);
  const localResources = WORLD_RESOURCES.filter(r => r.location === selectedRegion.id);

  const handleTravel = (nodeId: string) => {
    const res = travelToNode(nodeId);
    if (res.success) {
      setSelectedRegionId(nodeId);
      setEventResult(null);
      setHuntLog(null);
    } else {
      alert(res.message);
    }
  };

  const handleExplore = () => {
    const res = exploreNodeEvent(selectedRegion.id);
    setEventResult(res);
  };

  const handleHunt = (beastId: string) => {
    const res = huntBeastEncounter(beastId);
    setHuntLog(res);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/80 min-h-[140px] flex items-end p-6">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/80 to-transparent z-10" />
        </div>

        <div className="relative z-20 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-cinzel mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>MAPA POLÍTICO DEL JIANGHU</span>
              <span>·</span>
              <span>江湖武林乾坤圖</span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-amber-100">
              Geografía del Mundo Cultivador
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              Ubicación Actual: <strong className="text-amber-200">{currentRegion.name}</strong> · Densidad de Qi: <span className="text-emerald-400 font-medium">{currentRegion.qiDensity}</span>
            </p>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${showGrid ? 'bg-amber-900/40 border-amber-500/50 text-amber-300' : 'bg-stone-900 border-stone-700 text-stone-400'}`}
          >
            <Grid3X3 className="w-4 h-4" />
            {showGrid ? 'Ocultar Cuadrícula' : 'Mostrar Cuadrícula'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MAPA INTERACTIVO */}
        <div className="lg:col-span-8 bg-stone-900/70 border border-stone-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
          <div className="p-3 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300">
            <span className="font-cinzel font-semibold text-amber-200 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Carta de Seda Dinástica
            </span>
            <span className="text-[11px] text-stone-500">Selecciona una provincia para inspeccionar</span>
          </div>

          <div className="relative w-full aspect-[16/10] bg-stone-950 overflow-hidden select-none">
            <img
              src="/src/assets/images/murim_world_map_1792521242321.jpg"
              alt="Mapa del Mundo"
              className="absolute inset-0 w-full h-full object-cover opacity-80 filter sepia-[0.3] brightness-90"
            />
            
            {showGrid && (
              <div className="absolute inset-0 z-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(245, 158, 11, 0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(245, 158, 11, 0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '6.25% 14.28%',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}
              />
            )}
            
            <div className="absolute inset-0 bg-black/20 pointer-events-none z-10" />

            {MAP_REGIONS.map((region) => {
              const isPlayerHere = initialRegionId === region.id;
              const isSelected = selectedRegionId === region.id;

              return (
                <button
                  key={region.id}
                  onClick={() => {
                    setSelectedRegionId(region.id);
                    setEventResult(null);
                    setHuntLog(null);
                    setSelectedBeast(null);
                  }}
                  style={{ left: `${region.coords.x}%`, top: `${region.coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group z-20 transition-all duration-200 cursor-pointer ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                >
                  {isPlayerHere && (
                    <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/80 animate-ping pointer-events-none" />
                  )}
                  
                  <div
                    className={`px-2 py-1 rounded shadow-xl border flex items-center gap-1.5 backdrop-blur-md transition-colors ${
                      isPlayerHere
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                        : isSelected
                        ? 'bg-amber-600/90 border-amber-300 text-stone-950 font-bold'
                        : 'bg-stone-900/80 border-stone-700 text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isPlayerHere ? 'text-emerald-400' : isSelected ? 'text-stone-950' : 'text-amber-500'}`} />
                    <span className="text-[10px] font-cinzel whitespace-nowrap">{region.name}</span>
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-stone-950/95 border border-stone-700 p-2 rounded shadow-2xl text-[10px] w-48 z-40 pointer-events-none">
                    <span className="font-bold text-amber-300">{region.name} ({region.chineseName})</span>
                    <span className="text-stone-400">Chunks: {region.chunks.join(', ')}</span>
                    <span className="text-emerald-400 mt-1">Qi: {region.qiDensity}</span>
                    <span className="text-rose-400">Amenaza: {region.threatLevel}/10</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL DE INTELIGENCIA DEL MUNDO */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-cinzel uppercase tracking-wider">
                  {selectedRegion.macroRegion} · {selectedRegion.chunks.join(' · ')}
                </span>
                <h3 className="font-cinzel text-xl font-bold text-amber-100">
                  {selectedRegion.name}
                </h3>
                <p className="text-xs text-stone-400 font-cinzel">{selectedRegion.chineseName}</p>
              </div>

              {isHere ? (
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle className="w-3 h-3" /> Aquí
                  </span>
                  
                  <button
                    onClick={onNavigateToCity}
                    className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 shrink-0"
                  >
                    <Store className="w-3.5 h-3.5" /> Entrar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleTravel(selectedRegion.id)}
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" /> Viajar
                </button>
              )}
            </div>

            <p className="text-xs text-stone-300 leading-relaxed italic border-l-2 border-amber-500/50 pl-2">
              "{selectedRegion.description}"
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                  <Users className="w-3 h-3" /> Población
                </span>
                <span className="font-semibold text-amber-200 block mt-0.5">{selectedRegion.population.toLocaleString()}</span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Riqueza
                </span>
                <span className={`font-semibold block mt-0.5 ${
                  selectedRegion.economy.wealthLevel === 'Opulento' ? 'text-amber-400' :
                  selectedRegion.economy.wealthLevel === 'Próspero' ? 'text-emerald-400' :
                  selectedRegion.economy.wealthLevel === 'Moderado' ? 'text-cyan-400' : 'text-stone-400'
                }`}>{selectedRegion.economy.wealthLevel}</span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase flex items-center gap-1">
                  <Skull className="w-3 h-3" /> Peligro
                </span>
                <span className={`font-semibold block mt-0.5 ${
                  selectedRegion.threatLevel > 7 ? 'text-rose-400' :
                  selectedRegion.threatLevel > 4 ? 'text-amber-400' : 'text-emerald-400'
                }`}>{selectedRegion.threatLevel} / 10</span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase">Densidad Qi</span>
                <span className="font-semibold text-emerald-400 block mt-0.5">{selectedRegion.qiDensity}</span>
              </div>
            </div>

            <div className="bg-stone-950/40 p-2.5 rounded border border-stone-800/80 text-[11px]">
              <div className="flex gap-2 mb-1"><span className="text-emerald-400 font-bold w-12">Exporta:</span> <span className="text-stone-300">{selectedRegion.economy.exports.join(', ')}</span></div>
              <div className="flex gap-2"><span className="text-rose-400 font-bold w-12">Importa:</span> <span className="text-stone-300">{selectedRegion.economy.imports.join(', ')}</span></div>
            </div>

            {localFactions.length > 0 && (
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold flex items-center gap-1 mb-1.5">
                  <Shield className="w-3 h-3" /> Facciones en el Poder
                </span>
                <div className="space-y-1.5">
                  {localFactions.map(f => (
                    <div key={f.id} className="bg-stone-950/80 p-2 rounded border border-stone-800 text-xs">
                      <div className="font-bold text-stone-200">{f.name} <span className="text-[9px] text-amber-500 font-normal">({f.powerLevel})</span></div>
                      <div className="text-[10px] text-stone-400">{f.type} · Líder: {f.leader}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {localResources.length > 0 && (
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-semibold flex items-center gap-1 mb-1.5">
                  <Leaf className="w-3 h-3" /> Recursos Naturales
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {localResources.map(res => (
                    <span key={res.id} className="px-2 py-1 rounded bg-stone-950 border border-stone-800 text-[10px] flex items-center gap-1 text-stone-300" title={res.description}>
                      {res.type === 'Mineral' ? <Gem className="w-3 h-3 text-cyan-400"/> : <Leaf className="w-3 h-3 text-emerald-400"/>}
                      {res.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-800 flex gap-2">
              <button onClick={() => setActiveTab('explore')} className={`flex-1 py-2 text-xs font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'explore' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 hover:bg-stone-700 text-stone-200'}`}>
                <Dice5 className="w-3.5 h-3.5" /> Explorar
              </button>
              <button onClick={() => setActiveTab('bestiary')} className={`flex-1 py-2 text-xs font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${activeTab === 'bestiary' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 hover:bg-stone-700 text-stone-200'}`}>
                <Swords className="w-3.5 h-3.5" /> Fauna
              </button>
            </div>
          </div>

          {activeTab === 'explore' && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4 flex-1 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-cinzel text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Dice5 className="w-4 h-4 text-amber-400" /> Exploración del Territorio
                </span>
              </div>
              <button onClick={handleExplore} disabled={!isHere} className={`w-full py-2.5 rounded font-cinzel font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors shadow flex items-center justify-center gap-2 ${isHere ? 'bg-amber-500 hover:bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                {isHere ? 'Lanzar Dados (1d100)' : 'Viaja aquí para explorar'}
              </button>
              {eventResult && (
                <div className="bg-stone-950/90 border border-amber-500/30 rounded-lg p-3 space-y-2">
                  <div className="font-cinzel font-bold text-amber-300 text-xs">Tirada: {eventResult.roll}</div>
                  <p className="text-[11px] text-stone-200 italic">"{eventResult.eventText}"</p>
                  <div className="text-[11px] text-emerald-400 font-medium border-t border-stone-800 pt-1">Botín: {eventResult.rewardText}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bestiary' && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4 flex-1 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-cinzel text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" /> Fauna Local
                </span>
              </div>

              {localBeasts.length === 0 ? (
                <p className="text-xs text-stone-500 text-center py-4">No hay bestias registradas en esta región.</p>
              ) : (
                <div className="space-y-2">
                  {localBeasts.map(beast => (
                    <button
                      key={beast.id}
                      onClick={() => setSelectedBeast(beast)}
                      className={`w-full text-left p-2.5 rounded border transition-colors ${selectedBeast?.id === beast.id ? 'bg-amber-950/40 border-amber-500/60' : 'bg-stone-950/60 border-stone-800 hover:border-stone-600'}`}
                    >
                      <div className="font-bold text-xs text-stone-200">{beast.name}</div>
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                        <span>Rango: {beast.tier}</span>
                        <span className="text-rose-400">Nivel {beast.level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedBeast && (
                <div className="bg-stone-950 border border-stone-800 rounded-lg p-3 space-y-2 mt-3 animate-in fade-in">
                  <div className="font-cinzel font-bold text-amber-300 text-xs">{selectedBeast.name}</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-300">
                    <div>Dao: <span className="text-amber-200">{selectedBeast.daoMark}</span></div>
                    <div>HP: <span className="text-rose-400">{selectedBeast.hp}</span></div>
                    <div>ATK: <span className="text-amber-400">{selectedBeast.attack}</span></div>
                    <div>Drop: <span className="text-emerald-400">{selectedBeast.keyMaterial}</span></div>
                  </div>
                  <button onClick={() => handleHunt(selectedBeast.id)} className="w-full mt-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded transition-colors">
                    Cazar Bestia
                  </button>
                </div>
              )}

              {huntLog && (
                <div className={`p-3 rounded-lg border text-xs mt-2 ${huntLog.victory ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/40 text-rose-200'}`}>
                  <div className="font-bold mb-1 flex items-center gap-1">
                    {huntLog.victory ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {huntLog.victory ? 'Victoria' : 'Derrota'}
                  </div>
                  <p className="text-[10px] leading-relaxed">{huntLog.log}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};