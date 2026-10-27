// src/ui/screens/admin/BestiaryPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// D. FAUNA Y FLORA — tablas CRUD con balanceo "en caliente": el dangerLevel de
// una bestia o la rareza de una planta se ajustan vía PATCH y afectan a la
// próxima generación determinista de chunks (el servidor relee admin_beasts).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Bug, Flower2, Loader2, X } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import { toast } from '../../../core/store/useToastStore';
import type { BeastRow, BeastInput, FloraRow, FloraInput } from '../../../types/admin.types';
import { Spinner, ErrorState, PageHeader } from '../../components/admin/Spinner';

const TIERS: BeastRow['tier'][] = ['Mutante', 'Desolada', 'Ancestral', 'Primordial'];
const RARITIES: FloraRow['rarity'][] = ['Común', 'Rara', 'Épica', 'Legendaria'];

const tierColor: Record<BeastRow['tier'], string> = {
  Mutante: 'text-stone-400',
  Desolada: 'text-cyan-300',
  Ancestral: 'text-violet-300',
  Primordial: 'text-amber-400',
};

const rarityColor: Record<FloraRow['rarity'], string> = {
  'Común': 'text-stone-400',
  'Rara': 'text-cyan-300',
  'Épica': 'text-violet-300',
  'Legendaria': 'text-amber-400',
};

const inputCls = 'bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-amber-700 focus:outline-none w-full';

interface BeastForm { name: string; tier: BeastRow['tier']; dangerLevel: number; habitat: string; keyMaterial: string; isAquatic: boolean }
interface FloraForm { name: string; rarity: FloraRow['rarity']; effect: string; habitat: string }

const emptyBeast: BeastForm = { name: '', tier: 'Mutante', dangerLevel: 1, habitat: '', keyMaterial: '', isAquatic: false };
const emptyFlora: FloraForm = { name: '', rarity: 'Común', effect: '', habitat: '' };

