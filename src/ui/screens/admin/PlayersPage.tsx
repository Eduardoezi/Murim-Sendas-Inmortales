// src/ui/screens/admin/PlayersPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// B. GESTIÓN DE JUGADORES — tabla paginada + buscador + modal de detalle con
// teletransporte (X, Y) y baneo/debaneo. Los datos provienen SIEMPRE del
// backend autoritativo (/api/admin/players*); aquí solo se muestran/editan.
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react';
import { Search, Eye, Ban, RotateCcw, ChevronLeft, ChevronRight, Loader2, MapPin, Save } from 'lucide-react';
import { adminService } from '../../../core/services/adminService';
import { toast } from '../../../core/store/useToastStore';
import type { AdminPlayerRow, PlayerDetailPayload, PlayerPatch } from '../../../types/admin.types';
import { Spinner, ErrorState, PageHeader } from '../../components/admin/Spinner';

const PAGE_SIZE = 10;

const fmtDate = (iso: string | null): string => (iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const DangerBadge = ({ banned }: { banned: number }) =>
  banned === 1 ? (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-800 text-rose-400">
      <Ban className="w-3 h-3" /> BANEADO
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
      Activo
    </span>
  );

export const PlayersPage = () => {
  // ── Estado de la lista ──
  const [players, setPlayers] = useState<AdminPlayerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Estado del modal de detalle ──
  const [detail, setDetail] = useState<PlayerDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tpX, setTpX] = useState('');
  const [tpY, setTpY] = useState('');
  const [banReason, setBanReason] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPlayers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlayers({ page: p, pageSize: PAGE_SIZE, q });
      setPlayers(data.players);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlayers(1, '');
  }, [loadPlayers]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await adminService.getPlayerDetail(id);
      setDetail(d);
      setTpX(String(d.player.x ?? 0));
      setTpY(String(d.player.y ?? 0));
      setBanReason(d.player.ban_reason ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar el detalle del jugador');
    } finally {
      setDetailLoading(false);
    }
  };

  const applyPatch = async (patch: PlayerPatch, successMsg: string): Promise<boolean> => {
    if (!detail) return false;
    setSaving(true);
    try {
      const { player } = await adminService.patchPlayer(detail.player.id, patch);
      setDetail((prev) => (prev ? { ...prev, player } : prev));
      setPlayers((prev) => prev.map((p) => (p.id === player.id ? player : p)));
      toast.success(successMsg);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar los cambios');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const teleport = (): void => {
    const x = Number(tpX), y = Number(tpY);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 999 || y > 999) {
      toast.error('Coordenadas inválidas: usa valores entre 0 y 999.');
      return;
    }
    void applyPatch({ x: Math.round(x), y: Math.round(y) }, `${detail?.player.name ?? 'Jugador'} teletransportado a (${Math.round(x)}, ${Math.round(y)})`);
  };

  const toggleBan = (): void => {
    if (!detail) return;
    const banning = detail.player.banned !== 1;
    void applyPatch(
      { banned: banning, ban_reason: banning ? banReason.trim() || 'Sin motivo especificado' : '' },
      banning ? `Jugador ${detail.player.name} baneado correctamente` : `Jugador ${detail.player.name} debaneado`,
    );
    if (!banning) setBanReason('');
  };

  const quickBan = async (p: AdminPlayerRow, banned: boolean): Promise<void> => {
    try {
      const { player } = await adminService.patchPlayer(p.id, { banned, ban_reason: banned ? 'Baneo rápido desde la tabla' : '' });
      setPlayers((prev) => prev.map((x) => (x.id === player.id ? player : x)));
      if (detail?.player.id === player.id) setDetail((prev) => (prev ? { ...prev, player } : prev));
      toast.success(banned ? `Jugador ${p.name} baneado correctamente` : `Jugador ${p.name} debaneado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el estado del jugador');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Jugadores"
        subtitle={`${total} personajes registrados · busca por nombre, email o ID`}
        actions={
          <form
            onSubmit={(e) => { e.preventDefault(); void loadPlayers(1, query.trim()); }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar jugador…"
                className="bg-stone-950 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-700 focus:outline-none w-56"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-sm font-semibold hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </form>
        }
      />

      {/* Tabla */}
      <div className="bg-stone-900/60 border border-stone-800 rounded-xl overflow-hidden">
        {loading ? (
          <Spinner label="Consultando jugadores…" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadPlayers(page, query.trim())} />
        ) : players.length === 0 ? (
          <p className="text-center text-stone-500 py-12 text-sm">No hay jugadores que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-stone-500 border-b border-stone-800 bg-stone-950/50">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Reino</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Posición</th>
                  <th className="px-4 py-3">HP</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 hidden md:table-cell">Última actividad</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-b border-stone-800/60 hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-stone-100 font-semibold">{p.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">{p.id}</p>
                    </td>
                    <td className="px-4 py-3 text-stone-400 hidden md:table-cell">{p.email ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-300 hidden lg:table-cell">{p.realm_name}</td>
                    <td className="px-4 py-3 text-stone-400 font-mono hidden lg:table-cell">
                      {p.x ?? '—'}, {p.y ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-stone-300">
                      {p.hp ?? '—'}<span className="text-stone-600">/{p.max_hp ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3"><DangerBadge banned={p.banned} /></td>
                    <td className="px-4 py-3 text-stone-500 text-xs hidden md:table-cell">{fmtDate(p.last_activity)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => void openDetail(p.id)}
                          title="Ver detalle"
                          className="p-2 rounded-lg text-cyan-400 hover:bg-cyan-950/50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {p.banned === 1 ? (
                          <button
                            onClick={() => void quickBan(p, false)}
                            title="Debanear"
                            className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-950/50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => void quickBan(p, true)}
                            title="Banear"
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-stone-800 bg-stone-950/40">
            <p className="text-xs text-stone-500">
              Página {page} de {totalPages} · {total} resultados
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => void loadPlayers(page - 1, query.trim())}
                className="p-2 rounded-lg border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => void loadPlayers(page + 1, query.trim())}
                className="p-2 rounded-lg border border-stone-700 text-stone-300 disabled:opacity-30 hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setDetail(null); setDetailLoading(false); }}>
          <div
            className="bg-stone-950 border border-stone-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <Spinner label="Abriendo expediente del cultivador…" />
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-cinzel text-2xl text-amber-100">{detail.player.name}</h2>
                    <p className="text-xs text-stone-500 font-mono mt-1">{detail.player.id} · {detail.player.email ?? 'sin email'}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-stone-500 hover:text-stone-200 text-xl leading-none cursor-pointer">✕</button>
                </div>

                {/* Stats y progreso (solo lectura: el servidor es autoritativo) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'HP', value: `${detail.player.hp ?? 0}/${detail.player.max_hp ?? 0}` },
                    { label: 'Qi', value: `${detail.player.qi ?? 0}/${detail.player.max_qi ?? 0}` },
                    { label: 'Piedras Espirituales', value: String(detail.player.spirit_stones ?? 0) },
                    { label: 'Méritos de Secta', value: String(detail.player.sect_merits ?? 0) },
                  ].map((s) => (
                    <div key={s.label} className="bg-stone-900/70 border border-stone-800 rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wider text-stone-500">{s.label}</p>
                      <p className="text-lg font-mono text-amber-400">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Atributos */}
                  <div>
                    <h3 className="font-cinzel text-sm text-stone-200 mb-3 uppercase tracking-wider">Atributos innatos</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-stone-900/70 border border-stone-800 rounded-lg p-4">
                      {Object.entries(detail.stats).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs py-1 border-b border-stone-800/50 last:border-0">
                          <span className="text-stone-500 capitalize">{k}</span>
                          <span className="text-stone-200 font-mono">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inventario */}
                  <div>
                    <h3 className="font-cinzel text-sm text-stone-200 mb-3 uppercase tracking-wider">Inventario ({detail.inventory.length})</h3>
                    <div className="bg-stone-900/70 border border-stone-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-stone-800/60">
                      {detail.inventory.length === 0 ? (
                        <p className="text-xs text-stone-600 p-4">Inventario vacío.</p>
                      ) : (
                        detail.inventory.map((it) => (
                          <div key={it.id} className="flex justify-between items-center px-4 py-2 text-xs">
                            <div>
                              <p className="text-stone-200">{it.quantity}× {it.name}</p>
                              <p className="text-stone-600">{it.category}</p>
                            </div>
                            <span className="text-stone-500 font-mono text-[10px]">{it.item_key}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Teletransporte */}
                <div className="bg-stone-900/70 border border-stone-800 rounded-lg p-4">
                  <h3 className="font-cinzel text-sm text-stone-200 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" /> Teletransporte forzado
                  </h3>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs text-stone-500">
                      X (0-999)
                      <input value={tpX} onChange={(e) => setTpX(e.target.value)} inputMode="numeric"
                        className="block mt-1 w-24 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 font-mono focus:border-amber-700 focus:outline-none" />
                    </label>
                    <label className="text-xs text-stone-500">
                      Y (0-999)
                      <input value={tpY} onChange={(e) => setTpY(e.target.value)} inputMode="numeric"
                        className="block mt-1 w-24 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 font-mono focus:border-amber-700 focus:outline-none" />
                    </label>
                    <button
                      onClick={teleport}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-sm font-semibold hover:bg-cyan-900/60 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Mover cultivador
                    </button>
                    <span className="text-xs text-stone-600">Posición actual: ({detail.player.x ?? '—'}, {detail.player.y ?? '—'})</span>
                  </div>
                </div>

                {/* Baneo */}
                <div className="bg-stone-900/70 border border-stone-800 rounded-lg p-4">
                  <h3 className="font-cinzel text-sm text-stone-200 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-500" /> Moderación
                  </h3>
                  {detail.player.banned === 1 && detail.player.ban_reason ? (
                    <p className="text-xs text-rose-400 mb-3">Motivo vigente: <em>{detail.player.ban_reason}</em></p>
                  ) : null}
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-xs text-stone-500 flex-1 min-w-40">
                      Motivo del baneo
                      <input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="ej. exploit de daño… "
                        className="block mt-1 w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-rose-700 focus:outline-none" />
                    </label>
                    <button
                      onClick={toggleBan}
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors cursor-pointer border ${
                        detail.player.banned === 1
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                      }`}
                    >
                      {detail.player.banned === 1 ? <><RotateCcw className="w-4 h-4" /> Debanear</> : <><Ban className="w-4 h-4" /> Banear</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
