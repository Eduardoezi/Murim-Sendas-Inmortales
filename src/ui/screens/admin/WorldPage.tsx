// src/ui/screens/admin/WorldPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// C. MUNDO Y POIs — visualizador de la semilla raíz (WORLD_SEED), listado de
// POIs persistidos en SQLite y regeneración FORZADA de chunks para QA.
// La vista previa del chunk se calcula en el servidor con mulberry32 + semillas
// (nunca Math.random); este componente solo renderiza lo que devuelve /world/*.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCw, Dices, MapPin, WandSparkles, Search } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import { toast } from '../../../core/store/useToastStore';
import type { WorldSeedInfo, PoiRow, ChunkPreviewPayload } from '../../../types/admin.types';
import { Spinner, ErrorState, PageHeader } from '../../components/admin/Spinner';

const CHUNKS_PER_SIDE = 63; // 1000 / 16 redondeado hacia arriba

const TILE_COLORS: Record<string, string> = {
  hierba: '#2f5233',
  agua: '#1d4e6b',
  arena: '#8a6d3b',
  nieve: '#9db4c0',
  montana: '#57534e',
  pantano: '#3f4a2e',
};

const KIND_LABEL: Record<PoiRow['kind'], { text: string; cls: string }> = {
  capital: { text: 'Capital', cls: 'bg-amber-950/60 border-amber-800 text-amber-400' },
  sect: { text: 'Secta', cls: 'bg-cyan-950/60 border-cyan-800 text-cyan-300' },
  landmark: { text: 'Hito', cls: 'bg-violet-950/60 border-violet-800 text-violet-300' },
  settlement: { text: 'Aldea', cls: 'bg-emerald-950/60 border-emerald-800 text-emerald-300' },
};

