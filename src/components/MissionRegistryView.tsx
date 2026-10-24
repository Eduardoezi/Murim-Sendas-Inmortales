import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { WORLD_FACTIONS, MAP_REGIONS } from '../data/worldData';
import { Clock, MapPin, CheckCircle, AlertTriangle, Shield, Coins } from 'lucide-react';

export const MissionRegistryView: React.FC = () => {
  const { cultivator, claimMission } = useGame();
  const [now, setNow] = useState(Date.now());
 
  // Forzar re-renderizado cada segundo para actualizar los contadores
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!cultivator) return null;

  const activeMissions = cultivator.activeMissions || [];

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Completada';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6">
        <h2 className="font-cinzel text-2xl font-bold text-amber-100 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-400" /> Registro de Misiones Activas
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
          El tiempo en el Jianghu es valioso. Revisa tus encargos pendientes. No puedes cobrar la recompensa hasta que el tiempo de ejecución haya terminado.
        </p>
      </div>

      {activeMissions.length === 0 ? (
        <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-12 text-center">
          <p className="text-stone-400 text-sm">No tienes misiones activas.</p>
          <p className="text-stone-500 text-xs mt-2">Ve al Directorio de Facciones para aceptar nuevos encargos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMissions.map(mission => {
            const faction = WORLD_FACTIONS.find(f => f.id === mission.factionId);
            const region = MAP_REGIONS.find(r => r.id === mission.targetRegionId);
            const endTime = mission.startedAt + (mission.durationMinutes * 60 * 1000);
            const timeLeft = endTime - now;
            const isCompleted = timeLeft <= 0;

            return (
              <div key={mission.id} className={`bg-stone-900/60 border rounded-xl p-5 flex flex-col justify-between ${isCompleted ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-stone-800'}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{faction?.name}</span>
                      <h3 className="font-cinzel text-lg font-bold text-stone-100">{mission.title}</h3>
                    </div>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                    )}
                  </div>
                  
                  <p className="text-xs text-stone-400 mb-4 line-clamp-2">{mission.description}</p>

                  <div className="bg-stone-950/50 p-3 rounded-lg border border-stone-800/50 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-400" /> Objetivo:</span>
                      <strong>{region?.name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-400" /> Recompensa:</span>
                      <span>{mission.rewardStones} 💎 | +{mission.rewardReputation} Rep</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-300 border-t border-stone-800/80 pt-2">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" /> Tiempo:</span>
                      <span className={`font-mono font-bold ${isCompleted ? 'text-emerald-400' : 'text-cyan-300'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => claimMission(mission.id)}
                  disabled={!isCompleted}
                  className={`w-full py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border flex items-center justify-center gap-2 ${
                    isCompleted 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 border-emerald-400' 
                      : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <><CheckCircle className="w-4 h-4" /> Reclamar Recompensa</> : 'En Progreso...'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};