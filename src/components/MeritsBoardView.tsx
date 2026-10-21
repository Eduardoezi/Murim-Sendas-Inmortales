import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { MERIT_MILESTONES } from '../data/gameData';
import { Cultivator } from '../types/game';
import { Award, Sparkles, CheckCircle2, ChevronRight, Flame, Swords, Beaker, Users, Globe, ShoppingBag } from 'lucide-react';

interface MeritsBoardViewProps {
  onNavigateToAuction?: () => void;
}

export const MeritsBoardView: React.FC<MeritsBoardViewProps> = ({ onNavigateToAuction }) => {
  const { cultivator, claimMilestone } = useGame();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!cultivator) return null;

  const claimedList = cultivator.claimedAchievements || [];

  // Helper to compute dynamic milestone progress
  const getProgress = (milestoneId: string, c: Cultivator): { current: number; isComplete: boolean } => {
    switch (milestoneId) {
      case 'milestone_qi_150':
        return { current: Math.min(150, c.maxQi), isComplete: c.maxQi >= 150 };
      case 'milestone_meridian_1':
        return { current: Math.min(1, c.stats.meridiansOpened), isComplete: c.stats.meridiansOpened >= 1 };
      case 'milestone_meridian_4':
        return { current: Math.min(4, c.stats.meridiansOpened), isComplete: c.stats.meridiansOpened >= 4 };
      case 'milestone_meridian_8':
        return { current: Math.min(8, c.stats.meridiansOpened), isComplete: c.stats.meridiansOpened >= 8 };
      case 'milestone_foundation': {
        const isPastCondensation = c.realm !== 'Condensación de Qi';
        return { current: isPastCondensation ? 1 : 0, isComplete: isPastCondensation };
      }
      case 'milestone_purity_70':
        return { current: Math.min(70, c.dantianPurity), isComplete: c.dantianPurity >= 70 };
      case 'milestone_secret_art':
        return { current: c.secretTechnique ? 1 : 0, isComplete: Boolean(c.secretTechnique) };
      case 'milestone_first_duel':
        return { current: Math.min(1, c.stats.duelsWon), isComplete: c.stats.duelsWon >= 1 };
      case 'milestone_duels_3':
        return { current: Math.min(3, c.stats.duelsWon), isComplete: c.stats.duelsWon >= 3 };
      case 'milestone_first_pill':
        return { current: Math.min(1, c.stats.pillsCrafted), isComplete: c.stats.pillsCrafted >= 1 };
      case 'milestone_pills_5':
        return { current: Math.min(5, c.stats.pillsCrafted), isComplete: c.stats.pillsCrafted >= 5 };
      case 'milestone_recruit_disciple':
        return { current: Math.min(1, c.disciples.length), isComplete: c.disciples.length >= 1 };
      case 'milestone_disciples_3':
        return { current: Math.min(3, c.disciples.length), isComplete: c.disciples.length >= 3 };
      case 'milestone_boss_damage':
        return { current: Math.min(1000, c.stats.bossDamageDealt), isComplete: c.stats.bossDamageDealt >= 1000 };
      case 'milestone_boss_master':
        return { current: Math.min(5000, c.stats.bossDamageDealt), isComplete: c.stats.bossDamageDealt >= 5000 };
      default:
        return { current: 0, isComplete: false };
    }
  };

  const categoryIcons = {
    cultivo: Flame,
    marcial: Swords,
    alquimia: Beaker,
    secta: Users,
    jianghu: Globe,
  };

  const filteredMilestones = MERIT_MILESTONES.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  const totalMilestonesCount = MERIT_MILESTONES.length;
  const completedCount = MERIT_MILESTONES.filter((m) => getProgress(m.id, cultivator).isComplete).length;
  const claimedCount = claimedList.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-cinzel mb-1">
              <Award className="w-4 h-4" />
              <span>宗門功績榜 · Tablón de Méritos & Logros Inmortales</span>
            </div>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-amber-100">
              Hitos de Cultivación & Méritos de Secta
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Cada hito superado en el Jianghu te otorga puntos de mérito sagrados. Canjéalos en la Casa de Subastas por reliquias milenarias, píldoras celestiales y artefactos únicos.
            </p>
          </div>

          {/* Quick Metrics Cluster */}
          <div className="flex flex-wrap items-center gap-4 text-xs bg-stone-950/70 p-4 rounded-xl border border-stone-800 self-start md:self-auto shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Puntos de Mérito Actuales</div>
              <div className="font-mono text-xl font-bold text-amber-300 tabular-nums">
                {cultivator.sectMerits} Méritos
              </div>
            </div>
            <div className="w-[1px] h-8 bg-stone-800" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Hitos Reclamados</div>
              <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                {claimedCount} / {totalMilestonesCount}
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-stone-800/80 space-y-2">
          <div className="flex justify-between text-xs text-stone-400">
            <span>Progreso General del Tablón ({completedCount} de {totalMilestonesCount} desbloqueados)</span>
            <span className="font-mono text-amber-400 tabular-nums">
              {Math.floor((completedCount / totalMilestonesCount) * 100)}%
            </span>
          </div>
          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${(completedCount / totalMilestonesCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Link to Auction */}
        {onNavigateToAuction && (
          <div className="mt-4 flex items-center justify-between text-xs p-3 bg-amber-950/30 border border-amber-600/30 rounded-lg">
            <span className="text-amber-200">
              ¿Deseas invertir tus puntos de mérito en armas y artefactos legendarios?
            </span>
            <button
              onClick={onNavigateToAuction}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ir a la Subasta de Méritos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Category Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-stone-800">
        {[
          { id: 'all', label: 'Todos los Hitos' },
          { id: 'cultivo', label: 'Cultivo & Dantian' },
          { id: 'marcial', label: 'Artes Marciales & Duelos' },
          { id: 'alquimia', label: 'Alquimia & Caldero' },
          { id: 'secta', label: 'Secta & Discípulos' },
          { id: 'jianghu', label: 'Jianghu & Eventos' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-amber-950/60 border border-amber-600/50 text-amber-300'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMilestones.map((milestone) => {
          const { current, isComplete } = getProgress(milestone.id, cultivator);
          const isClaimed = claimedList.includes(milestone.id);
          const Icon = categoryIcons[milestone.category];
          const progressPercent = Math.min(100, Math.floor((current / milestone.targetCount) * 100));

          return (
            <div
              key={milestone.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isClaimed
                  ? 'bg-stone-950/40 border-stone-800/60 opacity-75'
                  : isComplete
                  ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-stone-900/60 border-stone-800'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isComplete ? 'bg-amber-500/20 text-amber-400' : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-stone-100">{milestone.title}</h4>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {milestone.chineseTitle}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-amber-400 font-semibold shrink-0">
                    +{milestone.meritReward} Méritos
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-stone-400 mb-4 leading-relaxed">
                  {milestone.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>Progreso</span>
                    <span className="font-mono tabular-nums">
                      {current} / {milestone.targetCount} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reward & Claim Footer */}
              <div className="pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-stone-400">
                  Recompensa: <strong className="text-amber-300">+{milestone.meritReward} Méritos</strong> ·{' '}
                  <span className="text-emerald-400">+{milestone.stoneReward} Piedras</span>
                </span>

                {isClaimed ? (
                  <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Reclamado</span>
                  </span>
                ) : isComplete ? (
                  <button
                    onClick={() => claimMilestone(milestone.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-cinzel font-bold rounded text-[11px] tracking-wide transition-all shadow-md shadow-amber-900/30 cursor-pointer flex items-center gap-1.5 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Reclamar</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-600 font-mono">En Progreso</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
