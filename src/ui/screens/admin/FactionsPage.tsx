// src/ui/screens/admin/FactionsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// D. FACCIONES — CRUD sobre admin_factions con ajuste "en caliente" del
// powerLevel (afecta a la IA de facciones del servidor de simulación).
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Swords } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import { toast } from '../../../core/store/useToastStore';
import type { FactionRow, FactionInput } from '../../../types/admin.types';
import { Spinner, ErrorState, PageHeader } from '../../components/admin/Spinner';

const TYPES: FactionRow['type'][] = ['Secta', 'Clan', 'Culto', 'Gremio', 'Organización'];
const ALIGNMENTS: FactionRow['alignment'][] = ['Ortodoxa', 'Heterodoxa', 'Demoníaca', 'Neutral'];

const alignmentColor: Record<FactionRow['alignment'], string> = {
  Ortodoxa: 'bg-cyan-950/60 border-cyan-800 text-cyan-300',
  Heterodoxa: 'bg-amber-950/60 border-amber-800 text-amber-400',
  Demoníaca: 'bg-rose-950/60 border-rose-800 text-rose-400',
  Neutral: 'bg-stone-800/70 border-stone-700 text-stone-300',
};

const inputCls = 'bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-amber-700 focus:outline-none w-full';

interface FactionForm { name: string; type: FactionRow['type']; alignment: FactionRow['alignment']; element: string; description: string; powerLevel: number; territory: string }

const emptyForm: FactionForm = { name: '', type: 'Secta', alignment: 'Neutral', element: 'Qi', description: '', powerLevel: 1, territory: '' };

export const FactionsPage = () => {
  const [factions, setFactions] = useState<FactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState<FactionForm | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setFactions(await adminService.getFactions()); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (): Promise<void> => {
    if (!form) return;
    if (!form.name.trim()) { toast.error('El nombre de la facción es obligatorio.'); return; }
    setSaving(true);
    try {
      const input: FactionInput = { ...form, name: form.name.trim() };
      if (editId) {
        const updated = await adminService.patchFaction(editId, input);
        setFactions((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        toast.success(`"${updated.name}" reequilibrada en caliente`);
      } else {
        const created = await adminService.createFaction(input);
        setFactions((prev) => [...prev, created]);
        toast.success(`Facción "${created.name}" fundada`);
      }
      setForm(null); setEditId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar la facción');
    } finally { setSaving(false); }
  };

  const remove = async (f: FactionRow): Promise<void> => {
    try {
      await adminService.deleteFaction(f.id);
      setFactions((prev) => prev.filter((x) => x.id !== f.id));
      toast.success(`"${f.name}" disuelta`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la facción');
    }
  };

  const bumpPower = async (f: FactionRow, delta: number): Promise<void> => {
    const next = Math.min(10, Math.max(1, f.powerLevel + delta));
    if (next === f.powerLevel) return;
    try {
      const updated = await adminService.patchFaction(f.id, { powerLevel: next });
      setFactions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.info(`${f.name}: powerLevel ${f.powerLevel} → ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo ajustar el poder');
    }
  };

  const q = filter.trim().toLowerCase();
  const visible = factions.filter((f) => !q || f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q) || f.territory.includes(q));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facciones del Jianghu"
        subtitle={`${factions.length} organizaciones · sectas, clanes, cultos y gremios — balancea su poder sin reiniciar`}
        actions={
          <div className="flex items-center gap-2">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar…"
              className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-amber-700 focus:outline-none w-44" />
            <button onClick={() => { setForm({ ...emptyForm }); setEditId(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-sm font-semibold hover:bg-amber-900/60 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Nueva facción
            </button>
          </div>
        }
      />

      <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
        {loading ? <Spinner label="Convocando a las facciones…" /> : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-800 bg-stone-950/50">
                  <th className="px-4 py-3">Facción</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Alineamiento</th>
                  <th className="px-4 py-3 hidden md:table-cell">Elemento</th>
                  <th className="px-4 py-3">Poder</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Territorio</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => (
                  <tr key={f.id} className="border-b border-stone-800/60 hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-stone-100">{f.name}</p>
                      <p className="text-[11px] text-stone-500 max-w-xs truncate" title={f.description}>{f.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-300">{f.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${alignmentColor[f.alignment] ?? alignmentColor.Neutral}`}>{f.alignment}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 hidden md:table-cell">{f.element}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => void bumpPower(f, -1)} className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs cursor-pointer">−</button>
                        <span className="font-mono w-6 text-center text-amber-400">{f.powerLevel}</span>
                        <button onClick={() => void bumpPower(f, 1)} className="w-6 h-6 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs cursor-pointer">+</button>
                        {/* Barra visual de poder */}
                        <div className="hidden sm:flex gap-0.5 ml-2">
                          {Array.from({ length: 10 }, (_, i) => (
                            <span key={i} className={`w-1.5 h-3 rounded-sm ${i < f.powerLevel ? 'bg-amber-500' : 'bg-stone-800'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-400 font-mono text-xs hidden lg:table-cell">{f.territory || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditId(f.id); setForm({ name: f.name, type: f.type, alignment: f.alignment, element: f.element, description: f.description, powerLevel: f.powerLevel, territory: f.territory }); }}
                          className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-950/50 transition-colors cursor-pointer" title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => void remove(f)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer" title="Disolver">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <p className="text-center text-stone-600 text-sm py-10">Ninguna facción coincide con el filtro.</p>}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setForm(null); setEditId(null); }}>
          <div className="bg-stone-950 border border-stone-700 rounded-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="font-cinzel text-xl text-amber-100 flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-500" /> {editId ? 'Reequilibrar facción' : 'Fundar nueva facción'}
              </h2>
              <button onClick={() => { setForm(null); setEditId(null); }} className="text-stone-500 hover:text-stone-200 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs text-stone-500">Nombre
              <input className={inputCls + ' mt-1'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-stone-500">Tipo
                <select className={inputCls + ' mt-1'} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FactionRow['type'] })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block text-xs text-stone-500">Alineamiento
                <select className={inputCls + ' mt-1'} value={form.alignment} onChange={(e) => setForm({ ...form, alignment: e.target.value as FactionRow['alignment'] })}>
                  {ALIGNMENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="block text-xs text-stone-500">Elemento
                <input className={inputCls + ' mt-1'} value={form.element} onChange={(e) => setForm({ ...form, element: e.target.value })} />
              </label>
              <label className="block text-xs text-stone-500">powerLevel (1-10)
                <input type="number" min={1} max={10} className={inputCls + ' mt-1 font-mono'} value={form.powerLevel}
                  onChange={(e) => setForm({ ...form, powerLevel: Number(e.target.value) })} />
              </label>
              <label className="block text-xs text-stone-500 col-span-2">Territorio (provincia)
                <input className={inputCls + ' mt-1 font-mono'} placeholder="prov_henan" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} />
              </label>
            </div>
            <label className="block text-xs text-stone-500">Descripción / lore
              <textarea rows={3} className={inputCls + ' mt-1 resize-none'} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <button onClick={() => void save()} disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold hover:bg-amber-900/60 disabled:opacity-40 transition-colors cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Guardar facción
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
