import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { WORLD_MAP_NODES, BESTIAS_COMPENDIO, BeastCompendiumEntry } from '../data/gameData';
import { WorldMapNode, Item } from '../types/game';
import {
  Compass,
  MapPin,
  Shield,
  Zap,
  Sparkles,
  Swords,
  Flame,
  Award,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Eye,
  Dice5,
  X,
} from 'lucide-react';

export const WorldMapView: React.FC = () => {
  const { cultivator, travelToNode, exploreNodeEvent, huntBeastEncounter } = useGame();

  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    cultivator?.currentLocationNodeId || 'node_kunlun_sect'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'explore' | 'bestiary'>('overview');
  const [eventResult, setEventResult] = useState<{
    roll: number;
    eventText: string;
    rewardText: string;
    loot?: Item;
  } | null>(null);
  const [huntLog, setHuntLog] = useState<{
    victory: boolean;
    log: string;
    dropItem?: Item;
  } | null>(null);
  const [selectedBeast, setSelectedBeast] = useState<BeastCompendiumEntry>(BESTIAS_COMPENDIO[0]);

  if (!cultivator) return null;

  const currentNode =
    WORLD_MAP_NODES.find((n) => n.id === cultivator.currentLocationNodeId) || WORLD_MAP_NODES[0];
  const selectedNode =
    WORLD_MAP_NODES.find((n) => n.id === selectedNodeId) || currentNode;

  const isHere = cultivator.currentLocationNodeId === selectedNode.id;

  const handleTravel = (nodeId: string) => {
    travelToNode(nodeId);
    setSelectedNodeId(nodeId);
    setEventResult(null);
    setHuntLog(null);
  };

  const handleExplore = () => {
    const res = exploreNodeEvent(selectedNode.id);
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
          <img
            src="/src/assets/images/murim_world_map_1792521242321.jpg"
            alt="Mapa del Jianghu"
            className="w-full h-full object-cover opacity-35 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-cinzel mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>GEOGRAFÍA DEL JIANGHU & LAS NUEVE PROVINCIAS</span>
              <span>·</span>
              <span>江湖武林乾坤圖</span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-amber-100">
              Mapa del Mundo Cultivador
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              Ubicación Actual:{' '}
              <strong className="text-amber-200">{currentNode.name}</strong> ({currentNode.province}) · Densidad de Qi:{' '}
              <span className="text-emerald-400 font-medium">{currentNode.qiDensity}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-300 bg-stone-950/80 p-3 rounded-lg border border-stone-800">
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Regiones Descubiertas</div>
              <div className="font-mono font-bold text-amber-300 tabular-nums">
                {cultivator.stats?.nodesDiscovered || 1} / {WORLD_MAP_NODES.length}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-stone-800" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Sentido Espiritual</div>
              <div className="font-mono font-bold text-emerald-400 tabular-nums">
                {cultivator.spiritSense || 35} m
              </div>
            </div>
            <div className="w-[1px] h-8 bg-stone-800" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Suerte de Encuentro</div>
              <div className="font-mono font-bold text-cyan-400 tabular-nums">
                +{Math.floor((cultivator.attributes?.suerte || 10) / 2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Regional Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Silk Scroll Interactive Map Visualizer */}
        <div className="lg:col-span-8 bg-stone-900/70 border border-stone-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300">
            <span className="font-cinzel font-semibold text-amber-200 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Carta de Seda Dinástica: Vetas de Qi & Asentamientos
            </span>
            <span className="text-[11px] text-stone-500">Haz clic en un enclave para inspeccionar o viajar</span>
          </div>

          {/* Interactive Map Canvas Container */}
          <div className="relative w-full aspect-[16/9] bg-stone-950 overflow-hidden group select-none">
            <img
              src="/src/assets/images/murim_world_map_1792521242321.jpg"
              alt="Silk Map"
              className="w-full h-full object-cover filter contrast-[1.05] brightness-95"
            />
            {/* Subtle ancient parchment vignette */}
            <div className="absolute inset-0 bg-amber-950/10 pointer-events-none mix-blend-color" />
            <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/20 pointer-events-none" />

            {/* Map Node Pins */}
            {WORLD_MAP_NODES.map((node) => {
              const isPlayerHere = cultivator.currentLocationNodeId === node.id;
              const isSelected = selectedNodeId === node.id;

              return (
                <button
                  key={node.id}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    setEventResult(null);
                    setHuntLog(null);
                  }}
                  style={{
                    left: `${node.coordinates.x}%`,
                    top: `${node.coordinates.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group/pin z-20 cursor-pointer transition-all duration-200 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                  title={`${node.name} (${node.province})`}
                >
                  {/* Outer pulsing ring for current player position */}
                  {isPlayerHere && (
                    <div className="absolute -inset-2 rounded-full border border-emerald-400/80 animate-ping pointer-events-none" />
                  )}

                  <div
                    className={`px-2 py-1 rounded-md text-[10px] font-cinzel font-bold border flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-colors ${
                      isPlayerHere
                        ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                        : isSelected
                        ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                        : 'bg-stone-950/80 border-stone-700 text-stone-300 hover:border-amber-400/80 hover:text-amber-100'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isPlayerHere
                          ? 'bg-emerald-400'
                          : node.threatLevel >= 8
                          ? 'bg-red-400'
                          : node.threatLevel >= 6
                          ? 'bg-amber-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <span className="hidden sm:inline whitespace-nowrap">{node.name.split('&')[0]}</span>
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pin:flex flex-col bg-stone-950/95 border border-stone-700 text-stone-200 p-2 rounded shadow-2xl text-[10px] w-48 z-40 pointer-events-none">
                    <span className="font-bold text-amber-300">{node.name}</span>
                    <span className="text-stone-400">{node.province} · {node.chineseName}</span>
                    <span className="text-emerald-400 mt-1">Qi: {node.qiDensity} · Peligro: {node.threatLevel}/10</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Node Selector Pills */}
          <div className="p-3 bg-stone-950/90 border-t border-stone-800 overflow-x-auto flex items-center gap-2 text-xs scrollbar-thin">
            <span className="text-[11px] text-stone-500 font-cinzel shrink-0">Enclaves:</span>
            {WORLD_MAP_NODES.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  setEventResult(null);
                  setHuntLog(null);
                }}
                className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                  selectedNodeId === node.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
              >
                {node.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Enclave Inspector & Actions Panel */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          {/* Node Profile Card */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-cinzel uppercase tracking-wider">
                  {selectedNode.province}
                </span>
                <h3 className="font-cinzel text-xl font-bold text-amber-100">
                  {selectedNode.name}
                </h3>
                <p className="text-xs text-stone-400 font-cinzel">{selectedNode.chineseName}</p>
              </div>

              {isHere ? (
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Aquí
                </span>
              ) : (
                <button
                  onClick={() => handleTravel(selectedNode.id)}
                  className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold cursor-pointer transition-colors shadow flex items-center gap-1.5 shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Viajar
                </button>
              )}
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase block">Facción Soberana</span>
                <span className="font-semibold text-amber-200 truncate block">
                  {selectedNode.rulerFaction}
                </span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase block">Densidad de Qi</span>
                <span className="font-semibold text-emerald-400 block">
                  {selectedNode.qiDensity}
                </span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase block">Nivel de Peligro</span>
                <span className="font-semibold text-rose-400 block">
                  {selectedNode.threatLevel} / 10
                </span>
              </div>
              <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80">
                <span className="text-[10px] text-stone-500 uppercase block">Reino Sugerido</span>
                <span className="font-semibold text-sky-400 truncate block">
                  {selectedNode.recommendedRealm}
                </span>
              </div>
            </div>

            {/* Resources found in this node */}
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold block mb-1.5">
                Recursos y Venas Disponibles:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.availableResources.map((res, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-stone-950 text-stone-300 border border-stone-800 text-[11px]"
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            {/* Sub-actions for Selected Node */}
            <div className="pt-2 border-t border-stone-800 flex gap-2">
              <button
                onClick={() => setActiveTab('explore')}
                className={`flex-1 py-2 text-xs font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'explore'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                <Dice5 className="w-3.5 h-3.5" />
                Explorar (1d100)
              </button>
              <button
                onClick={() => setActiveTab('bestiary')}
                className={`flex-1 py-2 text-xs font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'bestiary'
                    ? 'bg-amber-600 text-stone-950'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                Cazar Bestias
              </button>
            </div>
          </div>

          {/* Action Result / Interactive Sub-Panels */}
          {activeTab === 'explore' && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-cinzel text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Dice5 className="w-4 h-4 text-amber-400" />
                  Tirada de Encuentros del Jianghu
                </span>
                <span className="text-[10px] text-stone-400">1d100 + Suerte + Fama</span>
              </div>

              <p className="text-xs text-stone-300">
                Adéntrate en los senderos de <strong>{selectedNode.name}</strong>. Tus atributos espirituales
                (Suerte: {cultivator.attributes?.suerte || 10}, Fama: {cultivator.fama || 50}) influirán en los augurios del Dao.
              </p>

              <button
                onClick={handleExplore}
                disabled={!isHere}
                className={`w-full py-2.5 rounded font-cinzel font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors shadow flex items-center justify-center gap-2 ${
                  isHere
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Dice5 className="w-4 h-4" />
                {isHere ? 'Lanzar Dados del Destino (1d100)' : 'Debes Viajar Aquí para Explorar'}
              </button>

              {eventResult && (
                <div className="bg-stone-950/90 border border-amber-500/30 rounded-lg p-3.5 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-cinzel font-bold text-amber-300">
                      Resultado del Dao: {eventResult.roll}
                    </span>
                    <span className="text-[10px] text-stone-400">Tirada Registrada</span>
                  </div>
                  <p className="text-xs text-stone-200 italic leading-relaxed">
                    "{eventResult.eventText}"
                  </p>
                  <div className="pt-2 border-t border-stone-800 text-xs text-emerald-400 font-medium">
                    Recompensa: {eventResult.rewardText}
                  </div>
                  {eventResult.loot && (
                    <div className="bg-stone-900 p-2 rounded border border-stone-800 flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-stone-200">{eventResult.loot.name}</div>
                        <div className="text-[10px] text-stone-400">{eventResult.loot.description}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bestiary' && (
            <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
                <span className="font-cinzel text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-400" />
                  Compendio de Bestias del Vacío Caótico
                </span>
                <span className="text-[10px] text-stone-400">混沌虚空异兽录</span>
              </div>

              {/* Beast Select dropdown / list */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 uppercase">Seleccionar Presa a Rastrear:</label>
                <select
                  value={selectedBeast.id}
                  onChange={(e) => {
                    const b = BESTIAS_COMPENDIO.find((beast) => beast.id === e.target.value);
                    if (b) setSelectedBeast(b);
                    setHuntLog(null);
                  }}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded px-3 py-2 cursor-pointer focus:outline-none focus:border-amber-500"
                >
                  {BESTIAS_COMPENDIO.map((beast) => (
                    <option key={beast.id} value={beast.id}>
                      [{beast.rankCategory}] {beast.name} (Nivel {beast.threatLevel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Beast Card */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-cinzel font-bold text-amber-300">{selectedBeast.name}</h4>
                    <p className="text-[10px] text-stone-400">{selectedBeast.chineseName} · {selectedBeast.habitat}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
                    Amenaza {selectedBeast.threatLevel}/10
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-stone-300">
                  <div>Marca del Dao: <strong className="text-amber-200">{selectedBeast.daoMark}</strong></div>
                  <div>Vitalidad: <strong className="text-rose-400">{selectedBeast.hp} HP</strong></div>
                  <div>Poder Ataque: <strong className="text-amber-400">{selectedBeast.attack}</strong></div>
                  <div>Defensa: <strong className="text-stone-300">{selectedBeast.defense}</strong></div>
                </div>

                <div className="text-[11px] text-stone-400 border-t border-stone-800/80 pt-1.5">
                  <span className="text-amber-400 font-semibold">Habilidad Innata:</span> {selectedBeast.innateSkill}
                </div>
                <div className="text-[11px] text-emerald-400">
                  <span className="font-semibold">Material Clave:</span> {selectedBeast.keyMaterial}
                </div>
              </div>

              <button
                onClick={() => handleHunt(selectedBeast.id)}
                className="w-full py-2.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-cinzel font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors shadow flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                Desafiar a Duelo de Caza
              </button>

              {huntLog && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1.5 animate-in fade-in ${
                    huntLog.victory
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {huntLog.victory ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {huntLog.victory ? '¡Caza Exitosa!' : 'Embestida Brutal'}
                  </div>
                  <p className="text-[11px] leading-relaxed">{huntLog.log}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
