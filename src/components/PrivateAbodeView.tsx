import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { murimAudio } from '../utils/audio';
import { Sparkles, Moon, Bed, ShieldCheck, Box, Coins, RefreshCw } from 'lucide-react';

interface PrivateAbodeProps {
  onOpenInventory: () => void;
}

export const PrivateAbodeView: React.FC<PrivateAbodeProps> = ({ onOpenInventory }) => {
  const { cultivator } = useGame();
  const [abodeActionNotice, setAbodeActionNotice] = useState<string | null>(null);

  if (!cultivator) return null;

  const handleDeepMeditation = () => {
    murimAudio.playQiChime();
    setAbodeActionNotice(
      'Te sientas sobre el altar de piedra bajo el ciruelo en flor. El Qi puro de la montaña fluye armoniosamente a tu Dantian (+40 Qi, +2% Pureza).'
    );
    setTimeout(() => setAbodeActionNotice(null), 4000);
  };

  const handleRestBed = () => {
    murimAudio.playQiChime();
    setAbodeActionNotice(
      'Descansas sobre la estera de jade milenario. Tus músculos se relajan y tu vitalidad queda totalmente restablecida (+HP Máxima).'
    );
    setTimeout(() => setAbodeActionNotice(null), 4000);
  };

  // Calculate net worth of all items in inventory + spirit stones
  const inventoryValue = cultivator.inventory.reduce((sum, item) => sum + item.value, 0);
  const totalNetWorth = cultivator.spiritStones + inventoryValue;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner with Scenic Courtyard Image */}
      <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/80 min-h-[220px] md:min-h-[280px] flex items-end p-6 md:p-8">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/cultivator_private_abode_1792520046408.jpg"
            alt="Patio Espiritual y Morada de Cultivo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(7,9,14,0.9)_20%,transparent_70%)]" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-cinzel mb-1">
              <Moon className="w-4 h-4" />
              <span>清幽洞府 · Morada Espiritual & Patio Privado</span>
            </div>
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-amber-100">
              Patio de las Flores de Ciruelo
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
              Tu refugio personal alejado de las intrigas del Jianghu. Un espacio íntimo donde meditar en soledad, descansar en tu cámara de jade y custodiar tus tesoros acumulados.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 self-start md:self-auto backdrop-blur shrink-0">
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Patrimonio del Cultivador</div>
              <div className="font-mono text-base font-bold text-amber-300 tabular-nums">
                {totalNetWorth.toLocaleString()} Piedras
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {abodeActionNotice && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl text-xs text-amber-200 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{abodeActionNotice}</span>
        </div>
      )}

      {/* The 3 Core Personal Spaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Patio de Meditación & Entrenamiento Privado */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                Zona Exterior
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-cinzel font-bold text-sm text-stone-100">
                Patio de Meditación
              </h3>
            </div>

            <p className="text-[11px] text-stone-400 mb-4 leading-relaxed">
              Altar de piedra sagrada rodeado por bambúes susurrantes y un estanque de lotos. Permite cultivar Qi sin perturbaciones externas.
            </p>

            <div className="space-y-1.5 p-3 bg-stone-950/70 rounded-lg border border-stone-800/80 text-xs mb-4">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Concentración de Qi Ambiental:</span>
                <span className="text-amber-300 font-mono font-semibold">+150%</span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Alineación del Dantian:</span>
                <span className="text-emerald-400 font-mono">Sereno</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDeepMeditation}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Meditación Profunda</span>
          </button>
        </div>

        {/* 2. Dormitorio & Cámara de Jade */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-sky-400 font-mono uppercase tracking-wider">
                Zona Interior
              </span>
              <div className="w-2 h-2 rounded-full bg-sky-500" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Bed className="w-4 h-4" />
              </div>
              <h3 className="font-cinzel font-bold text-sm text-stone-100">
                Dormitorio & Cámara de Reposo
              </h3>
            </div>

            <p className="text-[11px] text-stone-400 mb-4 leading-relaxed">
              Cámara tallada en jade frío que pacifica los demonios internos y sana las heridas espirituales acumuladas tras rigurosos duelos.
            </p>

            <div className="space-y-1.5 p-3 bg-stone-950/70 rounded-lg border border-stone-800/80 text-xs mb-4">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Estado de Vitalidad Corporal:</span>
                <span className="text-rose-400 font-mono font-semibold">
                  {cultivator.hp} / {cultivator.maxHp}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Tranquilidad Mental:</span>
                <span className="text-sky-300 font-mono">Restaurada</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRestBed}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Bed className="w-3.5 h-3.5" />
            <span>Reposo Restaurador</span>
          </button>
        </div>

        {/* 3. Almacén & Cámara de Tesoros Privada */}
        <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">
                Cámara Secreta
              </span>
              <div className="w-2 h-2 rounded-full bg-purple-500" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Box className="w-4 h-4" />
              </div>
              <h3 className="font-cinzel font-bold text-sm text-stone-100">
                Cámara del Tesoro & Almacén
              </h3>
            </div>

            <p className="text-[11px] text-stone-400 mb-4 leading-relaxed">
              Bóveda protegida por talismanes de confinamiento donde resguardas tus armas legendarias, ingredientes alquímicos y piedras espirituales.
            </p>

            <div className="space-y-1.5 p-3 bg-stone-950/70 rounded-lg border border-stone-800/80 text-xs mb-4">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Objetos en Custodia:</span>
                <span className="text-stone-200 font-mono font-semibold">
                  {cultivator.inventory.length} Lotes
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Piedras Espirituales:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {cultivator.spiritStones}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenInventory}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Abrir Bóveda del Tesoro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
