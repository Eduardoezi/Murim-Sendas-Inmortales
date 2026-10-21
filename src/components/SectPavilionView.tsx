import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SectRank, Item } from '../types/game';
import { SECT_STORE_ITEMS } from '../data/gameData';
import {
  Shield,
  Users,
  Award,
  Scroll,
  UserPlus,
  Check,
  ChevronRight,
  Crown,
  BookOpen,
  HeartPulse,
  Coins,
  Sparkles,
  Flame,
  Droplets,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle,
  Gift,
  Plus,
} from 'lucide-react';

export const SectPavilionView: React.FC = () => {
  const {
    cultivator,
    sects,
    missions,
    acceptMission,
    claimMission,
    recruitDisciple,
    assignDiscipleTask,
    claimDiscipleTribute,
    contributeSect,
    studyLibraryScroll,
    dismantleTechnique,
    claimSectStipend,
    requestPatriarchGuidance,
    receiveMedicinalTreatment,
    harvestSectGarden,
    buySectStoreItem,
  } = useGame();

  const [activeTab, setActiveTab] = useState<
    'patriarch' | 'library' | 'medicine' | 'missions' | 'merits_eco' | 'disciples' | 'hierarchy'
  >('patriarch');

  const [libraryFilter, setLibraryFilter] = useState<'all' | 'marcial' | 'cultivo' | 'alquimia' | 'medicina' | 'formacion'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [bundleInsight, setBundleInsight] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(50);

  if (!cultivator) return null;

  const currentSect = sects.find((s) => s.id === cultivator.sectId) || sects[0];

  const rankThresholds: Record<SectRank, { requiredMerits: number; nextRank?: SectRank }> = {
    'Discípulo Externo': { requiredMerits: 0, nextRank: 'Discípulo Interno' },
    'Discípulo Interno': { requiredMerits: 200, nextRank: 'Discípulo Élite' },
    'Discípulo Élite': { requiredMerits: 600, nextRank: 'Anciano de Pabellón' },
    'Anciano de Pabellón': { requiredMerits: 1500, nextRank: 'Gran Maestro' },
    'Gran Maestro': { requiredMerits: 3500, nextRank: 'Líder Supremo / Patriarca' },
    'Líder Supremo / Patriarca': { requiredMerits: 8000 },
  };

  const currentRankInfo = rankThresholds[cultivator.sectRank] || rankThresholds['Discípulo Externo'];

  const filteredScrolls = (cultivator.libraryScrolls || []).filter((s) => {
    if (libraryFilter === 'all') return true;
    return s.category === libraryFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner with Sect Art */}
      <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900/80 min-h-[180px] flex items-end p-6">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/murim_sect_pavilion_1792518333253.jpg"
            alt="Pabellón de la Secta"
            className="w-full h-full object-cover opacity-30 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-[#090b10]/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs text-amber-400 font-cinzel mb-1 flex items-center gap-2">
              <span>{currentSect.chineseName}</span>
              <span>·</span>
              <span>{currentSect.alignment}</span>
            </div>
            <h2 className="font-cinzel text-3xl font-bold text-amber-100">
              {currentSect.name}
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xl">
              Líder: <strong className="text-amber-200">{currentSect.leaderName}</strong> · Beneficio Activo:{' '}
              <span className="text-emerald-400 font-medium">{currentSect.activeBuff}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-300 bg-stone-950/80 p-3 rounded-lg border border-stone-800">
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Rango en la Secta</div>
              <div className="font-cinzel font-bold text-amber-300">{cultivator.sectRank}</div>
            </div>
            <div className="w-[1px] h-8 bg-stone-800" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Méritos Acumulados</div>
              <div className="font-mono font-bold text-emerald-400 tabular-nums">
                {cultivator.sectMerits}
              </div>
            </div>
            <div className="w-[1px] h-8 bg-stone-800" />
            <div>
              <div className="text-[10px] text-stone-500 uppercase">Control Territorial</div>
              <div className="font-mono font-bold text-cyan-400 tabular-nums">
                {currentSect.territoryControl}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-amber-950/70 border border-amber-500/40 p-3 rounded-lg text-xs text-amber-200 flex items-center justify-between animate-in fade-in">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-stone-400 hover:text-stone-200 cursor-pointer ml-3 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Internal Navigation: Complete Pavilion Compound */}
      <div className="flex border-b border-stone-800 gap-2 overflow-x-auto text-xs font-medium pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('patriarch')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'patriarch'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          Líder de Secta
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'library'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Biblioteca Celestial
        </button>

        <button
          onClick={() => setActiveTab('medicine')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'medicine'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          Pabellón de Medicina
        </button>

        <button
          onClick={() => setActiveTab('missions')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'missions'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Scroll className="w-3.5 h-3.5" />
          Misiones de Secta
        </button>

        <button
          onClick={() => setActiveTab('merits_eco')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'merits_eco'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Méritos & Economía
        </button>

        <button
          onClick={() => setActiveTab('disciples')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'disciples'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Salón de Discípulos ({cultivator.disciples.length})
        </button>

        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-2.5 px-3 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'text-amber-300 font-semibold border-b-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Jerarquía & Ascenso
        </button>
      </div>

      {/* 1. TAB: PATRIARCH & LEADER PAVILION */}
      {activeTab === 'patriarch' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <span className="text-[10px] text-amber-400 font-cinzel uppercase">
                    Salón Soberano del Trono Celestial · 宗主殿
                  </span>
                  <h3 className="font-cinzel text-xl font-bold text-amber-100">
                    Audiencia con {currentSect.leaderName}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                  Rango de Secta: Provincial (Rango 3)
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                El Patriarca de la <strong>{currentSect.name}</strong> vigila las cordilleras desde el Pabellón de las Nubes. Como discípulo consagrado, puedes solicitar estipendios de cultivo y buscar su guía directa para superar cuellos de botella en el Dantian.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase block">Población Total</span>
                  <span className="font-bold text-stone-200">{currentSect.totalMembers} Discípulos</span>
                </div>
                <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase block">Tesoro de Secta</span>
                  <span className="font-bold text-amber-400">{currentSect.sectTreasury} Piedras</span>
                </div>
                <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase block">Habilidad Suprema</span>
                  <span className="font-bold text-emerald-400 truncate block">{currentSect.specialtySkill}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const res = claimSectStipend();
                    setActionNotice(res.message);
                  }}
                  className="flex-1 py-2.5 px-4 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold font-cinzel cursor-pointer transition-colors shadow flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  Reclamar Estipendio Mensual
                </button>

                <button
                  onClick={() => {
                    const res = requestPatriarchGuidance();
                    setActionNotice(res.message);
                  }}
                  className="flex-1 py-2.5 px-4 rounded bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold font-cinzel border border-amber-500/30 cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Solicitar Guía del Patriarca
                </button>
              </div>
            </div>

            {/* Sect Diplomatic Standing */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
              <h4 className="font-cinzel text-sm font-bold text-amber-200 border-b border-stone-800 pb-2">
                Facciones & Relaciones del Jianghu
              </h4>
              <div className="space-y-3 text-xs">
                {sects.map((s) => (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded border ${
                      s.id === cultivator.sectId
                        ? 'bg-amber-950/40 border-amber-500/40'
                        : 'bg-stone-950/50 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-200">{s.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          s.id === cultivator.sectId
                            ? 'bg-emerald-950 text-emerald-400'
                            : s.alignment === 'Ortodoxa'
                            ? 'bg-blue-950 text-blue-400'
                            : 'bg-purple-950 text-purple-400'
                        }`}
                      >
                        {s.id === cultivator.sectId ? 'Tu Secta' : s.alignment}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1 flex justify-between">
                      <span>Control: {s.territoryControl}%</span>
                      <span>{s.leaderName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB: CELESTIAL SCRIPTURE LIBRARY (CANG JING GE) */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-cinzel uppercase">
                  Pabellón de los Nueve Rollos Sagrados · 天道藏經閣
                </span>
                <h3 className="font-cinzel text-xl font-bold text-amber-100">
                  Biblioteca Celestial de Sutras
                </h3>
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'marcial', label: 'Artes Marciales' },
                  { id: 'cultivo', label: 'Meditación Qi' },
                  { id: 'alquimia', label: 'Fórmulas Alquimia' },
                  { id: 'medicina', label: 'Medicina' },
                  { id: 'formacion', label: 'Formaciones' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setLibraryFilter(cat.id as any)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      libraryFilter === cat.id
                        ? 'bg-amber-600 text-stone-950 font-bold'
                        : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-stone-300">
              Estudia pergaminos ancestrales para desbloquear técnicas marciales, acelerar la recarga del Dantian y formular píldoras raras. Puedes emplear la <strong>Teoría de Conjunto (Bundle Theory)</strong> para deconstruir técnicas y encontrar sus fallas elementales.
            </p>

            {bundleInsight && (
              <div className="bg-stone-950 border border-cyan-500/40 p-3 rounded-lg text-xs text-cyan-200 space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>Deducción Analítica de Técnica</span>
                  <button onClick={() => setBundleInsight(null)} className="cursor-pointer text-stone-400 hover:text-stone-200">✕</button>
                </div>
                <p className="leading-relaxed text-[11px]">{bundleInsight}</p>
              </div>
            )}

            {/* Scrolls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredScrolls.map((scroll) => (
                <div
                  key={scroll.id}
                  className={`bg-stone-950/70 border rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors ${
                    scroll.isMastered
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          [{scroll.code}] · {scroll.grade}
                        </span>
                        <h4 className="font-cinzel font-bold text-stone-100 text-sm">
                          {scroll.title}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-cinzel">
                          {scroll.chineseTitle} · {scroll.originSect}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 ${
                          scroll.isMastered
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : scroll.studyProgress > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-stone-900 text-stone-500 border border-stone-800'
                        }`}
                      >
                        {scroll.isMastered
                          ? 'Maestro'
                          : scroll.studyProgress > 0
                          ? 'En Progreso'
                          : 'Estudiando'}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 leading-relaxed mb-2">
                      {scroll.description}
                    </p>

                    <div className="text-[11px] text-emerald-400 font-medium bg-stone-900/80 p-2 rounded border border-stone-800 mb-2">
                      Efecto: {scroll.effects}
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Progreso de Asimilación</span>
                        <span className="font-mono tabular-nums">{scroll.studyProgress}%</span>
                      </div>
                      <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${scroll.studyProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-stone-400">
                      <span>Coste: <strong className="text-cyan-400">{scroll.studyCostQi} Qi</strong></span>
                      <span>Requiere: <strong className="text-amber-200">INT {scroll.requiredInt}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800/80 flex gap-2">
                    <button
                      onClick={() => {
                        const res = studyLibraryScroll(scroll.id);
                        setActionNotice(res.message);
                      }}
                      disabled={scroll.isMastered}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        scroll.isMastered
                          ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                      }`}
                    >
                      {scroll.isMastered ? 'Asimilado' : 'Estudiar Precepto'}
                    </button>

                    <button
                      onClick={() => {
                        const res = dismantleTechnique(scroll.id);
                        if (res.success) {
                          setBundleInsight(res.insight);
                        } else {
                          setActionNotice(res.insight);
                        }
                      }}
                      className="py-1.5 px-3 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs cursor-pointer transition-colors"
                      title="Deconstruir componentes y debilidades con Bundle Theory"
                    >
                      Desmontar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: MEDICINE & SPIRIT HERB PAVILION */}
      {activeTab === 'medicine' && (
        <div className="space-y-6">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] text-amber-400 font-cinzel uppercase">
                Laboratorio del Caldero Espiritual & Jardín de Cien Hierbas · 百草堂
              </span>
              <h3 className="font-cinzel text-xl font-bold text-amber-100">
                Pabellón de Medicina & Sanación
              </h3>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              El Pabellón de Medicina está supervisado por la Gran Alquimista Dama Yan. Aquí los discípulos pueden sumergirse en baños medicinales para templar los huesos, sanar fracturas de Qi y recolectar especímenes botánicos del jardín para destilar píldoras.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bath 1: Herb Bath */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-cinzel font-bold text-amber-200 text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-emerald-400" />
                    Baño de Templado Corporal
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Inmersión en caldero con esencias de bestias y ginseng milenario. Purifica toxinas celulares.
                  </p>
                  <div className="text-[11px] text-emerald-400 font-medium mt-2">
                    Efecto: +30 Salud Máxima, +5 Defensa Física y regenera 100% de vitalidad.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const res = receiveMedicinalTreatment('herb_bath');
                    setActionNotice(res.message);
                  }}
                  className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Tomar Baño Medicinal
                </button>
              </div>

              {/* Treatment 2: Acupuncture */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-cinzel font-bold text-amber-200 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Acupuntura de Plata en 365 Puntos
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Despeja bloqueos en los 12 canales ordinarios y alinea los vórtices del Dantian.
                  </p>
                  <div className="text-[11px] text-cyan-400 font-medium mt-2">
                    Efecto: +10% Pureza de Dantian, +8 Daño Espiritual y restauración total de Qi.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const res = receiveMedicinalTreatment('acupuncture');
                    setActionNotice(res.message);
                  }}
                  className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Recibir Acupuntura
                </button>
              </div>

              {/* Garden Harvesting */}
              <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-cinzel font-bold text-amber-200 text-sm flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400" />
                    Cosecha en el Jardín Espiritual
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Canteros nutridos por el manantial de Qi de la montaña. Produce hierbas raras para el horno de alquimia.
                  </p>
                  <div className="text-[11px] text-amber-400 font-medium mt-2">
                    Hierbas: Loto de Nieve, Sangre de Dragón, Siete Sombras.
                  </div>
                </div>
                <button
                  onClick={() => {
                    const res = harvestSectGarden();
                    setActionNotice(res.message);
                  }}
                  className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cosechar Hierbas Espirituales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: MISSIONS PAVILION */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission) => {
              const isDone = mission.currentCount >= mission.targetCount;
              return (
                <div
                  key={mission.id}
                  className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-stone-100">{mission.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-amber-400 border border-stone-800">
                        {mission.difficulty}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
                      {mission.description}
                    </p>

                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Progreso de Misión</span>
                        <span className="font-mono tabular-nums">
                          {mission.currentCount} / {mission.targetCount}
                        </span>
                      </div>
                      <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-400' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (mission.currentCount / mission.targetCount) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-stone-400">
                      <span>Piedras: <strong className="text-amber-300">+{mission.rewardStones}</strong></span>
                      <span>Méritos: <strong className="text-emerald-400">+{mission.rewardMerits}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      Requisito: {mission.minRank}
                    </span>
                    {mission.claimed ? (
                      <span className="text-xs text-stone-500 font-semibold">Completada</span>
                    ) : isDone ? (
                      <button
                        onClick={() => claimMission(mission.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded text-xs cursor-pointer transition-colors"
                      >
                        Reclamar Méritos
                      </button>
                    ) : (
                      <button
                        onClick={() => acceptMission(mission.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded text-xs cursor-pointer transition-colors"
                      >
                        Completar Acción
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB: MERITS & SECT ECONOMY */}
      {activeTab === 'merits_eco' && (
        <div className="space-y-6">
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-cinzel uppercase">
                  Cámara de Contabilidad & Bóveda de Recompensas · 庶務司
                </span>
                <h3 className="font-cinzel text-xl font-bold text-amber-100">
                  Pabellón de Méritos & Economía de Secta
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block">Tus Méritos</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {cultivator.sectMerits}
                </span>
              </div>
            </div>

            {/* Financial Ledger from Lore */}
            <div className="bg-stone-950/80 p-4 rounded-xl border border-stone-800 space-y-3">
              <h4 className="font-cinzel text-xs font-bold text-amber-300 uppercase">
                Balance Mensual de Recursos de la Secta (Módulo 2 Lore)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 text-stone-300">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">Ingresos Granulares:</div>
                  <div className="flex justify-between"><span>Rutas Comerciales del Río:</span> <strong className="text-stone-200">+12,500 Oro</strong></div>
                  <div className="flex justify-between"><span>Minas de Piedras Espirituales:</span> <strong className="text-stone-200">+850 Piedras Medias</strong></div>
                  <div className="flex justify-between"><span>Tributos de Ciudades Vasallas:</span> <strong className="text-stone-200">+18,000 Plata</strong></div>
                </div>
                <div className="space-y-1.5 text-stone-300">
                  <div className="text-[10px] text-rose-400 font-semibold uppercase">Gastos Granulares:</div>
                  <div className="flex justify-between"><span>Píldoras para Discípulos:</span> <strong className="text-stone-400">-4,200 Oro</strong></div>
                  <div className="flex justify-between"><span>Matriz Defensiva de Montaña:</span> <strong className="text-stone-400">-300 Piedras Medias</strong></div>
                  <div className="flex justify-between"><span>Red de Espías del Jianghu:</span> <strong className="text-stone-400">-6,000 Plata</strong></div>
                </div>
              </div>
            </div>

            {/* Sect Merit Store */}
            <div>
              <h4 className="font-cinzel text-sm font-bold text-amber-200 mb-3">
                Tienda Exclusiva de Méritos de la Secta
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECT_STORE_ITEMS.map((storeEntry, i) => (
                  <div
                    key={i}
                    className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-amber-400">
                            Rango Requerido: {storeEntry.reqRank}
                          </span>
                          <h5 className="font-cinzel font-bold text-stone-100 text-sm">
                            {storeEntry.item.name}
                          </h5>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                          {storeEntry.meritCost} Méritos
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                        {storeEntry.item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const res = buySectStoreItem(storeEntry.item, storeEntry.meritCost);
                        setActionNotice(res.message);
                      }}
                      disabled={cultivator.sectMerits < storeEntry.meritCost}
                      className={`w-full py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                        cultivator.sectMerits >= storeEntry.meritCost
                          ? 'bg-amber-600 hover:bg-amber-500 text-stone-950'
                          : 'bg-stone-900 text-stone-600 cursor-not-allowed'
                      }`}
                    >
                      {cultivator.sectMerits >= storeEntry.meritCost ? 'Adquirir con Méritos' : 'Méritos Insuficientes'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: DISCIPLES HALL */}
      {activeTab === 'disciples' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-stone-900/60 border border-stone-800 rounded-xl p-5">
            <div>
              <h3 className="font-cinzel text-lg font-bold text-amber-100">
                Tus Discípulos Personales ({cultivator.disciples.length})
              </h3>
              <p className="text-xs text-stone-400">
                Instruye a jóvenes talentos del Jianghu. A medida que cultivan, cosecharán piedras y materiales para su maestro.
              </p>
            </div>
            <button
              onClick={recruitDisciple}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs cursor-pointer transition-colors shadow flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Reclutar Nuevo Discípulo (100 Méritos)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cultivator.disciples.map((disciple) => (
              <div
                key={disciple.id}
                className="bg-stone-900/60 border border-stone-800 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-cinzel font-bold text-stone-100">{disciple.name}</h4>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {disciple.realm} · Aptitud: {disciple.aptitude}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    Lealtad: {disciple.loyalty}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-300">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Tarea: {disciple.assignedTask}</span>
                    <span className="font-mono">{disciple.taskProgress}%</span>
                  </div>
                  <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${disciple.taskProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => assignDiscipleTask(disciple.id, 'herb_gathering')}
                    className="flex-1 py-1 rounded bg-stone-950 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 cursor-pointer"
                  >
                    Recolectar
                  </button>
                  <button
                    onClick={() => assignDiscipleTask(disciple.id, 'meditation')}
                    className="flex-1 py-1 rounded bg-stone-950 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 cursor-pointer"
                  >
                    Meditar
                  </button>
                  <button
                    onClick={() => assignDiscipleTask(disciple.id, 'sect_patrol')}
                    className="flex-1 py-1 rounded bg-stone-950 hover:bg-stone-800 text-[10px] text-stone-300 border border-stone-800 cursor-pointer"
                  >
                    Patrullar
                  </button>
                  <button
                    onClick={() => claimDiscipleTribute(disciple.id)}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-[10px] cursor-pointer"
                  >
                    Tributo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB: HIERARCHY & PROMOTION */}
      {activeTab === 'hierarchy' && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="font-cinzel text-xl font-bold text-amber-100">
              Jerarquía de la Secta & Ascenso a Gran Maestro
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Escala de méritos requerida para acceder a las técnicas prohibidas y el gobierno del pabellón.
            </p>
          </div>

          <div className="space-y-4">
            {(
              [
                'Discípulo Externo',
                'Discípulo Interno',
                'Discípulo Élite',
                'Anciano de Pabellón',
                'Gran Maestro',
                'Líder Supremo / Patriarca',
              ] as SectRank[]
            ).map((rank) => {
              const req = rankThresholds[rank].requiredMerits;
              const isCurrent = cultivator.sectRank === rank;
              const isPassed = cultivator.sectMerits >= req;

              return (
                <div
                  key={rank}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : isPassed
                      ? 'bg-stone-950/40 border-stone-800'
                      : 'bg-stone-950/20 border-stone-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-amber-500 text-stone-950'
                          : isPassed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-stone-900 text-stone-600'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : '•'}
                    </div>
                    <div>
                      <h4 className="font-cinzel font-bold text-sm text-stone-100">{rank}</h4>
                      <span className="text-[10px] text-stone-500">
                        Requiere {req} Méritos Acumulados
                      </span>
                    </div>
                  </div>

                  {isCurrent && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                      Rango Actual
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contribution Box */}
          <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-stone-400">
              Contribuye con Piedras de Espíritu a las arcas de la secta para ganar Puntos de Mérito directos.
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-24 bg-stone-950 border border-stone-700 rounded px-2.5 py-1 text-xs text-amber-300 font-mono text-center"
              />
              <button
                onClick={() => contributeSect(contributionAmount)}
                className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
              >
                Donar Piedras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
