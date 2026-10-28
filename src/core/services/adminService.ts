// src/core/services/adminService.ts
import { useAuthStore } from '../store/useAuthStore';
import type {
  AdminApiResponse,
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
  RecentEvent,
} from '../../types/admin.types';
import { MinimapPoiKind } from '../data/world/geoPois';

// Unificamos la base a /api/admin
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
  
  const data = (await res.json()) as AdminApiResponse<T>;
  if (!data.success || data.data === undefined) {
    throw new Error(data.message || `Error en ${path}`);
  }
  return data.data;
}

export interface PlayersQuery {
  page: number;
  pageSize?: number;
  q?: string;
}

// ── Tipos de Datos para el Dashboard ──
export interface AdminDashboardData {
  activity: any;
  metrics: any;
  totalPlayers: number;
  totalAccounts: number;
  onlinePlayers: number;
  activeChunks: number;
  totalChunks: number;
  chunkSize: number;
  activeBeasts: number;
  pois: { capitals: number; sects: number; landmarks: number };
  recentEvents: RecentEvent[];
}

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

// ── Servicio Unificado ──
export const adminService = {
  // Dashboard
  getDashboard: () => request<AdminDashboardData>('/dashboard'),
  getWorldState: () => request<AdminWorldData>('/world'),

  // Jugadores
  getPlayers: ({ page, pageSize = 10, q = '' }: PlayersQuery) =>
    request<PaginatedPlayers>(`/players?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`),

  getPlayerDetail: (id: string) => request<PlayerDetailPayload>(`/players/${encodeURIComponent(id)}`),

  patchPlayer: (id: string, patch: PlayerPatch) =>
    request<{ player: PlayerDetailPayload['player'] }>(`/players/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  // Mundo y POIs
  getWorldSeed: () => request<WorldSeedInfo>('/world/seed'),
  getPois: () => request<PoiRow[]>('/world/pois'),
  syncPois: (pois: { id: string; name: string; kind: MinimapPoiKind; x: number; y: number; }[]) =>
    request<{ synced: number }>('/world/pois/sync', {
      method: 'POST',
    }),
  getChunkPreview: (cx: number, cy: number) => request<ChunkPreviewPayload>(`/world/chunk/${cx}/${cy}`),
  regenerateChunk: (cx: number, cy: number) =>
    request<RegenerateChunkPayload>(`/world/chunk/${cx}/${cy}/regenerate`, { method: 'POST' }),

  // Fauna, Flora y Facciones
  getBeasts: () => request<BeastRow[]>('/beasts'),
  createBeast: (input: BeastInput) => request<BeastRow>('/beasts', { method: 'POST', body: JSON.stringify(input) }),
  patchBeast: (id: string, patch: Partial<BeastInput>) => request<BeastRow>(`/beasts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteBeast: (id: string) => request<{ deleted: string }>(`/beasts/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getFlora: () => request<FloraRow[]>('/flora'),
  createFlora: (input: FloraInput) => request<FloraRow>('/flora', { method: 'POST', body: JSON.stringify(input) }),
  patchFlora: (id: string, patch: Partial<FloraInput>) => request<FloraRow>(`/flora/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteFlora: (id: string) => request<{ deleted: string }>(`/flora/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getFactions: () => request<FactionRow[]>('/factions'),
  createFaction: (input: FactionInput) => request<FactionRow>('/factions', { method: 'POST', body: JSON.stringify(input) }),
  patchFaction: (id: string, patch: Partial<FactionInput>) => request<FactionRow>(`/factions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteFaction: (id: string) => request<{ deleted: string }>(`/factions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Logs y Debug
  getLogs: (opts: { level?: LogLevel; q?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.level) params.set('level', opts.level);
    if (opts.q) params.set('q', opts.q);
    if (opts.limit) params.set('limit', String(opts.limit));
    return request<LogEntry[]>(`/logs?${params.toString()}`);
  },

  logsStreamUrl: (): string => {
    const token = useAuthStore.getState().token ?? '';
    return `${BASE}/logs/stream?token=${encodeURIComponent(token)}`;
  },

  runCommand: (command: string) => request<CommandResult>('/debug/command', { method: 'POST', body: JSON.stringify({ command }) }),

  // Eventos
  logEvent: (event: string) => request<{ success: boolean }>('/event', { method: 'POST', body: JSON.stringify({ event }) }).catch(() => undefined),
};