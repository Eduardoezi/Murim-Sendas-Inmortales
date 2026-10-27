// src/core/services/adminService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capa única de acceso a /api/admin/* para el portal de administración.
// Todo está tipado contra src/types/admin.types.ts — prohibido `any`.
// El backend es autoritativo: aquí solo se consumen respuestas ya calculadas.
// ─────────────────────────────────────────────────────────────────────────────
import { useAuthStore } from '../store/useAuthStore';
import type {
  AdminApiResponse,
  DashboardPayload,
  PaginatedPlayers,
  PlayerDetailPayload,
  PlayerPatch,
  WorldSeedInfo,
  PoiRow,
  ChunkPreviewPayload,
  RegenerateChunkPayload,
  BeastRow,
  BeastInput,
  FloraRow,
  FloraInput,
  FactionRow,
  FactionInput,
  LogEntry,
  LogLevel,
  CommandResult,
} from '../../types/admin.types';

const BASE = '/api/admin';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    const body = (await res.json().catch(() => null)) as AdminApiResponse<never> | null;
    throw new Error(body?.message ?? (res.status === 401 ? 'Sesión expirada: vuelve a iniciar sesión.' : 'Prohibido: se requieren privilegios de administrador.'));
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as AdminApiResponse<never> | null;
    throw new Error(body?.message ?? `Error HTTP ${res.status} en ${path}`);
  }
  const data = (await res.json()) as AdminApiResponse<T>;
  if (!data.success || data.data === undefined) throw new Error(data.message || `Error en ${path}`);
  return data.data;
}

export interface PlayersQuery {
  page: number;
  pageSize?: number;
  q?: string;
}

export const adminService = {
  // ── A. Dashboard ──
  getDashboard: () => request<DashboardPayload>('/dashboard'),

  // ── B. Jugadores ──
  getPlayers: ({ page, pageSize = 10, q = '' }: PlayersQuery) =>
    request<PaginatedPlayers>(`/players?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`),

  getPlayerDetail: (id: string) => request<PlayerDetailPayload>(`/players/${encodeURIComponent(id)}`),

  patchPlayer: (id: string, patch: PlayerPatch) =>
    request<{ player: PlayerDetailPayload['player'] }>(`/players/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // ── C. Mundo y POIs ──
  getWorldSeed: () => request<WorldSeedInfo>('/world/seed'),
  getPois: () => request<PoiRow[]>('/world/pois'),
  /** Sin payload: el servidor re-siembra POIs desde el generador determinista
   *  (router modular, envelope { success, data }). Con payload: sube el World
   *  Layout Registry real del cliente al endpoint de upsert (envoltorio plano). */
  syncPois: async (pois?: Array<{ id: string; name: string; kind: string; x: number; y: number }>): Promise<{ synced: number }> => {
    if (pois) {
      const r = await rawPost<{ success: boolean; synced: number }>(`${BASE}/sync-pois`, { pois });
      return { synced: r.synced };
    }
    return request<{ synced: number }>('/world/pois/sync', { method: 'POST' });
  },

  /** Estado GLOBAL del reino: todos los personajes + POIs sincronizados. */
  getWorldState: () => request<AdminWorldData>('/world'),
  getChunkPreview: (cx: number, cy: number) => request<ChunkPreviewPayload>(`/world/chunk/${cx}/${cy}`),
  regenerateChunk: (cx: number, cy: number) =>
    request<RegenerateChunkPayload>(`/world/chunk/${cx}/${cy}/regenerate`, { method: 'POST' }),

  // ── D. Fauna, Flora y Facciones (CRUD) ──
  getBeasts: () => request<BeastRow[]>('/beasts'),
  createBeast: (input: BeastInput) =>
    request<BeastRow>('/beasts', { method: 'POST', body: JSON.stringify(input) }),
  patchBeast: (id: string, patch: Partial<BeastInput>) =>
    request<BeastRow>(`/beasts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteBeast: (id: string) =>
    request<{ deleted: string }>(`/beasts/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getFlora: () => request<FloraRow[]>('/flora'),
  createFlora: (input: FloraInput) =>
    request<FloraRow>('/flora', { method: 'POST', body: JSON.stringify(input) }),
  patchFlora: (id: string, patch: Partial<FloraInput>) =>
    request<FloraRow>(`/flora/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteFlora: (id: string) =>
    request<{ deleted: string }>(`/flora/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getFactions: () => request<FactionRow[]>('/factions'),
  createFaction: (input: FactionInput) =>
    request<FactionRow>('/factions', { method: 'POST', body: JSON.stringify(input) }),
  patchFaction: (id: string, patch: Partial<FactionInput>) =>
    request<FactionRow>(`/factions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteFaction: (id: string) =>
    request<{ deleted: string }>(`/factions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ── E. Logs y consola de debug ──
  getLogs: (opts: { level?: LogLevel; q?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.level) params.set('level', opts.level);
    if (opts.q) params.set('q', opts.q);
    if (opts.limit) params.set('limit', String(opts.limit));
    return request<LogEntry[]>(`/logs?${params.toString()}`);
  },

  /** URL SSE con el token por query (EventSource no permite headers). */
  logsStreamUrl: (): string => {
    const token = useAuthStore.getState().token ?? '';
    return `${BASE}/logs/stream?token=${encodeURIComponent(token)}`;
  },

  runCommand: (command: string) =>
    request<CommandResult>('/debug/command', { method: 'POST', body: JSON.stringify({ command }) }),
  /** Registra un evento de sesión visible en el feed del dashboard.
   *  Endpoint público autenticado para jugadores (fuera de /api/admin/*).
   *  Fire-and-forget: nunca rompe el loop de juego si el servidor no responde. */
  logEvent: (event: string) =>
    rawPost<{ success: boolean }>('/api/events', { event }).catch(() => undefined),
};

/**
 * POST directo a rutas registradas FUERA del router modular de admin
 * (`/api/events` para jugadores) o con envoltorio plano `{ success, ... }`
 * (`/api/admin/sync-pois`). No usan `request<T>` porque ese helper exige el
 * envelope `{ success, data }` del router B–E. `path` es la URL absoluta.
 */
async function rawPost<T>(url: string, body: unknown): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`Error HTTP ${res.status} en ${url}`);
  return (await res.json()) as T;
}

// ─── Tipos auxiliares de la vista global del reino (GET /api/admin/world) ───
export interface AdminWorldData {
  players: Array<{
    id: string;
    name: string;
    realm: string;
    pos: { x: number; y: number } | null;
    online: boolean;
    lastSeen: number | null;
  }>;
  pois: Array<{ id: string; name: string; kind: string; x: number; y: number }>;
}
