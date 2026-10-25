import { useState } from 'react';
import { PlayerAppearance } from '../../types/player.types';
import { User, Scissors, Eye, Smile, Shirt, Crown, Sparkles } from 'lucide-react';

interface CustomizerProps {
  onAppearanceChange: (appearance: PlayerAppearance) => void;
}

const TABS = [
  { id: 'hair', icon: Scissors, label: 'Cabello' },
  { id: 'eyes', icon: Eye, label: 'Ojos' },
  { id: 'face', icon: Smile, label: 'Rostro' }, // Cejas, boca, nariz
  { id: 'outfit', icon: Shirt, label: 'Túnica' },
  { id: 'accessory', icon: Crown, label: 'Accesorios' },
];

export const CharacterCustomizer = ({ onAppearanceChange }: CustomizerProps) => {
  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinTone: '#f5d0a9',
    hairStyle: 0,
    hairColor: '#1a1a1a',
    eyeType: 0,
    eyeColor: '#4a2511',
    eyebrowType: 0,
    mouthType: 0,
    noseType: 0,
    outfitColor: '#2d4a22',
    accessoryType: 0,
  });

  const [activeTab, setActiveTab] = useState('hair');

  const updateAppearance = (key: keyof PlayerAppearance, value: string | number) => {
    const newAppearance = { ...appearance, [key]: value };
    setAppearance(newAppearance);
    onAppearanceChange(newAppearance);
  };

  // Paletas de colores
  const skinTones = ['#f5d0a9', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
  const hairColors = ['#1a1a1a', '#4a2511', '#a52a2a', '#d3d3d3', '#ffffff'];
  const eyeColors = ['#4a2511', '#2e8b57', '#4682b4', '#8b0000', '#800080'];
  const outfitColors = ['#2d4a22', '#1a2a40', '#4a1a1a', '#4a3a1a', '#2a1a40'];

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-stone-900/80 p-6 rounded-xl border border-stone-800 shadow-2xl">
      
      {/* --- COLUMNA IZQUIERDA: VISOR DEL PERSONAJE (PAPERDOLL) --- */}
      <div className="w-full md:w-1/2 flex flex-col items-center">
        <div className="relative w-64 h-80 bg-gradient-to-b from-stone-800 to-stone-950 rounded-xl border-2 border-amber-900/50 overflow-hidden flex items-end justify-center shadow-inner">
          
          {/* Fondo de la escena */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-800/50 via-stone-900 to-black pointer-events-none" />

          {/* CAPA 1: Cuerpo / Túnica */}
          <div 
            className="absolute bottom-0 w-56 h-40 rounded-t-[60%] transition-colors duration-300 z-10"
            style={{ backgroundColor: appearance.outfitColor }}
          />

          {/* CAPA 2: Cuello */}
          <div className="absolute bottom-36 w-14 h-12 rounded-sm z-20 transition-colors duration-300" style={{ backgroundColor: appearance.skinTone }} />

          {/* CAPA 3: Rostro Base */}
          <div 
            className="absolute bottom-40 w-36 h-44 rounded-[45%] transition-colors duration-300 shadow-inner z-20"
            style={{ backgroundColor: appearance.skinTone }}
          >
            {/* Capa: Cejas */}
            <div className={`absolute top-12 left-6 w-8 h-2 rounded-full transition-all bg-stone-900 ${appearance.eyebrowType === 0 ? 'rotate-0' : appearance.eyebrowType === 1 ? 'rotate-12' : '-rotate-12'}`} />
            <div className={`absolute top-12 right-6 w-8 h-2 rounded-full transition-all bg-stone-900 ${appearance.eyebrowType === 0 ? 'rotate-0' : appearance.eyebrowType === 1 ? '-rotate-12' : 'rotate-12'}`} />

            {/* Capa: Ojos */}
            <div className="absolute top-16 left-6 w-8 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden border border-stone-300">
              <div className={`rounded-full transition-all duration-300 ${appearance.eyeType === 0 ? 'w-4 h-4' : 'w-4 h-3'}`} style={{ backgroundColor: appearance.eyeColor }} />
            </div>
            <div className="absolute top-16 right-6 w-8 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden border border-stone-300">
              <div className={`rounded-full transition-all duration-300 ${appearance.eyeType === 0 ? 'w-4 h-4' : 'w-4 h-3'}`} style={{ backgroundColor: appearance.eyeColor }} />
            </div>

            {/* Capa: Nariz */}
            <div className={`absolute top-24 left-1/2 -translate-x-1/2 transition-all duration-300 bg-stone-400/30 ${appearance.noseType === 0 ? 'w-2 h-4 rounded-full' : 'w-6 h-2 rounded-full'}`} />

            {/* Capa: Boca */}
            <div className={`absolute top-32 left-1/2 -translate-x-1/2 transition-all duration-300 bg-rose-800/60 ${appearance.mouthType === 0 ? 'w-8 h-1 rounded-full' : 'w-6 h-2 rounded-b-full'}`} />
          </div>

          {/* CAPA 4: Cabello */}
          <div 
            className="absolute w-40 transition-all duration-300 z-30 pointer-events-none"
            style={{ 
              backgroundColor: appearance.hairColor,
              // Damos forma de casquete en la parte superior y patillas laterales
              borderRadius: appearance.hairStyle === 1 ? '50% 50% 10% 10%' : '40% 40% 20% 20%',
              height: appearance.hairStyle === 1 ? '80px' : '60px',
              top: appearance.hairStyle === 1 ? '-15px' : '5px', // Subimos el pelo para que no tape los ojos
            }} 
          />
          {/* Coleta (si estilo 1) */}
          {appearance.hairStyle === 1 && (
            <div 
              className="absolute right-8 w-10 h-40 rounded-b-full transition-colors duration-300 z-20" 
              style={{ backgroundColor: appearance.hairColor, top: '40px' }} 
            />
          )}
          {/* Patillas laterales (para darle forma) */}
          <div className="absolute w-6 h-20 z-20" style={{ backgroundColor: appearance.hairColor, top: '50px', left: '10px', borderRadius: '50%' }} />
          <div className="absolute w-6 h-20 z-20" style={{ backgroundColor: appearance.hairColor, top: '50px', right: '10px', borderRadius: '50%' }} />
          {/* Coleta (si estilo 1) */}
          {appearance.hairStyle === 1 && (
            <div className="absolute bottom-24 right-10 w-10 h-40 rounded-b-full transition-colors duration-300 z-20" style={{ backgroundColor: appearance.hairColor }} />
          )}

          {/* CAPA 5: Accesorios (Coronas, Horquillas) */}
          {appearance.accessoryType === 1 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40">
              <Crown className="w-12 h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            </div>
          )}
          {appearance.accessoryType === 2 && (
            <div className="absolute top-20 right-16 z-40">
              <Sparkles className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            </div>
          )}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: PANEL DE CONTROL CON PESTAÑAS --- */}
      <div className="w-full md:w-1/2 flex flex-col justify-between">
        
        {/* Pestañas de Categoría */}
        <div className="flex gap-1 mb-6 bg-stone-950 p-1 rounded-lg border border-stone-800 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                  isActive ? 'bg-amber-950/60 text-amber-400 shadow-sm' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="space-y-5 flex-1">
          
          {activeTab === 'hair' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Estilo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(style => (
                    <button key={style} onClick={() => updateAppearance('hairStyle', style)} className={`py-2 rounded-lg border text-xs font-semibold transition-all ${appearance.hairStyle === style ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                      {style === 0 ? 'Recogido' : style === 1 ? 'Coleta' : 'Suelto'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Color</label>
                <div className="flex gap-2">
                  {hairColors.map(color => (
                    <button key={color} onClick={() => updateAppearance('hairColor', color)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.hairColor === color ? 'border-amber-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eyes' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Forma</label>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map(style => (
                    <button key={style} onClick={() => updateAppearance('eyeType', style)} className={`py-2 rounded-lg border text-xs font-semibold transition-all ${appearance.eyeType === style ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                      {style === 0 ? 'Redondos' : 'Afilados'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Color de Iris</label>
                <div className="flex gap-2">
                  {eyeColors.map(color => (
                    <button key={color} onClick={() => updateAppearance('eyeColor', color)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.eyeColor === color ? 'border-amber-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'face' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Cejas</label>
                <div className="flex gap-2">
                  {[0, 1, 2].map(style => (
                    <button key={style} onClick={() => updateAppearance('eyebrowType', style)} className={`px-3 py-1.5 rounded-lg border text-xs ${appearance.eyebrowType === style ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                    {style === 0 ? 'Rectas' : style === 1 ? 'Arqueadas' : 'Enfadadas'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Boca</label>
                <div className="flex gap-2">
                  {[0, 1].map(style => (
                    <button key={style} onClick={() => updateAppearance('mouthType', style)} className={`px-3 py-1.5 rounded-lg border text-xs ${appearance.mouthType === style ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>
                      {style === 0 ? 'Neutra' : 'Sonrisa'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Tono de Piel</label>
                <div className="flex gap-2">
                  {skinTones.map(color => (
                    <button key={color} onClick={() => updateAppearance('skinTone', color)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${appearance.skinTone === color ? 'border-amber-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outfit' && (
            <div className="space-y-4 animate-in fade-in">
              <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Color de Túnica (Alineación)</label>
              <div className="grid grid-cols-5 gap-2">
                {outfitColors.map(color => (
                  <button key={color} onClick={() => updateAppearance('outfitColor', color)} className={`h-10 rounded-lg border-2 transition-transform hover:scale-105 ${appearance.outfitColor === color ? 'border-amber-400 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'border-stone-700'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <p className="text-[10px] text-stone-500 text-center mt-2">Verde (Ortodoxo), Azul (Noble), Rojo (Heterodoxo), Marrón (Errante), Púrpura (Demoníaco)</p>
            </div>
          )}

          {activeTab === 'accessory' && (
            <div className="space-y-4 animate-in fade-in">
              <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">Tocados y Coronas</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updateAppearance('accessoryType', 0)} className={`py-2 rounded-lg border text-xs ${appearance.accessoryType === 0 ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>Ninguno</button>
                <button onClick={() => updateAppearance('accessoryType', 1)} className={`py-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${appearance.accessoryType === 1 ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}><Crown className="w-3 h-3"/> Corona</button>
                <button onClick={() => updateAppearance('accessoryType', 2)} className={`py-2 rounded-lg border text-xs flex items-center justify-center gap-1 ${appearance.accessoryType === 2 ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}><Sparkles className="w-3 h-3"/> Horquilla</button>
              </div>
            </div>
          )}
        </div>

        {/* Botón Random / Preset */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-between">
            <button onClick={() => {
                // Aleatoriedad rápida
                updateAppearance('hairStyle', Math.floor(Math.random() * 3));
                updateAppearance('outfitColor', outfitColors[Math.floor(Math.random() * outfitColors.length)]);
                updateAppearance('eyeColor', eyeColors[Math.floor(Math.random() * eyeColors.length)]);
            }} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition-colors">
                Aleatorio
            </button>
        </div>
      </div>
    </div>
  );
};