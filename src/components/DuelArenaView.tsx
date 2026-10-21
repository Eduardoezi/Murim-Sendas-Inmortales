import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Swords, Shield, Zap, Sparkles, Trophy, Users, Award } from 'lucide-react';

export const DuelArenaView: React.FC = () => {
  const {
    cultivator,
    onlinePlayers,
    activeDuel,
    challengePlayer,
    performDuelAction,
    closeDuelSummary,
  } = useGame();

  const [simulatedChallengers] = useState([
    {
      id: 'bot_rival_1',
      name: 'Li Chen el Filo Escarlata',
      realm: 'Condensación de Qi Nv.4',
      sectName: 'Clan del Dragón Carmesí',
      classType: 'warrior',
    },
    {
      id: 'bot_rival_2',
      name: 'Doncella de Hielo Ruo',
      realm: 'Condensación de Qi Nv.6',
      sectName: 'Pabellón del Loto de Nieve',
      classType: 'scholar',
    },
    {
      id: 'bot_rival_3',
      name: 'Viento Silente Han',
      realm: 'Fundación Espiritual Nv.1',
      sectName: 'Hermandad de la Sombra',
      classType: 'rogue',
    },
  ]);

  if (!cultivator) return null;

  // Active Tactical Combat View
  if (activeDuel) {
    const isP1 = activeDuel.p1.id === cultivator.id;
    const myFighter = isP1 ? activeDuel.p1 : activeDuel.p2;
    const opponentFighter = isP1 ? activeDuel.p2 : activeDuel.p1;
    const isMyTurn = activeDuel.currentTurn === cultivator.id && activeDuel.status === 'in_progress';
    const isFinished = activeDuel.status === 'finished';
    const didIWin = activeDuel.winnerId === cultivator.id;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Arena Battlefield Header */}
        <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-cinzel mb-1">
            <Swords className="w-4 h-4" />
            <span>Plataforma Marcial del Dragón de Jade · Turno {activeDuel.turnNumber}</span>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-amber-100">
            Duelo de Cultivación en Vivo
          </h2>
          <div className="text-xs text-stone-400 mt-1">
            {isMyTurn ? (
              <span className="text-amber-400 font-semibold animate-pulse">
                ¡Es tu turno de actuar! Canaliza tu técnica marcial.
              </span>
            ) : isFinished ? (
              <span>Duelo concluido</span>
            ) : (
              <span className="text-stone-500">
                El adversario está concentrando su Qi...
              </span>
            )}
          </div>
        </div>

        {/* Combatants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Cultivator */}
          <div className="bg-stone-900/60 border border-amber-600/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-mono">Tú</span>
                <h3 className="font-cinzel font-bold text-base text-stone-100">{myFighter.name}</h3>
                <div className="text-xs text-stone-400">{myFighter.realm}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase">Escudo Qi</span>
                <div className="font-mono text-cyan-400 font-bold">{myFighter.shield}</div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Vitalidad</span>
                <span className="font-mono text-rose-400 tabular-nums">
                  {myFighter.hp} / {myFighter.maxHp}
                </span>
              </div>
              <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (myFighter.hp / myFighter.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Qi Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Energía Qi</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {myFighter.qi} / {myFighter.maxQi}
                </span>
              </div>
              <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (myFighter.qi / myFighter.maxQi) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Opponent Cultivator */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 font-mono">Adversario</span>
                <h3 className="font-cinzel font-bold text-base text-stone-100">{opponentFighter.name}</h3>
                <div className="text-xs text-stone-400">{opponentFighter.realm}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-500 uppercase">Escudo Qi</span>
                <div className="font-mono text-cyan-400 font-bold">{opponentFighter.shield}</div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Vitalidad</span>
                <span className="font-mono text-rose-400 tabular-nums">
                  {opponentFighter.hp} / {opponentFighter.maxHp}
                </span>
              </div>
              <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (opponentFighter.hp / opponentFighter.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Qi Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Energía Qi</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {opponentFighter.qi} / {opponentFighter.maxQi}
                </span>
              </div>
              <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(0, (opponentFighter.qi / opponentFighter.maxQi) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Combat Actions Deck */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
            Acciones Tácticas del Cultivador
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => performDuelAction('basic')}
              disabled={!isMyTurn}
              className="p-3 bg-stone-950 hover:bg-stone-800 disabled:opacity-40 border border-stone-700/80 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-stone-100 font-semibold text-xs mb-1">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>Estocada Marcial</span>
              </div>
              <div className="text-[11px] text-stone-400">Daño físico constante · 0 Qi</div>
            </button>

            <button
              onClick={() => performDuelAction('technique', cultivator.knownTechniques[0]?.name)}
              disabled={!isMyTurn || myFighter.qi < 25}
              className="p-3 bg-stone-950 hover:bg-stone-800 disabled:opacity-40 border border-stone-700/80 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-stone-100 font-semibold text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Técnica Elemental</span>
              </div>
              <div className="text-[11px] text-stone-400">Golpe de 65+ daño · 25 Qi</div>
            </button>

            <button
              onClick={() => performDuelAction('secret')}
              disabled={!isMyTurn || myFighter.qi < 50}
              className="p-3 bg-stone-950 hover:bg-stone-800 disabled:opacity-40 border border-amber-600/60 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-amber-200 font-semibold text-xs mb-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Arte Secreto</span>
              </div>
              <div className="text-[11px] text-stone-400">Impacto colosal 110+ · 50 Qi</div>
            </button>

            <button
              onClick={() => performDuelAction('defend')}
              disabled={!isMyTurn}
              className="p-3 bg-stone-950 hover:bg-stone-800 disabled:opacity-40 border border-stone-700/80 rounded-lg text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-stone-100 font-semibold text-xs mb-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Campana de Qi</span>
              </div>
              <div className="text-[11px] text-stone-400">+50 Escudo & +25 Qi</div>
            </button>
          </div>
        </div>

        {/* Combat Log */}
        <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Crónica del Duelo
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
            {activeDuel.combatLog.map((entry, idx) => (
              <div
                key={idx}
                className={`${
                  entry.type === 'p1'
                    ? 'text-amber-300'
                    : entry.type === 'p2'
                    ? 'text-rose-300'
                    : 'text-stone-400 italic'
                }`}
              >
                {entry.text}
              </div>
            ))}
          </div>
        </div>

        {/* Victory/Defeat Modal */}
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-stone-900 border border-amber-600/60 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
              <Trophy
                className={`w-12 h-12 mx-auto mb-3 ${
                  didIWin ? 'text-amber-400' : 'text-stone-500'
                }`}
              />
              <h3 className="font-cinzel text-xl font-bold text-amber-100 mb-1">
                {didIWin ? '¡Victoria Honorable!' : 'Derrota en el Duelo'}
              </h3>
              <p className="text-xs text-stone-400 mb-4">
                {didIWin
                  ? 'Has demostrado la superioridad de tu cultivo y honrado a tu secta (+80 Méritos).'
                  : 'Una derrota templa la mente taoísta. Medita en tu Dantian para recuperar energías.'}
              </p>
              <button
                onClick={closeDuelSummary}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Volver a la Arena
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Arena Lobby & Matchmaking
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-6">
        <h2 className="font-cinzel text-2xl font-bold text-amber-100 mb-1">
          Arena de Duelos del Jianghu
        </h2>
        <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
          Reta a discípulos de otras facciones en combates estratégicos por turnos. Prueba el poder de tus meridianos y técnicas secretas en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Online Cultivators */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="font-cinzel text-sm font-semibold text-stone-200">
                Cultivadores Conectados en Tiempo Real
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-mono">
              {onlinePlayers.length} en línea
            </span>
          </div>

          {onlinePlayers.length === 0 ? (
            <p className="text-xs text-stone-500 py-4 text-center">
              No hay otros cultivadores en la misma sala en este instante. Desafía a los maestros de secta a continuación.
            </p>
          ) : (
            <div className="space-y-2">
              {onlinePlayers.map((player) => {
                if (player.id === cultivator.id) return null;
                return (
                  <div
                    key={player.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-200">{player.name}</div>
                      <div className="text-[11px] text-stone-400">
                        {player.realm} · {player.sectName}
                      </div>
                    </div>
                    <button
                      onClick={() => challengePlayer(player.id)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded text-xs transition-colors cursor-pointer"
                    >
                      Desafiar a Duelo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rival Sect Master Sparring */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinzel text-sm font-semibold text-stone-200">
                Duelos Asíncronos con Discípulos de Escuelas Rivales
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-mono">Sparring</span>
          </div>

          <div className="space-y-2.5">
            {simulatedChallengers.map((challenger) => (
              <div
                key={challenger.id}
                className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-stone-200">{challenger.name}</div>
                  <div className="text-[11px] text-stone-400">
                    {challenger.realm} · {challenger.sectName}
                  </div>
                </div>
                <button
                  onClick={() => challengePlayer(challenger.id)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded text-xs transition-colors cursor-pointer"
                >
                  Entrenar Duelo
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
