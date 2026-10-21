import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Zap, Trophy, Users, Flame, Sparkles } from 'lucide-react';

export const WorldBossView: React.FC = () => {
  const { cultivator, worldBoss, attackWorldBoss } = useGame();
  const [strikeFeedback, setStrikeFeedback] = useState<string | null>(null);

  if (!cultivator) return null;

  const handleStrike = () => {
    attackWorldBoss();
    setStrikeFeedback('¡Has descargado un torrente de Qi sobre el Dragón Abisal!');
    setTimeout(() => setStrikeFeedback(null), 2000);
  };

  const hpPercent = Math.max(0, Math.floor((worldBoss.currentHp / worldBoss.maxHp) * 100));
  const myDamage = worldBoss.participants.find((p) => p.id === cultivator.id)?.damageDealt || 0;

  const minutes = Math.floor(worldBoss.timeRemainingSec / 60);
  const seconds = worldBoss.timeRemainingSec % 60;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Boss Encounter Banner */}
      <div className="relative rounded-xl overflow-hidden border border-rose-900/40 bg-stone-900/80 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-rose-400 font-cinzel mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Evento de Mundo Abierto de Alta Dificultad</span>
            </div>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-rose-100">
              {worldBoss.name}
            </h2>
            <p className="text-xs text-stone-300 mt-1">
              {worldBoss.title} · Afinidad Primordial: <span className="text-cyan-400">{worldBoss.element}</span>
            </p>
          </div>

          <div className="text-right bg-stone-950/70 p-4 rounded-xl border border-stone-800 self-start md:self-auto">
            <div className="text-[10px] text-stone-500 uppercase">Tiempo Restante de la Calamidad</div>
            <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] text-stone-400 mt-1">
              Estado: <span className="text-rose-400 font-semibold uppercase">{worldBoss.activeStatus}</span>
            </div>
          </div>
        </div>

        {/* Boss HP Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-stone-300 font-semibold">Vitalidad del Dragón Abisal</span>
            <span className="font-mono text-rose-400 font-bold tabular-nums">
              {worldBoss.currentHp.toLocaleString()} / {worldBoss.maxHp.toLocaleString()} ({hpPercent}%)
            </span>
          </div>
          <div className="w-full bg-stone-950 h-4 rounded-full overflow-hidden border border-rose-950">
            <div
              className="bg-gradient-to-r from-rose-700 via-rose-500 to-amber-500 h-full transition-all duration-300"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800">
          <div className="text-xs text-stone-400">
            Tu Daño Acumulado:{' '}
            <span className="font-mono text-amber-400 font-bold tabular-nums">
              {myDamage.toLocaleString()} Puntos de Impacto
            </span>
          </div>

          <button
            onClick={handleStrike}
            disabled={worldBoss.activeStatus !== 'alive'}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-rose-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Canalizar Formación de Espada Marcial</span>
          </button>
        </div>

        {strikeFeedback && (
          <div className="mt-3 text-center text-xs text-amber-300 font-mono animate-bounce">
            {strikeFeedback}
          </div>
        )}
      </div>

      {/* Rewards & Live Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rewards Card */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="font-cinzel text-sm font-semibold text-stone-200">
              Botín Celestial Compartido
            </h3>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Todos los participantes que inflijan daño obtendrán piedras espirituales proporcionales y méritos para su secta.
          </p>
          <div className="space-y-2 text-xs pt-2">
            <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex justify-between">
              <span className="text-stone-400">Piedras Espirituales</span>
              <span className="font-mono text-emerald-400 font-bold">+{worldBoss.rewards.spiritStones}</span>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex justify-between">
              <span className="text-stone-400">Méritos de Secta</span>
              <span className="font-mono text-amber-400 font-bold">+{worldBoss.rewards.sectMerits}</span>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex justify-between">
              <span className="text-stone-400">Artefacto Único</span>
              <span className="text-rose-400 font-semibold">{worldBoss.rewards.rareItemName}</span>
            </div>
          </div>
        </div>

        {/* Live Leaderboard */}
        <div className="md:col-span-2 bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinzel text-sm font-semibold text-stone-200">
                Tabla de Honor del Jianghu (Daño en Tiempo Real)
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-mono">Sincronizado</span>
          </div>

          <div className="space-y-2">
            {worldBoss.participants.map((p, idx) => (
              <div
                key={p.id}
                className="p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-stone-500 font-mono font-bold">#{idx + 1}</span>
                  <div>
                    <div className="font-semibold text-stone-200">
                      {p.name} {p.id === cultivator.id && '(Tú)'}
                    </div>
                    <div className="text-[10px] text-stone-400">{p.sectName}</div>
                  </div>
                </div>

                <div className="font-mono text-amber-300 font-bold tabular-nums">
                  {p.damageDealt.toLocaleString()} Daño
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
