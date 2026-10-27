// src/core/services/adminService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capa de acceso a las rutas GLOBALES de administración (/api/admin/*).
// Separación estricta: el Dashboard nunca lee /api/player/me (eso es sesión
// del jugador y se gestiona en playerService/usePlayerStore).
// ─────────────────────────────────────────────────────────────────────────────
import { useAuthStore } from '../store/useAuthStore';

const BASE = '/api';

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
  const data = await res.json();
  if (!data.success) throw new Error(data.message || `Error en ${path}`);
  return data as T;
}

export interface AdminDashboardData {
  totalPlayers: number;      // personajes en la BD (COUNT(*) FROM players)
  totalAccounts: number;     // cuentas registradas (COUNT(*) FROM users)
  onlinePlayers: number;     // con last_seen < 5 min
  activeChunks: number;      // ventanas de streaming vivas (= sesiones activas)
  totalChunks: number;       // grid real del mundo (1000×1000 / 16²)
  chunkSize: number;
  activeBeasts: number;      // estimación determinista hasta haber tabla beasts
  pois: { capitals: number; sects: number; landmarks: number };
  recentEvents: Array<{ event: string; n: number }>;
}

/** Estado GLOBAL del reino: TODOS los personajes (no solo el logueado) + POIs sincronizados. */
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

export const adminService = {
  getDashboard: () =>
    request<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard'),

  getWorldState: () =>
    request<{ success: boolean; data: AdminWorldData }>('/admin/world'),

  /** Sube el layout real del reino (World Layout Registry) para que el admin lo cuente. */
  syncPois: (pois: Array<{ id: string; name: string; kind: string; x: number; y: number }>) =>
    request<{ success: boolean; synced: number }>('/admin/sync-pois', {
      method: 'POST',
      body: JSON.stringify({ pois }),
    }),

  /** Registra un evento de sesión visible en el feed del dashboard. Fire-and-forget. */
  logEvent: (event: string) =>
    request<{ success: boolean }>('/admin/event', {
      method: 'POST',
      body: JSON.stringify({ event }),
    }).catch(() => undefined),
};
