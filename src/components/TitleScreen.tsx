import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { CharacterClass } from '../types/game';
import { CHARACTER_CLASSES, SECTS_LIST } from '../data/gameData';
import { Shield, Sparkles, Feather, Zap, Compass, UserCheck, Trash2, PlusCircle, ArrowRight } from 'lucide-react';

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
  const { createCharacter, loadSavedCharacter } = useGame();
  const [name, setName] = useState('Xiao Feng');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [selectedSect, setSelectedSect] = useState<string>(SECTS_LIST[0].id);
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([]);
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/players')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedPlayers(data);
        } else {
          setShowCreateForm(true);
        }
      })
      .catch(() => {
        setShowCreateForm(true);
      });
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    createCharacter(name, selectedClass, selectedSect);
  };

  const handleResume = async (playerId: string) => {
    setLoadingPlayerId(playerId);
    try {
      const res = await fetch(`/api/player/${playerId}`);
      const data = await res.json();
      if (data.success && data.player) {
        loadSavedCharacter(data.player);
      }
    } catch (err) {
      console.error('Error al cargar cultivador:', err);
    } finally {
      setLoadingPlayerId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que deseas eliminar este cultivador de los anales de la inmortalidad?')) {
      return;
    }
    try {
      const res = await fetch(`/api/player/${playerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedPlayers((prev) => prev.filter((p) => p.id !== playerId));
        if (savedPlayers.length <= 1) {
          setShowCreateForm(true);
        }
      }
    } catch (err) {
      console.error('Error al borrar cultivador:', err);
    }
  };

  const classIcons = {
    warrior: Shield,
    rogue: Feather,
    scholar: Sparkles,
    archer: Zap,
    lancer: Compass,
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#05070c] overflow-hidden">
      {/* Background Hero Artwork */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/murim_hero_landscape_1792518333064.jpg"
          alt="Montañas Celestiales de Murim"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 filter brightness-75 scale-105 transition-transform duration-10000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#05070c_85%)]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl py-8 flex flex-col items-center">
        {/* Bespoke Header Lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2 text-xs uppercase tracking-[0.3em] text-amber-400 font-cinzel">
            <span>天地之道</span>
            <span>·</span>
            <span>Sendas del Dao y la Espada</span>
          </div>
          <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-amber-100 text-balance mb-3">
            Murim: Sendas Inmortales
          </h1>
          <p className="max-w-xl text-stone-400 text-sm mx-auto leading-relaxed">
            Forja tu destino en el Jianghu. Despierta los 8 meridianos de tu Dantian, domina las artes marciales elementales y lidera tu propia secta hacia la inmortalidad.
          </p>
        </div>

        {/* Saved Characters Banner (SQLite Authoritative) */}
        {savedPlayers.length > 0 && !showCreateForm && (
          <div className="w-full bg-stone-900/90 border border-amber-900/40 rounded-xl p-6 md:p-8 backdrop-blur-md shadow-2xl mb-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h2 className="font-cinzel text-lg font-bold text-amber-100">
                  Cultivadores Registrados en SQLite
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 rounded-lg text-xs text-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nuevo Cultivador</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {savedPlayers.map((player) => {
                const sect = SECTS_LIST.find((s) => s.id === player.sectId);
                const Icon = classIcons[player.classType] || Shield;
                const isLoading = loadingPlayerId === player.id;

                return (
                  <div
                    key={player.id}
                    onClick={() => !isLoading && handleResume(player.id)}
                    className="p-4 rounded-xl border border-stone-800 bg-stone-950/70 hover:border-amber-500/80 hover:bg-amber-950/20 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700/80 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-cinzel text-base font-bold text-stone-100 group-hover:text-amber-200 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-xs text-amber-400 font-mono">
                          {player.realm} · Nv.{player.subRealm}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {sect?.name || 'Vagabundo del Jianghu'} · {new Date(player.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, player.id)}
                        title="Borrar de la base de datos"
                        className="p-2 text-stone-500 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-stone-950 text-xs font-semibold flex items-center gap-1 group-hover:bg-amber-400 transition-colors cursor-pointer"
                      >
                        <span>{isLoading ? 'Cargando...' : 'Reanudar'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Character Creation Panel */}
        {(showCreateForm || savedPlayers.length === 0) && (
          <div className="w-full bg-stone-900/85 border border-amber-900/30 rounded-xl p-6 md:p-8 backdrop-blur-md shadow-2xl">
            {savedPlayers.length > 0 && (
              <div className="mb-4 pb-3 border-b border-stone-800 flex items-center justify-between">
                <span className="text-xs text-stone-400 font-mono">Creando un nuevo sendero en el Jianghu</span>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  ← Ver Cultivadores Guardados
                </button>
              </div>
            )}

            <form onSubmit={handleStart} className="space-y-6">
              {/* Daoist Name Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-2">
                  Nombre del Cultivador
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingresa tu apelativo en el Jianghu..."
                  maxLength={24}
                  required
                  className="w-full px-4 py-2.5 bg-stone-950/80 border border-stone-700/80 rounded-lg text-amber-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-medium text-sm transition-colors"
                />
              </div>

              {/* Class Selection: 3 Starters + 2 Advanced Specs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Elige tu Arquetipo Marcial
                  </span>
                  <span className="text-xs text-stone-400">
                    Afinidad elemental y bonificaciones de inicio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(Object.keys(CHARACTER_CLASSES) as CharacterClass[]).map((clsKey) => {
                    const cls = CHARACTER_CLASSES[clsKey];
                    const Icon = classIcons[clsKey];
                    const isSelected = selectedClass === clsKey;

                    return (
                      <button
                        key={clsKey}
                        type="button"
                        onClick={() => setSelectedClass(clsKey)}
                        className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-stone-500'}`} />
                          <span className="text-xs font-mono text-amber-400">{cls.startingElement}</span>
                        </div>
                        <div className="font-semibold text-xs text-stone-100">{cls.name}</div>
                        <div className="text-[11px] text-stone-400 mt-1 line-clamp-2 leading-snug">
                          {cls.role}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected class details banner */}
                <div className="mt-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-stone-300">
                    <span className="text-amber-400 font-semibold">Misión Exclusiva:</span>{' '}
                    {CHARACTER_CLASSES[selectedClass].exclusiveQuest}
                  </div>
                  <div className="text-stone-400 text-right whitespace-nowrap">
                    Ataque +{CHARACTER_CLASSES[selectedClass].bonusStats.attack} · Vitalidad +{CHARACTER_CLASSES[selectedClass].bonusStats.hp}
                  </div>
                </div>
              </div>

              {/* Starting Sect Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                    Secta de Iniciación
                  </span>
                  <span className="text-xs text-stone-400">
                    Facciones en pugna por el control del territorio
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SECTS_LIST.map((sect) => {
                    const isSelected = selectedSect === sect.id;
                    return (
                      <button
                        key={sect.id}
                        type="button"
                        onClick={() => setSelectedSect(sect.id)}
                        className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-500 text-amber-100 shadow-sm'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-stone-200">{sect.name}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono mb-1">{sect.alignment}</div>
                        <p className="text-[11px] text-stone-400 line-clamp-2">{sect.description}</p>
                        <div className="mt-2 text-[10px] text-emerald-400">{sect.activeBuff}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-cinzel font-bold text-sm tracking-wider uppercase shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
                >
                  Comenzar Sendero Inmortal
                </button>
                <div className="text-center text-xs text-stone-500 mt-2">
                  Partidas y subastas sincronizadas en tiempo real en todo el Jianghu
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
