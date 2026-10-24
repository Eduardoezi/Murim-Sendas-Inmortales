import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { DantianEnergyVisualization } from './DantianEnergyVisualization';
import { CharacterShowcaseCard } from './CharacterShowcaseCard';
import { Flame, Wind, Droplets, Mountain, Zap, Sparkles, AlertTriangle, CheckCircle, Leaf } from 'lucide-react';
import { ElementType } from '../types/game';

interface CultivationViewProps {
  onOpenInventory?: () => void;
}

export const CultivationView: React.FC<CultivationViewProps> = ({ onOpenInventory }) => {
  const { cultivator, meditate, unlockMeridian, attemptBreakthrough, allocateAttributePoint } = useGame();
  const [breakthroughNotice, setBreakthroughNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [isMeditatingEffect, setIsMeditatingEffect] = useState(false);

  if (!cultivator) return null;

  const handleMeditate = () => {
    setIsMeditatingEffect(true);
    meditate();
    setTimeout(() => setIsMeditatingEffect(false), 500);
  };

  const handleBreakthrough = () => {
    const res = attemptBreakthrough();
    setBreakthroughNotice(res);
    setTimeout(() => setBreakthroughNotice(null), 5000);
  };

  const elementIcons: Record<ElementType, React.ComponentType<{ className?: string }>> = {
    Fuego: Flame,
    Agua: Droplets,
    Madera: Leaf,
    Tierra: Mountain,
    Rayo: Zap,
    Viento: Wind,
    Caos: Sparkles,
  };

  const qiPercent = Math.min(100, Math.floor((cultivator.qi / cultivator.maxQi) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Cultivator Realm & Dantian Status */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-cinzel mb-1">
              <span>{cultivator.title}</span>
              <span>·</span>
              <span>{cultivator.name}</span>
            </div>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-amber-100">
              {cultivator.realm} · Capa {cultivator.subRealm} / 9
            </h2>
            <p className="text-xs text-stone-400 mt-1 max-w-xl">
              Asienta el Qi celestial en tu Dantian bajo y desbloquea los ocho canales extraordinarios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMeditate}
              className={`px-5 py-2.5 rounded-lg font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
                isMeditatingEffect
                  ? 'bg-amber-400 text-stone-950 scale-105 ring-4 ring-amber-400/30'
                  : 'bg-amber-600/90 hover:bg-amber-500 text-stone-950 hover:shadow-lg hover:shadow-amber-900/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Respiración & Meditación Qi</span>
            </button>

            <button
              onClick={handleBreakthrough}
              disabled={cultivator.qi < cultivator.maxQi * 0.9}
              className={`px-5 py-2.5 rounded-lg font-cinzel font-bold text-xs tracking-wider uppercase transition-all cursor-pointer ${
                cultivator.qi >= cultivator.maxQi * 0.9
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-900/40'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              Desafiar Tribulación de Avance
            </button>
          </div>
        </div>

        {breakthroughNotice && (
          <div className={`mt-4 p-3 rounded-lg border text-xs flex items-center gap-3 ${breakthroughNotice.success ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200' : 'bg-rose-950/60 border-rose-500/60 text-rose-200'}`}>
            {breakthroughNotice.success ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{breakthroughNotice.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-stone-800/80">
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Energía Espiritual (Qi)</span>
              <span className="font-mono text-amber-300 tabular-nums">{cultivator.qi} / {cultivator.maxQi} ({qiPercent}%)</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300" style={{ width: `${qiPercent}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Vitalidad (Salud)</span>
              <span className="font-mono text-rose-400 tabular-nums">{cultivator.hp} / {cultivator.maxHp}</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div className="bg-gradient-to-r from-rose-600 to-rose-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, (cultivator.hp / cultivator.maxHp) * 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Pureza del Núcleo</span>
              <span className="font-mono text-cyan-300 tabular-nums">{cultivator.dantianPurity}%</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-300" style={{ width: `${cultivator.dantianPurity}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <CharacterShowcaseCard cultivator={cultivator} onOpenInventory={onOpenInventory || (() => {})} />
        </div>

        <div className="lg:col-span-4">
          <DantianEnergyVisualization cultivator={cultivator} onSelectMeridian={(id) => unlockMeridian(id)} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800">
              <h3 className="font-cinzel text-sm font-semibold text-stone-200">Canales Extraordinarios</h3>
              <span className="text-xs text-amber-400 font-mono">{cultivator.qi} Qi Disp.</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {(cultivator.meridians || []).map((meridian) => {
                const Icon = elementIcons[meridian.elementAffinity] || Sparkles; // FALLBACK AÑADIDO AQUÍ
                const canUnlock = !meridian.unlocked && cultivator.qi >= meridian.qiCost;

                return (
                  <div key={meridian.id} className={`p-3 rounded-lg border text-xs transition-colors ${meridian.unlocked ? 'bg-amber-950/20 border-amber-600/40 text-stone-200' : 'bg-stone-950/60 border-stone-800/80 text-stone-400'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${meridian.unlocked ? 'text-amber-400' : 'text-stone-500'}`} />
                        <span className="font-semibold text-stone-100">{meridian.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">{meridian.pinyin}</span>
                    </div>
                    <div className="text-[11px] text-amber-300/90 mb-2">{meridian.bonus}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                      <span className="text-[10px] text-stone-400">Afinidad: {meridian.elementAffinity}</span>
                      {meridian.unlocked ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">Desbloqueado</span>
                      ) : (
                        <button onClick={() => unlockMeridian(meridian.id)} disabled={!canUnlock} className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${canUnlock ? 'bg-amber-600 hover:bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-500 cursor-not-allowed'}`}>
                          Abrir ({meridian.qiCost} Qi)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-cinzel">
              <span>REGLAS Y ATRIBUTOS DE CULTIVO</span>
            </div>
            <h3 className="font-cinzel text-xl font-bold text-amber-100">Matriz de Atributos del Alma & Cuerpo</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-300">Puntos Libres: <strong className="text-amber-300 font-mono text-base tabular-nums">{cultivator.freeAttributePoints || 0}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {[
            { key: 'fuerza', label: 'Fuerza', desc: 'Densidad y daño físico', val: cultivator.attributes?.fuerza || 16, color: 'text-amber-400' },
            { key: 'destreza', label: 'Destreza', desc: 'Velocidad y evasión', val: cultivator.attributes?.destreza || 18, color: 'text-emerald-400' },
            { key: 'constitucion', label: 'Constitución', desc: 'Salud y tribulaciones', val: cultivator.attributes?.constitucion || 16, color: 'text-rose-400' },
            { key: 'inteligencia', label: 'Inteligencia', desc: 'Aprendizaje y Bundle Theory', val: cultivator.attributes?.inteligencia || 18, color: 'text-blue-400' },
            { key: 'percepcion', label: 'Percepción', desc: 'Sentido y lectura de Qi', val: cultivator.attributes?.percepcion || 16, color: 'text-purple-400' },
            { key: 'astucia', label: 'Astucia', desc: 'Sigilo e ilusiones', val: cultivator.attributes?.astucia || 14, color: 'text-yellow-400' },
            { key: 'voluntad', label: 'Voluntad', desc: 'Resistencia a cuellos', val: cultivator.attributes?.voluntad || 16, color: 'text-teal-400' },
            { key: 'suerte', label: 'Suerte', desc: 'Eventos del destino', val: cultivator.attributes?.suerte || 12, color: 'text-cyan-400' },
            { key: 'sabiduria', label: 'Sabiduría', desc: 'Comprensión cósmica', val: cultivator.attributes?.sabiduria || 16, color: 'text-indigo-400' },
            { key: 'carisma', label: 'Carisma', desc: 'Liderazgo y discípulos', val: cultivator.attributes?.carisma || 14, color: 'text-pink-400' },
          ].map((attr) => (
            <div key={attr.key} className="bg-stone-950/80 p-3 rounded-lg border border-stone-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-200">{attr.label}</span>
                  <span className={`font-mono font-bold text-sm tabular-nums ${attr.color}`}>{attr.val}</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-tight mb-2">{attr.desc}</p>
              </div>
              <button onClick={() => allocateAttributePoint(attr.key as any)} disabled={(cultivator.freeAttributePoints || 0) <= 0} className="w-full py-1 rounded bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 border border-stone-700 text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed transition-colors">
                <span>+1 Punto</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};