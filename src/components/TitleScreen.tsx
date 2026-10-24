import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CharacterClass } from '../types/game';
import { CHARACTER_CLASSES, SECTS_LIST } from '../data/gameData';
import { Shield, Sparkles, Feather, Zap, Compass, Dices, Skull, BookOpen, ArrowRight, LogOut, Loader2 } from 'lucide-react';

interface SavedPlayer {
  id: string;
  name: string;
  classType: CharacterClass;
  realm: string;
  subRealm: number;
  sectId: string;
  updatedAt: number;
}

export const TitleScreen: React.FC = () => {
  // Extraemos authError y authLoading
  const { createSyntacticCharacter, loadSavedCharacter, token, logout, authError, authLoading } = useGame();
  
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('Xiao Feng');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [selectedSect, setSelectedSect] = useState<string>(SECTS_LIST[0].id);
  
  const [destinyRoll, setDestinyRoll] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);

  const [background, setBackground] = useState('Errante');
  const [lineage, setLineage] = useState('Plebeyo');
  const [affinity, setAffinity] = useState('Ortodoxo');

  useEffect(() => {
    if (!token) return;
    
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && data.user.characters && data.user.characters.length > 0) {
          setSavedPlayers(data.user.characters);
        } else {
          setShowCreateForm(true);
        }
      })
      .catch((err) => {
        console.error('Error cargando personajes:', err);
        setShowCreateForm(true);
      });
  }, [token]);

  const handleRollDestiny = async () => {
    setIsRolling(true);
    try {
      const res = await fetch('/api/player/roll', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDestinyRoll(data.roll);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRolling(false);
    }
  };

  const handleCreate = () => {
    if (!destinyRoll || !token) return;
    createSyntacticCharacter({ name, classType: selectedClass, sectId: selectedSect, rollData: destinyRoll, background, lineage, affinity });
  };

  const handleResume = async (playerId: string) => {
    if (!token) return;
    setLoadingPlayerId(playerId);
    try {
      const res = await fetch(`/api/player/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.player) {
        loadSavedCharacter(data.player);
      } else {
        alert(data.message || 'Error al cargar el cultivador.');
      }
    } catch (err) {
      console.error('Error al cargar cultivador:', err);
    } finally {
      setLoadingPlayerId(null);
    }
  };

  const classIcons = { warrior: Shield, rogue: Feather, scholar: Sparkles, archer: Zap, lancer: Compass };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#05070c] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/src/assets/images/murim_hero_landscape_1792518333064.jpg" alt="Fondo" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-4xl py-8 flex flex-col items-center">
        <div className="w-full flex justify-end mb-4">
          <button onClick={logout} className="flex items-center gap-2 text-xs text-stone-400 hover:text-rose-400 transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-amber-100 mb-2">Murim: Sendas Inmortales</h1>
          <p className="text-stone-400 text-sm">Forja tu destino en el Jianghu.</p>
        </div>

        {savedPlayers.length > 0 && !showCreateForm && (
          <div className="w-full bg-stone-900/90 border border-amber-900/40 rounded-xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800">
              <h2 className="font-cinzel text-lg font-bold text-amber-100">Tus Cultivadores</h2>
              <button onClick={() => { setShowCreateForm(true); setStep(1); }} className="px-3 py-1.5 bg-amber-600 text-stone-950 font-bold rounded-lg text-xs cursor-pointer hover:bg-amber-500 transition-colors">
                Nuevo Cultivador
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedPlayers.map((player) => (
                <div key={player.id} onClick={() => handleResume(player.id)} className={`p-4 bg-stone-950/70 border border-stone-800 rounded-xl hover:border-amber-500 cursor-pointer flex justify-between items-center transition-colors ${loadingPlayerId === player.id ? 'opacity-50 animate-pulse' : ''}`}>
                  <div>
                    <div className="font-bold text-amber-200">{player.name}</div>
                    <div className="text-xs text-stone-400">{player.realm} · {SECTS_LIST.find(s=>s.id===player.sectId)?.name || 'Vagabundo'}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="w-full bg-stone-900/90 border border-amber-900/30 rounded-xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`flex items-center gap-2 ${step >= s ? 'text-amber-400' : 'text-stone-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${step >= s ? 'border-amber-400 bg-amber-950/50' : 'border-stone-700 bg-stone-900'}`}>
                    {s}
                  </div>
                  <span className="text-xs font-cinzel hidden sm:block">
                    {s === 1 ? 'Destino' : s === 2 ? 'Psique' : s === 3 ? 'Trasfondo' : 'Confirmar'}
                  </span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">Nombre del Cultivador</label>
                    <div className="flex gap-2">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-200" maxLength={24} />
                      <button onClick={() => {
                        const names = ['Li Chen', 'Meng Hao', 'Xiao Yan', 'Yun Che', 'Tang San', 'Ye Fan', 'Jian Long'];
                        setName(names[Math.floor(Math.random() * names.length)]);
                      }} className="px-3 bg-stone-800 hover:bg-stone-700 rounded-lg text-amber-400 transition-colors" title="Nombre Aleatorio">
                        <Dices className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">Secta de Iniciación</label>
                    <select value={selectedSect} onChange={(e) => setSelectedSect(e.target.value)} className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-amber-200">
                      {SECTS_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-2">Arquetipo Marcial</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(Object.keys(CHARACTER_CLASSES) as CharacterClass[]).map((clsKey) => {
                      const cls = CHARACTER_CLASSES[clsKey];
                      const Icon = classIcons[clsKey];
                      const isSelected = selectedClass === clsKey;
                      return (
                        <button key={clsKey} onClick={() => setSelectedClass(clsKey)} className={`p-3 rounded-lg border text-left cursor-pointer transition ${isSelected ? 'bg-amber-950/60 border-amber-500' : 'bg-stone-950/60 border-stone-800 hover:border-stone-600'}`}>
                          <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                          <div className="text-xs font-bold text-stone-200">{cls.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button onClick={handleRollDestiny} disabled={isRolling || !name.trim()} className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-sm uppercase rounded-lg shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer transition-all">
                    {isRolling ? 'Consultando los Cielos...' : 'Tirar los Dados del Destino'} <Dices className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && destinyRoll && (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center mb-6">
                  <h3 className="font-cinzel text-xl text-amber-200">El Cielo ha hablado</h3>
                  <p className="text-xs text-stone-400">Revisa las marcas de tu nacimiento y tu alma.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-400 uppercase mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Físicos Únicos</h4>
                    <ul className="space-y-2 text-xs text-stone-300">
                      {destinyRoll.physiques?.map((p: any, i: number) => <li key={i}>• <span className="text-amber-200 font-semibold">{p.name}:</span> {p.description}</li>)}
                    </ul>
                  </div>
                  <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Providencias Innatas</h4>
                    <ul className="space-y-2 text-xs text-stone-300">
                      {destinyRoll.providences?.map((p: any, i: number) => <li key={i}>• <span className="text-emerald-200 font-semibold">{p.name}:</span> {p.description}</li>)}
                    </ul>
                  </div>
                  <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-rose-400 uppercase mb-3 flex items-center gap-2"><Skull className="w-4 h-4" /> Cicatrices del Alma</h4>
                    <ul className="space-y-2 text-xs text-stone-300">
                      {destinyRoll.scars?.map((s: string, i: number) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Juramentos</h4>
                    <ul className="space-y-2 text-xs text-stone-300">
                      {destinyRoll.oaths?.map((o: string, i: number) => <li key={i}>• {o}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-800">
                  <button onClick={() => setStep(1)} className="px-4 py-2 text-stone-400 hover:text-white transition-colors">Volver</button>
                  <button onClick={() => setStep(3)} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded-lg hover:bg-amber-500 transition-colors">Aceptar Destino</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">Linaje</label>
                    <div className="space-y-2">
                      {['Noble', 'Plebeyo'].map(l => (
                        <button key={l} onClick={() => setLineage(l)} className={`w-full p-3 text-left rounded-lg border text-xs transition-colors ${lineage === l ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">Afinidad</label>
                    <div className="space-y-2">
                      {['Ortodoxo', 'Heterodoxo', 'Demoniaco'].map(a => (
                        <button key={a} onClick={() => setAffinity(a)} className={`w-full p-3 text-left rounded-lg border text-xs transition-colors ${affinity === a ? 'bg-amber-950/60 border-amber-500 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400'}`}>{a}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">Trasfondo</label>
                    <select value={background} onChange={(e) => setBackground(e.target.value)} className="w-full p-3 bg-stone-950 border border-stone-800 rounded-lg text-xs text-amber-200">
                      {['Errante', 'Discípulo Externo', 'Hijo de Clan Noble', 'Hijo de Realeza', 'Mercader', 'Forjador', 'Erudito'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between pt-6 border-t border-stone-800">
                  <button onClick={() => setStep(2)} className="px-4 py-2 text-stone-400 hover:text-white transition-colors">Volver</button>
                  <button onClick={() => setStep(4)} className="px-6 py-2 bg-amber-600 text-stone-950 font-bold rounded-lg hover:bg-amber-500 transition-colors">Siguiente</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in text-center">
                <h3 className="font-cinzel text-2xl text-amber-100">Forjar Sendero</h3>
                <p className="text-sm text-stone-400 max-w-md mx-auto">Estás a punto de iniciar tu camino en el Jianghu. Tus decisiones y el destino marcado por los cielos te esperan.</p>
                
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl inline-block text-left text-xs space-y-1 mb-4">
                  <div><span className="text-stone-500">Nombre:</span> <span className="text-amber-200 font-bold">{name}</span></div>
                  <div><span className="text-stone-500">Secta:</span> {SECTS_LIST.find(s=>s.id===selectedSect)?.name}</div>
                  <div><span className="text-stone-500">Linaje:</span> {lineage} ({affinity})</div>
                  <div><span className="text-stone-500">Trasfondo:</span> {background}</div>
                </div>

                {/* AQUI MOSTRAMOS EL ERROR DEL SERVIDOR SI EXISTE */}
                {authError && (
                  <div className="mb-4 p-3 bg-rose-950/50 border border-rose-900/50 rounded-lg text-rose-200 text-sm font-semibold text-center w-full max-w-md mx-auto">
                    ⚠️ {authError}
                  </div>
                )}

                <div className="flex justify-center gap-4 pt-4">
                  <button onClick={() => setStep(3)} disabled={authLoading} className="px-6 py-2 text-stone-400 hover:text-white transition-colors disabled:opacity-50">Volver</button>
                  <button 
                    onClick={handleCreate} 
                    disabled={authLoading}
                    className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-cinzel font-bold rounded-lg shadow-xl hover:from-amber-400 hover:to-amber-500 text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[280px]"
                  >
                    {authLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> FORJANDO DESTINO...</>
                    ) : (
                      'COMENZAR SENDERO INMORTAL'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};