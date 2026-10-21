import React from 'react';
import { Cultivator, Item } from '../types/game';
import { Swords, Shield, Sparkles, Backpack, Zap, Heart, Flame } from 'lucide-react';

interface CharacterShowcaseProps {
  cultivator: Cultivator;
  onOpenInventory: () => void;
}

export const CharacterShowcaseCard: React.FC<CharacterShowcaseProps> = ({
  cultivator,
  onOpenInventory,
}) => {
  const { equippedGear, realm, subRealm, name, title, classType } = cultivator;

  const rarityBorders: Record<Item['rarity'], string> = {
    Común: 'border-stone-700 bg-stone-950/80',
    Mortal: 'border-stone-600 bg-stone-950/80',
    Raro: 'border-sky-500/60 bg-sky-950/20',
    Tierra: 'border-emerald-500/60 bg-emerald-950/20',
    Alma: 'border-purple-500/60 bg-purple-950/20',
    Celestial: 'border-rose-500/60 bg-rose-950/20',
    Primordial: 'border-amber-500/60 bg-amber-950/20',
  };

  return (
    <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-cinzel">
              <span>{title}</span>
              <span>·</span>
              <span className="capitalize">{classType}</span>
            </div>
            <h3 className="font-cinzel text-lg font-bold text-stone-100">{name}</h3>
          </div>
          <button
            onClick={onOpenInventory}
            className="px-3 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-700/80 rounded-lg text-xs text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Backpack className="w-3.5 h-3.5" />
            <span>Alforja</span>
          </button>
        </div>

        {/* Character Portrait with equipped visual badges */}
        <div className="relative w-full aspect-[3/4] max-h-[340px] rounded-xl overflow-hidden border border-amber-600/40 mb-5 shadow-2xl group">
          <img
            src="/src/assets/images/cultivator_avatar_hero_1792520046657.jpg"
            alt={name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />
          {/* Spiritual Qi Aura Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-90" />
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-[10px] text-amber-300 font-mono">
            {realm} · Nv.{subRealm}
          </div>

          {/* Quick overlay badges on portrait */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-rose-400 bg-black/70 px-2 py-1 rounded border border-rose-900/50 font-mono">
                <Heart className="w-3 h-3" />
                {cultivator.hp}/{cultivator.maxHp}
              </span>
              <span className="flex items-center gap-1 text-amber-300 bg-black/70 px-2 py-1 rounded border border-amber-900/50 font-mono">
                <Zap className="w-3 h-3" />
                {cultivator.qi}/{cultivator.maxQi}
              </span>
            </div>
            <span className="text-[10px] text-stone-400 bg-black/70 px-2 py-1 rounded">
              Poder: {cultivator.baseAttack + cultivator.spiritPower}
            </span>
          </div>
        </div>

        {/* Equipped Equipment Display (Arma, Túnica, Artefacto) */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Atuendo & Armamento Equipado</span>
            <span className="text-[10px] text-stone-500">3 Ranuras Activas</span>
          </div>

          {/* Weapon Slot */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
              equippedGear.weapon ? rarityBorders[equippedGear.weapon.rarity] : 'bg-stone-950/40 border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center text-amber-400 border border-stone-800 shrink-0">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-stone-200">
                  {equippedGear.weapon ? equippedGear.weapon.name : 'Sin Arma Equipada'}
                </div>
                <div className="text-[10px] text-stone-400">
                  {equippedGear.weapon ? (
                    <span className="text-amber-300">
                      +{equippedGear.weapon.statBonus?.attack || 0} Ataque · {equippedGear.weapon.rarity}
                    </span>
                  ) : (
                    'Equipa una espada o lanza desde tu alforja'
                  )}
                </div>
              </div>
            </div>
            {equippedGear.weapon?.element && (
              <span className="text-[10px] font-mono text-cyan-400 bg-stone-900/80 px-2 py-0.5 rounded">
                {equippedGear.weapon.element}
              </span>
            )}
          </div>

          {/* Robe / Armor Slot */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
              equippedGear.armor ? rarityBorders[equippedGear.armor.rarity] : 'bg-stone-950/40 border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center text-cyan-400 border border-stone-800 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-stone-200">
                  {equippedGear.armor ? equippedGear.armor.name : 'Túnica Taoísta Ordinaria'}
                </div>
                <div className="text-[10px] text-stone-400">
                  {equippedGear.armor ? (
                    <span className="text-cyan-300">
                      +{equippedGear.armor.statBonus?.defense || 0} Defensa · +{equippedGear.armor.statBonus?.hp || 0} Salud
                    </span>
                  ) : (
                    'Protección básica de lino'
                  )}
                </div>
              </div>
            </div>
            {equippedGear.armor?.element && (
              <span className="text-[10px] font-mono text-emerald-400 bg-stone-900/80 px-2 py-0.5 rounded">
                {equippedGear.armor.element}
              </span>
            )}
          </div>

          {/* Artifact Slot */}
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
              equippedGear.artifact ? rarityBorders[equippedGear.artifact.rarity] : 'bg-stone-950/40 border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-stone-900 flex items-center justify-center text-purple-400 border border-stone-800 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-stone-200">
                  {equippedGear.artifact ? equippedGear.artifact.name : 'Sin Talisman Sagrado'}
                </div>
                <div className="text-[10px] text-stone-400">
                  {equippedGear.artifact ? (
                    <span className="text-purple-300">
                      +{equippedGear.artifact.statBonus?.spirit || 0} Poder Espiritual · {equippedGear.artifact.rarity}
                    </span>
                  ) : (
                    'Equipa un artefacto para amplificar tus técnicas'
                  )}
                </div>
              </div>
            </div>
            {equippedGear.artifact?.element && (
              <span className="text-[10px] font-mono text-purple-400 bg-stone-900/80 px-2 py-0.5 rounded">
                {equippedGear.artifact.element}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