export const BestiaryPage = () => {
  const [tab, setTab] = useState<'fauna' | 'flora'>('fauna');

  // Fauna
  const [beasts, setBeasts] = useState<BeastRow[]>([]);
  const [beastLoading, setBeastLoading] = useState(true);
  const [beastError, setBeastError] = useState<string | null>(null);
  const [beastForm, setBeastForm] = useState<BeastForm | null>(null);
  const [beastEditId, setBeastEditId] = useState<string | null>(null);
  const [beastSaving, setBeastSaving] = useState(false);

  // Flora
  const [flora, setFlora] = useState<FloraRow[]>([]);
  const [floraLoading, setFloraLoading] = useState(true);
  const [floraError, setFloraError] = useState<string | null>(null);
  const [floraForm, setFloraForm] = useState<FloraForm | null>(null);
  const [floraEditId, setFloraEditId] = useState<string | null>(null);
  const [floraSaving, setFloraSaving] = useState(false);

  const loadBeasts = useCallback(async () => {
    setBeastLoading(true); setBeastError(null);
    try { setBeasts(await adminService.getBeasts()); }
    catch (err) { setBeastError(err instanceof Error ? err.message : String(err)); }
    finally { setBeastLoading(false); }
  }, []);

  const loadFlora = useCallback(async () => {
    setFloraLoading(true); setFloraError(null);
    try { setFlora(await adminService.getFlora()); }
    catch (err) { setFloraError(err instanceof Error ? err.message : String(err)); }
    finally { setFloraLoading(false); }
  }, []);

  useEffect(() => { void loadBeasts(); void loadFlora(); }, [loadBeasts, loadFlora]);

  // ── Handlers de fauna ──
  const saveBeast = async (): Promise<void> => {
    if (!beastForm) return;
    if (!beastForm.name.trim()) { toast.error('El nombre de la bestia es obligatorio.'); return; }
    setBeastSaving(true);
    try {
      const input: BeastInput = { ...beastForm, name: beastForm.name.trim() };
      if (beastEditId) {
        const updated = await adminService.patchBeast(beastEditId, input);
        setBeasts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        toast.success(`Balance aplicado a "${updated.name}" en caliente`);
      } else {
        const created = await adminService.createBeast(input);
        setBeasts((prev) => [...prev, created]);
        toast.success(`Bestia "${created.name}" creada`);
      }
      setBeastForm(null); setBeastEditId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la bestia');
    } finally { setBeastSaving(false); }
  };

  const deleteBeast = async (b: BeastRow): Promise<void> => {
    try {
      await adminService.deleteBeast(b.id);
      setBeasts((prev) => prev.filter((x) => x.id !== b.id));
      toast.success(`"${b.name}" eliminada del bestiario`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'La bestia no está en BD (es de seeds: usa PATCH para sobreescribirla)');
    }
  };

  const bumpDanger = async (b: BeastRow, delta: number): Promise<void> => {
    const next = Math.min(10, Math.max(1, b.dangerLevel + delta));
    if (next === b.dangerLevel) return;
    try {
      const updated = await adminService.patchBeast(b.id, { dangerLevel: next });
      setBeasts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.info(`${b.name}: dangerLevel ${b.dangerLevel} → ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo ajustar el peligro');
    }
  };

  // ── Handlers de flora ──
  const saveFlora = async (): Promise<void> => {
    if (!floraForm) return;
    if (!floraForm.name.trim()) { toast.error('El nombre de la planta es obligatorio.'); return; }
    setFloraSaving(true);
    try {
      const input: FloraInput = { ...floraForm, name: floraForm.name.trim() };
      if (floraEditId) {
        const updated = await adminService.patchFlora(floraEditId, input);
        setFlora((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast.success(`"${updated.name}" actualizada`);
      } else {
        const created = await adminService.createFlora(input);
        setFlora((prev) => [...prev, created]);
        toast.success(`Planta "${created.name}" creada`);
      }
      setFloraForm(null); setFloraEditId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la planta');
    } finally { setFloraSaving(false); }
  };

  const deleteFlora = async (f: FloraRow): Promise<void> => {
    try {
      await adminService.deleteFlora(f.id);
      setFlora((prev) => prev.filter((x) => x.id !== f.id));
      toast.success(`"${f.name}" eliminada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la planta');
    }
  };

  const TabButton = ({ id, label, icon: Icon, count }: { id: 'fauna' | 'flora'; label: string; icon: typeof Bug; count: number }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border ${
        tab === id ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'border-stone-800 text-stone-400 hover:bg-stone-900'
      }`}
    >
      <Icon className="w-4 h-4" /> {label} <span className="text-xs opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fauna y Flora"
        subtitle="Ajusta el balance del mundo sin reiniciar el servidor — los cambios aplican a la próxima generación de chunks"
        actions={
          <button
            onClick={() => (tab === 'fauna' ? setBeastForm({ ...emptyBeast }) : setFloraForm({ ...emptyFlora }))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-sm font-semibold hover:bg-amber-900/60 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva {tab === 'fauna' ? 'bestia' : 'planta'}
          </button>
        }
      />

      <div className="flex gap-2">
        <TabButton id="fauna" label="Bestiario (fauna)" icon={Bug} count={beasts.length} />
        <TabButton id="flora" label="Hervolarium (flora)" icon={Flower2} count={flora.length} />
      </div>

      {/* ══ TABLA DE FAUNA ══ */}
      {tab === 'fauna' && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
          {beastLoading ? <Spinner label="Abriendo el bestiario…" /> : beastError ? (
            <ErrorState message={beastError} onRetry={() => void loadBeasts()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-800 bg-stone-950/50">
                    <th className="px-4 py-3">Bestia</th>
                    <th className="px-4 py-3">Grado</th>
                    <th className="px-4 py-3">Peligro</th>
                    <th className="px-4 py-3 hidden md:table-cell">Hábitat</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Material clave</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {beasts.map((b) => (
                    <tr key={b.id} className="border-b border-stone-800/60 hover:bg-stone-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-stone-100">{b.name} {b.isAquatic === 1 && <span className="text-cyan-500 text-xs">≈</span>}</p>
                        <p className="text-[10px] text-stone-600 font-mono">{b.id}{b.custom === 1 ? ' · override admin' : ''}</p>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${tierColor[b.tier] ?? 'text-stone-400'}`}>{b.tier}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => void bumpDanger(b, -1)} className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs cursor-pointer">−</button>
                          <span className="font-mono w-6 text-center text-amber-400">{b.dangerLevel}</span>
                          <button onClick={() => void bumpDanger(b, 1)} className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs cursor-pointer">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-400 font-mono text-xs hidden md:table-cell">{b.habitat || '—'}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs hidden lg:table-cell">{b.keyMaterial || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setBeastEditId(b.id); setBeastForm({ name: b.name, tier: b.tier, dangerLevel: b.dangerLevel, habitat: b.habitat, keyMaterial: b.keyMaterial, isAquatic: b.isAquatic === 1 }); }}
                            className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-950/50 transition-colors cursor-pointer" title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => void deleteBeast(b)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TABLA DE FLORA ══ */}
      {tab === 'flora' && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
          {floraLoading ? <Spinner label="Consultando el hervolarium…" /> : floraError ? (
            <ErrorState message={floraError} onRetry={() => void loadFlora()} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-800 bg-stone-950/50">
                    <th className="px-4 py-3">Especie</th>
                    <th className="px-4 py-3">Rareza</th>
                    <th className="px-4 py-3">Efecto</th>
                    <th className="px-4 py-3 hidden md:table-cell">Hábitat</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {flora.map((f) => (
                    <tr key={f.id} className="border-b border-stone-800/60 hover:bg-stone-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-stone-100">{f.name}</p>
                        <p className="text-[10px] text-stone-600 font-mono">{f.id}{f.custom === 1 ? ' · custom' : ''}</p>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${rarityColor[f.rarity] ?? 'text-stone-400'}`}>{f.rarity}</td>
                      <td className="px-4 py-3 text-stone-400 text-xs max-w-md">{f.effect}</td>
                      <td className="px-4 py-3 text-stone-400 font-mono text-xs hidden md:table-cell">{f.habitat || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setFloraEditId(f.id); setFloraForm({ name: f.name, rarity: f.rarity, effect: f.effect, habitat: f.habitat }); }}
                            className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-950/50 transition-colors cursor-pointer" title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => void deleteFlora(f)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ MODALES DE FORMULARIO ══ */}
      {beastForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setBeastForm(null); setBeastEditId(null); }}>
          <div className="bg-stone-950 border border-stone-700 rounded-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-cinzel text-xl text-amber-100">{beastEditId ? 'Balancear bestia' : 'Nueva bestia'}</h2>
              <button onClick={() => { setBeastForm(null); setBeastEditId(null); }} className="text-stone-500 hover:text-stone-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs text-stone-500">Nombre
              <input className={inputCls + ' mt-1'} value={beastForm.name} onChange={(e) => setBeastForm({ ...beastForm, name: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-stone-500">Grado
                <select className={inputCls + ' mt-1'} value={beastForm.tier} onChange={(e) => setBeastForm({ ...beastForm, tier: e.target.value as BeastRow['tier'] })}>
                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block text-xs text-stone-500">dangerLevel (1-10)
                <input type="number" min={1} max={10} className={inputCls + ' mt-1 font-mono'} value={beastForm.dangerLevel}
                  onChange={(e) => setBeastForm({ ...beastForm, dangerLevel: Number(e.target.value) })} />
              </label>
              <label className="block text-xs text-stone-500">Hábitat (provincia)
                <input className={inputCls + ' mt-1 font-mono'} placeholder="prov_henan" value={beastForm.habitat} onChange={(e) => setBeastForm({ ...beastForm, habitat: e.target.value })} />
              </label>
              <label className="block text-xs text-stone-500">Material clave
                <input className={inputCls + ' mt-1'} value={beastForm.keyMaterial} onChange={(e) => setBeastForm({ ...beastForm, keyMaterial: e.target.value })} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
              <input type="checkbox" checked={beastForm.isAquatic} onChange={(e) => setBeastForm({ ...beastForm, isAquatic: e.target.checked })} className="accent-amber-500" />
              Bestia acuática
            </label>
            <button onClick={() => void saveBeast()} disabled={beastSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold hover:bg-amber-900/60 disabled:opacity-40 transition-colors cursor-pointer">
              {beastSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Guardar en el bestiario
            </button>
          </div>
        </div>
      )}

      {floraForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setFloraForm(null); setFloraEditId(null); }}>
          <div className="bg-stone-950 border border-stone-700 rounded-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-cinzel text-xl text-amber-100">{floraEditId ? 'Editar planta' : 'Nueva planta'}</h2>
              <button onClick={() => { setFloraForm(null); setFloraEditId(null); }} className="text-stone-500 hover:text-stone-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs text-stone-500">Nombre
              <input className={inputCls + ' mt-1'} value={floraForm.name} onChange={(e) => setFloraForm({ ...floraForm, name: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-stone-500">Rareza
                <select className={inputCls + ' mt-1'} value={floraForm.rarity} onChange={(e) => setFloraForm({ ...floraForm, rarity: e.target.value as FloraRow['rarity'] })}>
                  {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="block text-xs text-stone-500">Hábitat (provincia)
                <input className={inputCls + ' mt-1 font-mono'} value={floraForm.habitat} onChange={(e) => setFloraForm({ ...floraForm, habitat: e.target.value })} />
              </label>
            </div>
            <label className="block text-xs text-stone-500">Efecto
              <textarea rows={3} className={inputCls + ' mt-1 resize-none'} value={floraForm.effect} onChange={(e) => setFloraForm({ ...floraForm, effect: e.target.value })} />
            </label>
            <button onClick={() => void saveFlora()} disabled={floraSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold hover:bg-amber-900/60 disabled:opacity-40 transition-colors cursor-pointer">
              {floraSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Guardar en el hervolarium
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
