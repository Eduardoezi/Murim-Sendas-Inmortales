import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../core/store/usePlayerStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import { Dices, Shield, Swords, ArrowRight, Skull, Crown, Store, Sparkles } from 'lucide-react';
import { generateRandomName } from '../../core/utils/nameGenerator';
import { CultivatorAttributes, PlayerAppearance } from '../../types/player.types';
import { generateBackstory, CharacterData } from '../../core/utils/storyGenerator';
import { CharacterCustomizer } from '../components/CharacterCustomizer';

const SECTS = ['Secta de la Espada Celestial', 'Monasterio del Loto de Jade', 'Pabellón del Fuego Carmesí'];
const CLANS = ['Clan Gu del Fénix', 'Clan Lin del Dragón de Jade', 'Clan Namgung'];
const CULTS = ['Culto de la Sangre Asura', 'Secta del Alma Abismal'];
const WEAPONS = ['Espada de Madera de Melocotonero', 'Lanza de Hierro Frío', 'Sable de Acero Negro'];
const GUILDS = ['Gremio Mercante del Mar del Este', 'Ciudad Capital de Chang\'an', 'Gremio de Alquimistas'];

export const CreationPage = () => {
  const [step, setStep] = useState(1);
  const setPlayer = usePlayerStore((state) => state.setPlayer);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  // --- ESTADOS DEL FORMULARIO ---
  const [gender, setGender] = useState<'Hombre' | 'Mujer'>('Hombre');
  const [name, setName] = useState(generateRandomName('male'));
  const [birthDate, setBirthDate] = useState('2000-01-01');
  const [appearance, setAppearance] = useState<PlayerAppearance | null>(null);
  
  const [alignment, setAlignment] = useState<'Ortodoxo' | 'Heterodoxo' | 'Demoníaco'>('Ortodoxo');
  const [originType, setOriginType] = useState<'Discípulo' | 'Errante' | 'Noble' | 'Demoníaco' | 'Plebeyo'>('Errante');
  const [originDetail, setOriginDetail] = useState<string>(WEAPONS[0]);

  // --- DATOS OCULTOS (INNATOS) ---
  const [finalStats, setFinalStats] = useState<CultivatorAttributes | null>(null);
  const [innateData, setInnateData] = useState<CharacterData | null>(null);

  const handleChangeGender = (g: 'Hombre' | 'Mujer') => {
    setGender(g);
    setName(generateRandomName(g === 'Hombre' ? 'male' : 'female'));
  };

  // PASO 3: TIRADA DE DADOS INNATA
  const handleRollDestiny = () => {
    const randomPhysique = ['Ojos del Vacío', 'Huesos de Dragón', 'Venas de Jade', 'Médula de Fénix'][Math.floor(Math.random() * 4)];
    const randomScar = ['la traición de tu hermano de sangre', 'el asesinato de tu maestro', 'la quema de tu aldea', 'el abandono en tierras heladas'][Math.floor(Math.random() * 4)];
    const randomOath = ['vengar a los caídos', 'encontrar la verdad prohibida', 'restaurar el honor de tu familia', 'romper el Sello del Caos'][Math.floor(Math.random() * 4)];

    const stats: CultivatorAttributes = {
      fuerza: 10 + Math.floor(Math.random() * 8),
      destreza: 10 + Math.floor(Math.random() * 8),
      constitucion: 10 + Math.floor(Math.random() * 8),
      inteligencia: 10 + Math.floor(Math.random() * 8),
      percepcion: 10 + Math.floor(Math.random() * 8),
      astucia: 10 + Math.floor(Math.random() * 8),
      voluntad: 10 + Math.floor(Math.random() * 8),
      suerte: 10 + Math.floor(Math.random() * 8),
      carisma: 10 + Math.floor(Math.random() * 8),
      sabiduria: 10 + Math.floor(Math.random() * 8),
    };

    setFinalStats(stats);
    setInnateData({
      name,
      gender,
      lineage: originType === 'Noble' ? 'Noble' : 'Común',
      origin: originType,
      faction: originType !== 'Errante' ? originDetail : undefined,
      weapon: originType === 'Errante' ? originDetail : undefined,
      physique: randomPhysique,
      scar: randomScar,
      oath: randomOath
    });
    
    setStep(4);
  };

  // PASO 4: GUARDAR EN BASE DE DATOS Y ENTRAR
  const handleCreate = async () => {
    if (!finalStats || !innateData) return;

    try {
      const res = await fetch('/api/player/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: `player_${Date.now()}`,
          name,
          gender,
          birth_date: birthDate,
          origin: originType,
          faction: originDetail,
          alignment: alignment,
          appearance_json: appearance,
          stats_json: finalStats
        })
      });

      const data = await res.json();
      if (data.success) {
        const calculatedHp = 50 + (finalStats.constitucion * 12);
        
      setPlayer({ 
          playerId: `player_${Date.now()}`, // O el ID real que devuelva el backend
          name, 
          gender,
          birthdate: birthDate,
          attributes: finalStats,
          hp: calculatedHp,
          maxHp: calculatedHp,
          qi: 50,
          maxQi: 100,
          realmName: 'Refinamiento de Qi (Etapa 1)'
        });
        navigate('/hub');
      } else {
        alert('Error al crear personaje: ' + data.message);
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Renderizado dinámico del Origen
  const renderOriginOptions = () => {
    let title = '';
    let options: string[] = [];
    let Icon = Swords;

    switch (originType) {
      case 'Discípulo': title = 'Elige tu Secta'; options = SECTS; Icon = Shield; break;
      case 'Errante': title = 'Elige tu Arma'; options = WEAPONS; Icon = Swords; break;
      case 'Noble': title = 'Elige tu Clan'; options = CLANS; Icon = Crown; break;
      case 'Demoníaco': title = 'Elige tu Culto'; options = CULTS; Icon = Skull; break;
      case 'Plebeyo': title = 'Elige tu Gremio o Ciudad'; options = GUILDS; Icon = Store; break;
    }

    return (
      <div className="mt-6 animate-in fade-in">
        <h3 className="font-cinzel text-lg text-amber-200 mb-3 flex items-center gap-2">
          <Icon className="w-5 h-5" /> {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {options.map(opt => (
            <button 
              key={opt} 
              onClick={() => setOriginDetail(opt)} 
              className={`p-4 rounded-lg border text-sm transition-all cursor-pointer ${originDetail === opt ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#05070c] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl bg-stone-900/90 border border-amber-900/30 rounded-xl p-8 backdrop-blur-md shadow-2xl">
        
        {/* Barra de Progreso (4 Pasos) */}
        <div className="flex justify-between mb-8 pb-4 border-b border-stone-800">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-amber-400' : 'text-stone-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${step >= s ? 'border-amber-400 bg-amber-950/50' : 'border-stone-700'}`}>
                {s}
              </div>
              <span className="text-xs font-cinzel hidden sm:block">
                {s === 1 ? 'Identidad' : s === 2 ? 'Origen' : s === 3 ? 'Lo Innato' : 'Historia'}
              </span>
            </div>
          ))}
        </div>

        {/* PASO 1: IDENTIDAD Y CUSTOMIZACIÓN */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="font-cinzel text-2xl text-amber-100">Identidad del Cultivador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Género</label>
                <div className="flex gap-2">
                  <button onClick={() => handleChangeGender('Hombre')} className={`flex-1 p-2 rounded-lg border text-sm cursor-pointer ${gender === 'Hombre' ? 'border-amber-500 bg-amber-950/30 text-amber-200' : 'border-stone-800 text-stone-500'}`}>Hombre</button>
                  <button onClick={() => handleChangeGender('Mujer')} className={`flex-1 p-2 rounded-lg border text-sm cursor-pointer ${gender === 'Mujer' ? 'border-amber-500 bg-amber-950/30 text-amber-200' : 'border-stone-800 text-stone-500'}`}>Mujer</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Fecha de Nacimiento (BaZi)</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-200" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Nombre</label>
              <div className="flex gap-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-3 bg-stone-950 border border-stone-700 rounded-lg text-amber-200 font-cinzel text-lg" />
                <button onClick={() => setName(generateRandomName(gender === 'Hombre' ? 'male' : 'female'))} className="px-4 bg-stone-800 hover:bg-stone-700 rounded-lg text-amber-400 transition-colors cursor-pointer">
                  <Dices className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* CUSTOMIZADOR */}
            <div className="pt-4 border-t border-stone-800">
              <h3 className="font-cinzel text-xl text-amber-100 text-center mb-4">Forja tu Apariencia Mortal</h3>
              <CharacterCustomizer onAppearanceChange={setAppearance} />
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg flex items-center gap-2 cursor-pointer">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: ALINEACIÓN Y ORIGEN */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="font-cinzel text-2xl text-amber-100">Alineación Filosófica y Origen</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { id: 'Ortodoxo', icon: Shield, title: 'Ortodoxo', desc: 'Reglas, honor y justicia.' },
                { id: 'Heterodoxo', icon: Swords, title: 'Heterodoxo', desc: 'Bandidos y rebeldes.' },
                { id: 'Demoníaco', icon: Skull, title: 'Demoníaco', desc: 'Libertad y moral propia.' }
              ].map((faction) => (
                <button 
                  key={faction.id}
                  onClick={() => { setAlignment(faction.id as any); setOriginType('Errante'); setOriginDetail(''); }}
                  className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${alignment === faction.id ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}
                >
                  <faction.icon className={`w-8 h-8 mb-2 ${alignment === faction.id ? 'text-amber-400' : 'text-stone-500'}`} />
                  <h4 className="font-bold text-sm mb-1">{faction.title}</h4>
                  <p className="text-[10px] leading-tight">{faction.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(['Discípulo', 'Errante', 'Noble', 'Demoníaco', 'Plebeyo'] as const).map(o => (
                <button 
                  key={o} 
                  onClick={() => { setOriginType(o); setOriginDetail(''); }} 
                  className={`p-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${originType === o ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}
                >
                  {o}
                </button>
              ))}
            </div>
            
            {renderOriginOptions()}

            <div className="flex justify-between pt-6 border-t border-stone-800">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-stone-400 hover:text-white cursor-pointer">Volver</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!originDetail}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-lg cursor-pointer"
              >
                Consultar los Cielos
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: LO INNATO (DADOS) */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in text-center">
            <h2 className="font-cinzel text-3xl text-amber-100 mb-2">El Cielo guarda silencio...</h2>
            <p className="text-sm text-stone-400 mb-8 max-w-lg mx-auto">
              Has elegido tu camino. Ahora, los cielos tirarán los dados para determinar los dones con los que naciste: tu Físico Único, tu Providencia Innata, tu Cicatriz y tu Juramento. Estos definirán tu destino.
            </p>
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-amber-950/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-12 h-12 text-amber-500" />
            </div>
            <button onClick={handleRollDestiny} className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-cinzel font-bold text-lg rounded-lg shadow-xl hover:scale-105 transition-all cursor-pointer">
              Tirar los Dados del Destino
            </button>
          </div>
        )}

        {/* PASO 4: HISTORIA Y FICHA */}
        {step === 4 && innateData && finalStats && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center mb-4">
              <h2 className="font-cinzel text-3xl text-amber-100 mb-2">Tu Historia Comienza</h2>
            </div>
            
            <div className="bg-[#0a0d14] border border-stone-800 p-6 rounded-xl shadow-inner text-left">
              <p className="text-stone-300 leading-relaxed italic text-sm md:text-base whitespace-pre-wrap font-serif">
                {generateBackstory(innateData)}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(finalStats).map(([key, val]) => (
                <div key={key} className="bg-stone-900 border border-stone-800 p-3 rounded-lg text-center">
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider">{key}</div>
                  <div className="text-xl font-bold text-amber-400 font-mono">{Number(val)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-6 text-sm bg-stone-900/50 p-4 rounded-lg border border-stone-800">
              <div className="text-center">
                <span className="block text-xs text-stone-500">Reino Actual</span>
                <span className="font-bold text-cyan-400">Refinamiento de Qi (Etapa 1)</span>
              </div>
              <div className="text-center">
                <span className="block text-xs text-stone-500">Salud (HP)</span>
                <span className="font-bold text-rose-400">{50 + (finalStats.constitucion * 12)}</span>
              </div>
              <div className="text-center">
                <span className="block text-xs text-stone-500">Energía (Qi)</span>
                <span className="font-bold text-amber-400">50 / 100</span>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button onClick={handleCreate} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-cinzel font-bold text-xl rounded-lg shadow-xl hover:scale-105 transition-all cursor-pointer">
                Comenzar Sendero Inmortal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};