import { useState } from 'react';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { Flame, ShieldAlert, Zap, X } from 'lucide-react';

export const MeditationPanel = () => {
  const { 
    isMeditating, meditationLocation, cb_actual, cb_requerido, 
    startMeditation, stopMeditation, attributes, eficienciaBase 
  } = usePlayerStore();

  const [showWarning, setShowWarning] = useState(false);

  // Fórmula oficial GDD: Ganancia basada en Percepción y Eficiencia Base
  const gananciaPorTick = eficienciaBase + Math.floor(attributes.percepcion / 2);
  const porcentajeProgreso = Math.min(100, (cb_actual / cb_requerido) * 100);

  // 1. PANTALLA DE MEDITACIÓN ACTIVA
  if (isMeditating) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 relative">
        {/* Efecto visual de meditación */}
        <div className="absolute inset-0 bg-cyan-900/10 animate-pulse pointer-events-none" />
        
        <div className="z-10 bg-stone-900/90 border border-cyan-800/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center max-w-lg w-full">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyan-950 flex items-center justify-center border-2 border-cyan-500/50 animate-spin-slow">
            <Flame className="w-12 h-12 text-cyan-400" />
          </div>
          
          <h2 className="font-cinzel text-3xl text-cyan-100 mb-2">Meditando</h2>
          <p className="text-cyan-500/80 text-sm mb-8">
            {meditationLocation === 'private' 
              ? 'Te encuentras seguro en tu cámara de cultivo.' 
              : '¡Estás en el mundo abierto, expuesto a peligros!'}
          </p>

          {/* Barra de CB */}
          <div className="mb-2 flex justify-between text-xs font-mono text-cyan-300">
            <span>Cultivo Base (CB)</span>
            <span>{cb_actual} / {cb_requerido}</span>
          </div>
          <div className="w-full bg-stone-950 h-4 rounded-full overflow-hidden border border-cyan-900 mb-2">
            <div 
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full transition-all duration-500" 
              style={{ width: `${porcentajeProgreso}%` }} 
            />
          </div>
          <p className="text-xs text-stone-500 mb-8">+{gananciaPorTick} CB cada 5 segundos</p>

          <button 
            onClick={stopMeditation}
            className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg font-bold transition-colors w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" /> Detener Meditación
          </button>
        </div>
      </div>
    );
  }

  // 2. MENÚ DE INICIO DE MEDITACIÓN
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-8 max-w-2xl w-full">
        <h2 className="font-cinzel text-3xl text-amber-100 mb-2">Cámara de Cultivo</h2>
        <p className="text-sm text-stone-400 mb-8">
          Siente el Qi del cosmos fluir hacia tu Dantian. La meditación es la única forma de acumular Cultivo Base (CB) para romper los cuellos de botella de tu reino.
        </p>

        {showWarning ? (
          <div className="bg-rose-950/40 border border-rose-600/50 p-6 rounded-xl text-center animate-in fade-in">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-rose-200 mb-2">¡Peligro Inminente!</h3>
            <p className="text-sm text-rose-300/80 mb-6">
              Meditar en el mundo abierto te deja indefenso. Bestias o cultivadores rivales pueden atacarte y romper tu concentración. ¿Estás seguro?
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowWarning(false)} className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg cursor-pointer">Cancelar</button>
              <button onClick={() => startMeditation('world')} className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg cursor-pointer">Aceptar el Riesgo</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => startMeditation('private')}
              className="p-6 bg-stone-950 border border-emerald-900/50 hover:border-emerald-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <Zap className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-emerald-100 mb-1">Cámara Privada</h3>
              <p className="text-xs text-stone-400">100% Seguro. Nadie puede interrumpir tu cultivo. Ideal para sesiones largas.</p>
            </button>

            <button 
              onClick={() => setShowWarning(true)}
              className="p-6 bg-stone-950 border border-rose-900/50 hover:border-rose-500 rounded-xl text-left transition-all group cursor-pointer"
            >
              <ShieldAlert className="w-8 h-8 text-rose-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-rose-100 mb-1">Mundo Abierto</h3>
              <p className="text-xs text-stone-400">Rápido, pero peligroso. Puedes ser atacado si no tienes protección.</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
