import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { PointOfInterest, seededRandom } from '../data/proceduralGenerator';
import { Swords, Shield, Skull, ArrowLeft, Coins, Zap, Trophy, AlertTriangle, Heart, Sparkles, LogOut } from 'lucide-react';
import { Item } from '../types/game';

interface DungeonViewProps {
  poi: PointOfInterest;
  onExit: () => void;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  rewardStones: number;
}

export const DungeonView: React.FC<DungeonViewProps> = ({ poi, onExit }) => {
  const { cultivator, collectDungeonLoot } = useGame();
  
  const [floor, setFloor] = useState<number>(1);
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const [playerHp, setPlayerHp] = useState<number>(cultivator?.hp || 100);

  // Generador de enemigos procedurales
  useEffect(() => {
    if (!poi) return;
    const random = seededRandom(`${poi.id}_floor_${floor}`);
    
    const enemyPrefixes = ['Sombra de', 'Espectro de', 'Guardián de', 'Bestia de'];
    const enemyTypes = ['Ogro', 'Serpiente', 'Lobo', 'Esqueleto', 'Demonio'];
    
    const prefix = enemyPrefixes[Math.floor(random() * enemyPrefixes.length)];
    const type = enemyTypes[Math.floor(random() * enemyTypes.length)];
    
    const baseHp = 100 + (floor * 50) + (poi.levelRequired * 20);
    const baseAtk = 10 + (floor * 5) + (poi.levelRequired * 2);

    setEnemy({
      name: `${prefix} ${type} (Piso ${floor})`,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAtk,
      rewardStones: Math.floor(baseHp * 0.5)
    });
    setCombatLog([`Has entrado al Piso ${floor}. Un ${prefix} ${type} te bloquea el paso.`]);
    setIsFighting(false);
  }, [poi, floor]);

  if (!cultivator || !enemy) return null;

  const handleAttack = (type: 'basic' | 'skill') => {
    if (isFighting || enemy.hp <= 0) return;
    setIsFighting(true);

    let playerDamage = 0;
    let qiCost = 0;
    let logMsg = '';

    if (type === 'basic') {
      playerDamage = Math.floor((cultivator.baseAttack || 20) + (Math.random() * 20));
      logMsg = `Has ejecutado un ataque básico causando ${playerDamage} de daño.`;
    } else {
      // Usamos una técnica (asumiendo que tenemos la primera equipada)
      qiCost = 20;
      if (cultivator.qi < qiCost) {
        setCombatLog(prev => [...prev, 'No tienes suficiente Qi para usar una técnica.']);
        setIsFighting(false);
        return;
      }
      playerDamage = Math.floor((cultivator.baseAttack * 1.5) + (cultivator.spiritPower * 1.2) + (Math.random() * 30));
      logMsg = `¡Has desatado una Técnica Marcial causando ${playerDamage} de daño! (-${qiCost} Qi)`;
    }

    const enemyDamage = Math.floor(enemy.attack + (Math.random() * 10));

    let newLog = [...combatLog, logMsg];
    const newEnemyHp = Math.max(0, enemy.hp - playerDamage);
    setEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null);

    if (newEnemyHp <= 0) {
      newLog.push(`¡Has derrotado al ${enemy.name}!`);
      
      // Generar botín
      const lootRandom = seededRandom(`${poi.id}_loot_${floor}`);
      let lootItem: Item | undefined;
      
      if (lootRandom() > 0.4) { // 60% de probabilidad de drop
        lootItem = {
          id: `loot_${Date.now()}`,
          name: floor > 3 ? 'Esencia Espiritual Concentrada' : 'Fragmento de Qi',
          category: 'material',
          rarity: floor > 3 ? 'Alma' : 'Tierra',
          description: 'Material obtenido en las profundidades de la mazmorra.',
          value: enemy.rewardStones
        };
        newLog.push(`¡Has encontrado: ${lootItem.name}!`);
      }

      // Llamar al contexto para guardar recompensas (oro, botín y daño)
      collectDungeonLoot(enemy.rewardStones, lootItem, qiCost);
      setCombatLog(newLog);
      
      setTimeout(() => setIsFighting(false), 1000);
      return;
    }

    newLog.push(`El enemigo te ataca causando ${enemyDamage} de daño.`);
    setCombatLog(newLog);
    setPlayerHp(prev => Math.max(0, prev - enemyDamage));

    setTimeout(() => {
      setIsFighting(false);
      if (playerHp - enemyDamage <= 0) {
        alert("Has caído en combate. Serás expulsado de la mazmorra.");
        onExit();
      }
    }, 500);
  };

  const handleNextFloor = () => {
    setFloor(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* Header Mazmorra */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/30 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-xs text-rose-400 font-cinzel mb-1 flex items-center gap-2">
              <Skull className="w-4 h-4" />
              <span>Mazmorra Activa · Nivel {poi.levelRequired}</span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-stone-100">{poi.name}</h2>
            <p className="text-xs text-stone-400 mt-1">Piso Actual: {floor}</p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-stone-950 border border-stone-700 hover:border-rose-500 text-stone-300 hover:text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Huir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel del Jugador */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-amber-950/30 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Shield className="w-16 h-16 text-amber-500" />
          </div>
          
          <div className="text-center w-full">
            <h3 className="font-cinzel text-xl font-bold text-amber-100">{cultivator.name}</h3>
            <div className="flex justify-between text-xs text-stone-400 mt-2 mb-1">
              <span>Salud</span>
              <span className="font-mono text-rose-400">{playerHp} / {cultivator.maxHp}</span>
            </div>
            <div className="w-full bg-stone-950 h-3 rounded-full overflow-hidden border border-rose-900">
              <div className="bg-rose-600 h-full transition-all duration-300" style={{ width: `${(playerHp / cultivator.maxHp) * 100}%` }} />
            </div>

            <div className="flex justify-between text-xs text-stone-400 mt-2 mb-1">
              <span>Qi</span>
              <span className="font-mono text-cyan-400">{cultivator.qi} / {cultivator.maxQi}</span>
            </div>
            <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-cyan-900">
              <div className="bg-cyan-600 h-full transition-all duration-300" style={{ width: `${(cultivator.qi / cultivator.maxQi) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Panel del Enemigo */}
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-rose-950/30 border-2 border-rose-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.2)]">
            <Skull className="w-16 h-16 text-rose-500" />
          </div>
          
          <div className="text-center w-full">
            <h3 className="font-cinzel text-xl font-bold text-rose-200">{enemy.name}</h3>
            <div className="w-full bg-stone-950 h-3 rounded-full mt-2 overflow-hidden border border-rose-900">
              <div className="bg-rose-600 h-full transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-1 font-mono">{enemy.hp} / {enemy.maxHp} HP</p>
          </div>
        </div>
      </div>

      {/* Log de Combate */}
      <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 flex flex-col h-[200px]">
        <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
          {combatLog.map((log, i) => (
            <div key={i} className={`pb-1 border-b border-stone-900/50 ${i === combatLog.length - 1 ? 'text-amber-300' : 'text-stone-400'}`}>
              &gt; {log}
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        {enemy.hp > 0 ? (
          <>
            <button
              onClick={() => handleAttack('basic')}
              disabled={isFighting}
              className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border border-stone-600"
            >
              <Swords className="w-5 h-5" /> Ataque Básico
            </button>
            <button
              onClick={() => handleAttack('skill')}
              disabled={isFighting || cultivator.qi < 20}
              className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5" /> Técnica (-20 Qi)
            </button>
          </>
        ) : (
          <button
            onClick={handleNextFloor}
            className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer animate-in zoom-in-95"
          >
            <Trophy className="w-6 h-6" /> Descender al Piso {floor + 1}
          </button>
        )}
      </div>
    </div>
  );
};