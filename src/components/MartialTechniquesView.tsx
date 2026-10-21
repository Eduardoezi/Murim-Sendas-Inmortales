import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ElementType, CustomSecretTechnique } from '../types/game';
import { Flame, Droplets, Wind, Mountain, Zap, Plus, Shield, Award, Sparkles, Leaf } from 'lucide-react';

export const MartialTechniquesView: React.FC = () => {
  const { cultivator, craftSecretTechnique } = useGame();

  const [techName, setTechName] = useState('Danza de las Nueve Sombras');
  const [selectedElement, setSelectedElement] = useState<ElementType>('Rayo');
  const [selectedEffect, setSelectedEffect] = useState<'burn_drain' | 'thunder_stun' | 'frost_shield' | 'fatal_strike'>('thunder_stun');

  if (!cultivator) return null;

  const handleCreateSecretArt = (e: React.FormEvent) => {
    e.preventDefault();
    const effectLabels = {
      burn_drain: 'Combustión & Drenaje de Qi',
      thunder_stun: 'Aturdimiento Eléctrico del Dantian',
      frost_shield: 'Escudo Glacial Indestructible',
      fatal_strike: 'Golpe Mortal con Penetración Ósea',
    };

    const newSecret: CustomSecretTechnique = {
      id: `secret_${Date.now()}`,
      name: techName.trim() || 'Arte Supremo Secreto',
      element: selectedElement,
      baseMultiplier: selectedEffect === 'fatal_strike' ? 2.5 : 2.0,
      qiCost: 45,
      specialEffect: selectedEffect,
      effectName: effectLabels[selectedEffect],
      level: 1,
    };

    craftSecretTechnique(newSecret);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-6">
        <h2 className="font-cinzel text-2xl font-bold text-amber-100 mb-1">
          Artes Marciales & Técnicas Secretas
        </h2>
        <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
          El combate del Jianghu se rige por las cinco fuerzas elementales y el flujo de energía. Domina las técnicas ortodoxas y forja tu propio Arte Prohibido para doblegar a cualquier oponente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Known Active Techniques */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="font-cinzel text-sm font-semibold text-stone-200">
              Técnicas Marciales Asimiladas ({cultivator.knownTechniques.length})
            </h3>
            <span className="text-xs text-amber-400 font-mono">
              Reino Actual: {cultivator.realm}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cultivator.knownTechniques.map((tech) => {
              const Icon = elementIcons[tech.element];
              return (
                <div
                  key={tech.id}
                  className="bg-stone-900/60 border border-stone-800 p-4 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-xs text-stone-100">{tech.name}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Costo: {tech.qiCost} Qi
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-300 mb-3 leading-relaxed">
                      {tech.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-[10px] text-stone-400">
                    <span>Multiplicador: {tech.powerMultiplier}x</span>
                    <span className="text-amber-400 font-medium uppercase">
                      Efecto: {tech.effect}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Custom Secret Technique */}
          {cultivator.secretTechnique ? (
            <div className="bg-gradient-to-r from-amber-950/40 via-stone-900/80 to-amber-950/40 border border-amber-600/50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="font-cinzel font-bold text-sm text-amber-200">
                    Técnica Secreta: {cultivator.secretTechnique.name}
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400">
                  Afinidad {cultivator.secretTechnique.element}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Especialidad: <span className="text-amber-300">{cultivator.secretTechnique.effectName}</span> · Multiplicador de Daño: {cultivator.secretTechnique.baseMultiplier}x · Costo: {cultivator.secretTechnique.qiCost} Qi
              </p>
            </div>
          ) : (
            <div className="p-4 bg-stone-900/30 border border-dashed border-stone-800 rounded-xl text-center text-xs text-stone-500">
              Aún no has creado una Técnica Secreta personalizada. Utiliza el taller inferior para forjarla.
            </div>
          )}
        </div>

        {/* Secret Technique Workshop */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5">
          <h3 className="font-cinzel text-sm font-semibold text-stone-200 mb-1">
            Taller del Arte Secreto
          </h3>
          <p className="text-[11px] text-stone-400 mb-4">
            Combina los principios del Yin-Yang y elementos para diseñar tu propia carta marcial única.
          </p>

          <form onSubmit={handleCreateSecretArt} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-300 mb-1 font-medium">
                Nombre de la Técnica Secreta
              </label>
              <input
                type="text"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                maxLength={30}
                required
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-amber-200 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-300 mb-1 font-medium">
                Afinidad Primordial Elemental
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {(['Fuego', 'Agua', 'Madera', 'Tierra', 'Rayo', 'Viento', 'Caos'] as ElementType[]).map((elm) => (
                  <button
                    key={elm}
                    type="button"
                    onClick={() => setSelectedElement(elm)}
                    className={`py-1.5 px-1 rounded border text-[11px] font-semibold text-center cursor-pointer transition-colors ${
                      selectedElement === elm
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {elm}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-stone-300 mb-1 font-medium">
                Efecto Especial Único
              </label>
              <div className="space-y-2">
                {[
                  { id: 'thunder_stun', label: 'Aturdimiento Eléctrico (Pausa de turno)' },
                  { id: 'burn_drain', label: 'Llamarada & Drenaje de Qi continuo' },
                  { id: 'frost_shield', label: 'Escudo Glacial Absorbente (+70 Escudo)' },
                  { id: 'fatal_strike', label: 'Golpe Mortal (2.5x Daño Crítico)' },
                ].map((eff) => (
                  <label
                    key={eff.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      selectedEffect === eff.id
                        ? 'bg-amber-950/40 border-amber-600/60 text-stone-200'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="secret_effect"
                      checked={selectedEffect === eff.id}
                      onChange={() => setSelectedEffect(eff.id as any)}
                      className="accent-amber-500"
                    />
                    <span className="text-[11px]">{eff.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer mt-2"
            >
              Forjar Técnica Secreta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
