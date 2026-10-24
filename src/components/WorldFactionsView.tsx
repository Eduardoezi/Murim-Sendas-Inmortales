import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { WORLD_FACTIONS, MAP_REGIONS, WORLD_MISSIONS, FactionMission } from '../data/worldData';
import { 
  Shield, ShieldAlert, MapPin, Search, ChevronRight, 
  Swords, X, Coins, User, CheckCircle, Globe, Map
} from 'lucide-react';

export const WorldFactionsView: React.FC = () => {
  const { cultivator, acceptMission } = useGame();
  
  // Estados de UI
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(null);
  
  // NUEVO: Estado para el filtro geográfico
  const [geoFilter, setGeoFilter] = useState<'all' | 'local'>('all');

  if (!cultivator) return null;

  // Reputación del jugador
  const reputationMap = cultivator.reputation || {};
  
  // NUEVO: Obtener la provincia actual del jugador
  const currentRegionId = cultivator.currentLocationNodeId || 'prov_shaanxi';
  const currentRegionName = MAP_REGIONS.find(r => r.id === currentRegionId)?.name || 'Desconocida';

  // Filtrado (Combina Tipo, Búsqueda y Ubicación)
  const filteredFactions = WORLD_FACTIONS.filter(f => {
    const matchesType = filterType === 'all' || f.type === filterType;
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGeo = geoFilter === 'all' || f.location === currentRegionId;
    return matchesType && matchesSearch && matchesGeo;
  });

  // Datos del modal
  const selectedFaction = WORLD_FACTIONS.find(f => f.id === selectedFactionId);
  const factionMissions = WORLD_MISSIONS.filter(m => m.factionId === selectedFactionId);

  // Colores según el tipo de facción
  const getFactionTypeColor = (type: string) => {
    switch (type) {
      case 'Secta Ortodoxa': return 'text-blue-400 border-blue-500/30 bg-blue-950/20';
      case 'Secta Heterodoxa': return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
      case 'Clan Noble': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'Culto Demoníaco': return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
      case 'Institución Neutral': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'Corte Imperial': return 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20';
      default: return 'text-stone-400 border-stone-500/30 bg-stone-900/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
      case 'Medio': return 'bg-amber-950/40 border-amber-500/30 text-amber-300';
      case 'Difícil': return 'bg-rose-950/40 border-rose-500/30 text-rose-300';
      default: return 'bg-stone-900 text-stone-400';
    }
  };

  const handleAcceptMission = (mission: FactionMission) => {
    acceptMission(mission);
    setSelectedFactionId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* HEADER Y BUSCADOR */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-cinzel text-2xl font-bold text-amber-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" /> Directorio de Poder del Jianghu
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Las grandes facciones que gobiernan el mundo. Conoce a sus líderes, sus especialidades y decide a quién jurarás lealtad para obtener poder y recursos.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input 
            type="text" 
            placeholder="Buscar facción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-800 pb-3">
        
        {/* Filtro Geográfico (Izquierda) */}
        <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800">
          <button
            onClick={() => setGeoFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${geoFilter === 'all' ? 'bg-stone-800 text-amber-300 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Globe className="w-3.5 h-3.5" /> Todo el Continente
          </button>
          <button
            onClick={() => setGeoFilter('local')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${geoFilter === 'local' ? 'bg-stone-800 text-amber-300 shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Map className="w-3.5 h-3.5" /> Mi Provincia ({currentRegionName})
          </button>
        </div>

        {/* Filtros de Tipo (Derecha) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Secta Ortodoxa', 'Clan Noble', 'Culto Demoníaco', 'Institución Neutral', 'Corte Imperial'].map(type => (
            <button
              key={type} 
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                filterType === type 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900 border-transparent'
              }`}
            >
              {type === 'all' ? 'Todas' : type}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE FACCIONES */}
      {filteredFactions.length === 0 ? (
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-12 text-center">
          <p className="text-stone-400 text-sm">No hay facciones registradas con estos filtros en esta zona.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFactions.map(faction => {
            const region = MAP_REGIONS.find(r => r.id === faction.location);
            const typeColor = getFactionTypeColor(faction.type);
            const rep = reputationMap[faction.id] || 0;

            return (
              <div key={faction.id} className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 flex flex-col justify-between hover:border-stone-600 transition-colors group">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-stone-100 group-hover:text-amber-200 transition-colors">
                        {faction.name}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${typeColor}`}>
                        {faction.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500 bg-stone-950 px-2 py-1 rounded border border-stone-800 shrink-0">
                      {faction.powerLevel}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed mb-4 line-clamp-2">
                    {faction.description}
                  </p>

                  <div className="space-y-2 text-[11px] bg-stone-950/50 p-3 rounded-lg border border-stone-800/50 mb-4">
                    <div className="flex items-center gap-2 text-stone-300">
                      <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold w-16">Líder:</span> 
                      <span className="truncate">{faction.leader}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-semibold w-16">Sede:</span> 
                      <span className="truncate">{region?.name || 'Desconocida'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-300">
                      <Swords className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold w-16">Enfoque:</span> 
                      <span className="truncate" title={faction.speciality}>{faction.speciality}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-800/80 pt-2 mt-1">
                      <span className="flex items-center gap-2 text-stone-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> 
                        <span className="font-semibold">Reputación:</span>
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${rep > 0 ? 'text-emerald-400 bg-emerald-950/30' : rep < 0 ? 'text-rose-400 bg-rose-950/30' : 'text-stone-500'}`}>
                        {rep > 0 ? `+${rep}` : rep}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedFactionId(faction.id)}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700"
                >
                  Ver Tablón de Misiones
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE FACCIÓN (MISIONES) */}
      {selectedFaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header Modal */}
            <div className="p-5 border-b border-stone-800 flex items-start justify-between bg-stone-950/50">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mb-2 ${getFactionTypeColor(selectedFaction.type)}`}>
                  {selectedFaction.type}
                </span>
                <h3 className="font-cinzel text-2xl font-bold text-amber-100">{selectedFaction.name}</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-lg">{selectedFaction.description}</p>
              </div>
              <button onClick={() => setSelectedFactionId(null)} className="p-2 bg-stone-900 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo Modal (Misiones) */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h4 className="font-cinzel font-bold text-sm text-amber-200 border-b border-stone-800 pb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Tablón de Misiones Disponibles
              </h4>
              
              {factionMissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-stone-500 italic">Esta facción no tiene misiones públicas para ti en este momento.</p>
                  <p className="text-xs text-stone-600 mt-2">Aumenta tu reputación o sube de reino para desbloquear más encargos.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {factionMissions.map(mission => (
                    <div key={mission.id} className="bg-stone-950 border border-stone-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-stone-700 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-bold text-sm text-stone-100">{mission.title}</h5>
                          <span className={`text-[9px] px-2 py-0.5 rounded border ${getDifficultyColor(mission.difficulty)}`}>
                            {mission.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mb-3">{mission.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-300">
                          <span className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                            <Coins className="w-3.5 h-3.5 text-amber-400" /> 
                            <strong className="text-amber-200">{mission.rewardStones}</strong> Piedras
                          </span>
                          <span className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" /> 
                            <strong className="text-emerald-300">+{mission.rewardReputation}</strong> Rep
                          </span>
                          <span className="flex items-center gap-1 bg-stone-900 px-2 py-1 rounded border border-stone-800">
                            <Swords className="w-3.5 h-3.5 text-rose-400" /> 
                            Requiere Nv. {mission.requiredRealmLevel}+
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleAcceptMission(mission)}
                        disabled={(cultivator.subRealm || 1) < mission.requiredRealmLevel}
                        className={`shrink-0 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          (cultivator.subRealm || 1) >= mission.requiredRealmLevel
                            ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-lg shadow-amber-900/20'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                        }`}
                      >
                        {(cultivator.subRealm || 1) >= mission.requiredRealmLevel ? 'Aceptar Misión' : 'Reino Insuficiente'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};