import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { Dices, Shield, Sparkles, BookOpen, Skull, ArrowRight } from 'lucide-react';

export const CreationPage = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Xiao Feng');
  const [lineage, setLineage] = useState('Plebeyo');
  const [origin, setOrigin] = useState('Errante');
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const navigate = useNavigate();

  const handleCreate = () => {
    // Aquí luego llamarás al servidor (POST /api/player/create)
    // Simulamos el resultado del servidor
    setPlayer({ 
      playerId: `player_${Date.now()}`, 
      name, 
      realm: 'Refinamiento de Qi' 
    });
    navigate('/hub');
  };

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-stone-900/90 border border-amber-900/30 rounded-xl p-8">
        
        {/* Barra de Progreso */}
        <div className="flex justify-between mb-8 pb-4 border-b border-stone-800">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-amber-400' : 'text-stone-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= s ? 'border-amber-400 bg-amber-950/50' : 'border-stone-700'}`}>
                {s}
              </div>
              <span className="text-xs font-cinzel hidden sm:block">
                {s === 1 ? 'Identidad' : s === 2 ? 'Innato' : s === 3 ? 'Historia' : 'Confirmar'}
              </span>
            </div>
          ))}
        </div>

        {/* PASO 1: Identidad */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="font-cinzel text-2xl text-amber-100">Paso 1: Identidad</h2>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Nombre del Cultivador</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-stone-950 border border-stone-700 rounded-lg text-amber-200" 
                />
                <button onClick={() => setName('Li Chen')} className="px-3 bg-stone-800 rounded-lg text-amber-400">
                  <Dices className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-2">Linaje</label>
              <div className="grid grid-cols-2 gap-2">
                {['Noble', 'Plebeyo', 'Hijo de Secta', 'Desconocido'].map(l => (
                  <button key={l} onClick={() => setLineage(l)} className={`p-3 rounded-lg border text-sm ${lineage === l ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded-lg flex items-center gap-2">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Innato (Simulado) */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="font-cinzel text-2xl text-amber-100">Paso 2: Lo Innato</h2>
            <p className="text-sm text-stone-400">El Cielo ha tirado los dados por ti. Estos son tus dones al nacer:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1"><Shield className="w-4 h-4" /> Físicos Únicos</h4>
                <ul className="text-xs text-stone-300 space-y-1">
                  <li>• Huesos de Dragón (Fuerza +10)</li>
                  <li>• Ojos del Vacío (Percepción +5)</li>
                  <li>• Médula de Jade (Espíritu +10)</li>
                </ul>
              </div>
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><Sparkles className="w-4 h-4" /> Providencias</h4>
                <ul className="text-xs text-stone-300 space-y-1">
                  <li>• Estrella de la Fortuna (Suerte +5)</li>
                  <li>• Mente del Sabio (EXP +10%)</li>
                  <li>• Protegido por el Cielo</li>
                </ul>
              </div>
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1"><Skull className="w-4 h-4" /> Cicatriz</h4>
                <p className="text-xs text-stone-300">Traición: Fuiste vendido por tu propio hermano de sangre.</p>
              </div>
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800">
                <h4 className="text-xs font-bold text-cyan-400 mb-2 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Juramento</h4>
                <p className="text-xs text-stone-300">Venganza: No descansarás hasta encontrar al traidor.</p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-stone-400 hover:text-white">Volver</button>
              <button onClick={() => setStep(3)} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded-lg">Aceptar</button>
            </div>
          </div>
        )}

        {/* PASO 3: Origen */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="font-cinzel text-2xl text-amber-100">Paso 3: Origen y Punto de Partida</h2>
            <p className="text-sm text-stone-400">Esto define tus contactos, equipo inicial y secta.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Errante', 'Discípulo Externo', 'Hijo de Clan Noble', 'Mercader', 'Forjador', 'Erudito'].map(o => (
                <button key={o} onClick={() => setOrigin(o)} className={`p-4 rounded-lg border text-center ${origin === o ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                  {o}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="text-stone-400 hover:text-white">Volver</button>
              <button onClick={() => setStep(4)} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded-lg">Revisar</button>
            </div>
          </div>
        )}

        {/* PASO 4: Confirmar */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in text-center">
            <h2 className="font-cinzel text-3xl text-amber-100 mb-4">Forjar Sendero</h2>
            <div className="inline-block bg-stone-950 border border-stone-800 p-6 rounded-xl text-left text-sm space-y-2 mb-6">
              <div><span className="text-stone-500">Nombre:</span> <span className="text-amber-200 font-bold">{name}</span></div>
              <div><span className="text-stone-500">Linaje:</span> {lineage}</div>
              <div><span className="text-stone-500">Origen:</span> {origin}</div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => setStep(3)} className="px-6 py-3 text-stone-400 hover:text-white">Volver</button>
              <button onClick={handleCreate} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-cinzel font-bold text-lg rounded-lg shadow-lg">
                Comenzar Sendero Inmortal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};