export const WorldPage = () => {
  const [seed, setSeed] = useState<WorldSeedInfo | null>(null);
  const [pois, setPois] = useState<PoiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [poiFilter, setPoiFilter] = useState('');
  const [poiKind, setPoiKind] = useState<'' | PoiRow['kind']>('');
  const [syncing, setSyncing] = useState(false);

  const [chunkX, setChunkX] = useState('31');
  const [chunkY, setChunkY] = useState('30');
  const [preview, setPreview] = useState<ChunkPreviewPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([adminService.getWorldSeed(), adminService.getPois()]);
      setSeed(s);
      setPois(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const filteredPois = useMemo(() => {
    const q = poiFilter.trim().toLowerCase();
    return pois.filter(
      (p) => (!poiKind || p.kind === poiKind) && (!q || p.name.toLowerCase().includes(q) || p.provinceId.includes(q)),
    );
  }, [pois, poiFilter, poiKind]);

  const loadChunk = async (): Promise<void> => {
    const cx = Number(chunkX), cy = Number(chunkY);
    if (!Number.isInteger(cx) || !Number.isInteger(cy) || cx < 0 || cy < 0 || cx >= CHUNKS_PER_SIDE || cy >= CHUNKS_PER_SIDE) {
      toast.error(`Coordenadas de chunk fuera de rango (0..${CHUNKS_PER_SIDE - 1}).`);
      return;
    }
    setPreviewLoading(true);
    try {
      setPreview(await adminService.getChunkPreview(cx, cy));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo leer el chunk');
    } finally {
      setPreviewLoading(false);
    }
  };

  const regenerateChunk = async (): Promise<void> => {
    const cx = Number(chunkX), cy = Number(chunkY);
    if (!Number.isInteger(cx) || !Number.isInteger(cy) || cx < 0 || cy < 0 || cx >= CHUNKS_PER_SIDE || cy >= CHUNKS_PER_SIDE) {
      toast.error(`Coordenadas de chunk fuera de rango (0..${CHUNKS_PER_SIDE - 1}).`);
      return;
    }
    setRegenerating(true);
    try {
      const res = await adminService.regenerateChunk(cx, cy);
      toast.success(res.message);
      await loadChunk();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'La regeneración falló');
    } finally {
      setRegenerating(false);
    }
  };

  const syncPois = async (): Promise<void> => {
    setSyncing(true);
    try {
      const res = await adminService.syncPois();
      toast.success(`POIs sincronizados: ${res.synced} registrados en BD`);
      setPois(await adminService.getPois());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo sincronizar los POIs');
    } finally {
      setSyncing(false);
    }
  };

  const copySeed = (): void => {
    if (!seed) return;
    void navigator.clipboard.writeText(seed.rootHash).then(() => toast.info('Semilla copiada al portapapeles'));
  };

  if (loading) return <Spinner label="Leyendo la semilla del mundo…" />;
  if (error) return <ErrorState message={error} onRetry={() => void loadAll()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mundo y Puntos de Interés"
        subtitle="Generación determinista por semilla · mulberry32 en el servidor (prohibido Math.random)"
        actions={
          <button
            onClick={() => void syncPois()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-sm font-semibold hover:bg-amber-900/60 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> Sincronizar POIs
          </button>
        }
      />

      {/* Semilla actual */}
      {seed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-stone-900/60 border border-stone-800 rounded-xl p-6">
            <h2 className="font-cinzel text-lg text-stone-200 mb-4 flex items-center gap-2">
              <Dices className="w-5 h-5 text-amber-500" /> Semilla raíz del mundo (WORLD_SEED)
            </h2>
            <div className="flex items-center gap-3 bg-stone-950 border border-stone-800 rounded-lg px-4 py-3">
              <code className="flex-1 text-amber-400 font-mono text-sm break-all">{seed.rootHash}</code>
              <button onClick={copySeed} title="Copiar semilla" className="p-2 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors cursor-pointer">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
              {[
                { k: 'Nombre', v: seed.worldName },
                { k: 'Versión', v: seed.version },
                { k: 'Época', v: seed.epoch },
                { k: 'Cuadrícula', v: `${seed.gridSize.width} × ${seed.gridSize.height}` },
                { k: 'Densidad de Qi', v: String(seed.globalModifiers.qiDensity) },
                { k: 'Factor de Caos', v: String(seed.globalModifiers.chaosFactor) },
                { k: 'Chunks', v: `${CHUNKS_PER_SIDE} × ${CHUNKS_PER_SIDE} (16px)` },
                { k: 'POIs en BD', v: String(pois.length) },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="text-[10px] uppercase tracking-wider text-stone-500">{row.k}</dt>
                  <dd className="text-stone-200 font-medium truncate" title={row.v}>{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Regenerador de chunks */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6">
            <h2 className="font-cinzel text-lg text-stone-200 mb-4 flex items-center gap-2">
              <WandSparkles className="w-5 h-5 text-cyan-400" /> Regenerar chunk (QA)
            </h2>
            <div className="flex items-end gap-3">
              <label className="text-xs text-stone-500">
                Chunk X
                <input value={chunkX} onChange={(e) => setChunkX(e.target.value)} inputMode="numeric"
                  className="block mt-1 w-20 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm font-mono text-stone-200 focus:border-amber-700 focus:outline-none" />
              </label>
              <label className="text-xs text-stone-500">
                Chunk Y
                <input value={chunkY} onChange={(e) => setChunkY(e.target.value)} inputMode="numeric"
                  className="block mt-1 w-20 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm font-mono text-stone-200 focus:border-amber-700 focus:outline-none" />
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => void loadChunk()} disabled={previewLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-stone-700 text-stone-300 text-sm font-semibold hover:bg-stone-800 disabled:opacity-40 transition-colors cursor-pointer">
                <MapPin className="w-4 h-4" /> Vista previa
              </button>
              <button onClick={() => void regenerateChunk()} disabled={regenerating}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm font-semibold hover:bg-rose-900/60 disabled:opacity-40 transition-colors cursor-pointer">
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} /> Forzar regen
              </button>
            </div>
            {preview && (
              <div className="mt-4 text-xs space-y-1">
                <p className="text-stone-300 font-semibold">{preview.provinceName}</p>
                <p className="text-stone-500">Bioma: <span className="text-stone-300">{preview.biome}</span></p>
                <p className="text-stone-500 font-mono break-all">seed: {preview.seedUsed}</p>
                <p className="text-stone-500">Fauna sembrada: <span className="text-amber-400">{preview.fauna.length}</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mapa de tiles del chunk preseleccionado */}
      {preview && (
        <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-6">
          <h2 className="font-cinzel text-lg text-stone-200 mb-4">
            Vista previa del chunk ({preview.chunkX}, {preview.chunkY}) — {preview.tiles.length} tiles
          </h2>
          <div className="flex flex-wrap gap-8">
            <div
              className="grid border border-stone-800 rounded overflow-hidden"
              style={{ gridTemplateColumns: `repeat(${preview.chunkSize}, 10px)`, width: preview.chunkSize * 10 }}
            >
              {preview.tiles.map((t) => (
                <div key={`${t.x}-${t.y}`} title={`${t.type} (${t.x},${t.y}) d=${t.density}`}
                  style={{ width: 10, height: 10, backgroundColor: TILE_COLORS[t.type] ?? '#1c1917', opacity: t.density > 0 ? 0.6 + t.density * 0.4 : 1 }} />
              ))}
            </div>
            <div className="flex-1 min-w-64">
              <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">Bestias generadas (mulberry32)</h3>
              <div className="space-y-1 max-h-44 overflow-y-auto">
                {preview.fauna.length === 0 ? (
                  <p className="text-xs text-stone-600">Sin fauna en esta pasada determinista.</p>
                ) : (
                  preview.fauna.map((b) => (
                    <div key={b.id} className="flex justify-between text-xs bg-stone-950/60 border border-stone-800 rounded px-3 py-1.5">
                      <span className="text-stone-200">{b.name}</span>
                      <span className="text-stone-500 font-mono">({b.x}, {b.y}) · {b.tier}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listado de POIs */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-stone-800 bg-stone-950/40">
          <h2 className="font-cinzel text-lg text-stone-200">Puntos de interés ({filteredPois.length}/{pois.length})</h2>
          <div className="flex items-center gap-2">
            <select value={poiKind} onChange={(e) => setPoiKind(e.target.value as '' | PoiRow['kind'])}
              className="bg-stone-950 border border-stone-700 text-xs text-stone-300 rounded-lg px-2 py-2 outline-none focus:border-amber-700">
              <option value="">Todos los tipos</option>
              <option value="capital">Capitales</option>
              <option value="sect">Sectas</option>
              <option value="landmark">Hitos</option>
              <option value="settlement">Aldeas</option>
            </select>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={poiFilter} onChange={(e) => setPoiFilter(e.target.value)} placeholder="Filtrar POIs…"
                className="bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-200 focus:border-amber-700 focus:outline-none w-48" />
            </div>
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-stone-800/60">
          {filteredPois.map((p) => {
            const badge = KIND_LABEL[p.kind];
            return (
              <div key={p.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-stone-800/30 transition-colors">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border w-20 text-center flex-shrink-0 ${badge.cls}`}>{badge.text}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-100 truncate">{p.name}</p>
                  <p className="text-[11px] text-stone-500 truncate">{p.loreNote ?? p.provinceId}</p>
                </div>
                <span className="text-xs font-mono text-stone-400">({p.x}, {p.y})</span>
                <span className="text-[10px] font-mono text-stone-600 hidden md:inline">{p.provinceId}</span>
              </div>
            );
          })}
          {filteredPois.length === 0 && <p className="text-center text-stone-600 text-sm py-10">Ningún POI coincide con el filtro.</p>}
        </div>
      </div>
    </div>
  );
};
