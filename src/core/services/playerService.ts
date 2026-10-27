// src/core/services/playerService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capa única de acceso a la API del jugador. Todo lo que la interfaz muestra
// como "estado del personaje" proviene de aquí (SQLite vía Express), nunca de
// literales en componentes.
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

export interface ServerPlayerRow {
  id: string;
  name: string;
  gender: string;
  birth_date: string | null;
  origin: string | null;
  faction: string | null;
  alignment: string | null;
  realm_name: string;
  stats_json: Record<string, number>;
  appearance_json: Record<string, unknown> | null;
  // Columnas de progresión (agregadas por migración)
  hp?: number | null;
  max_hp?: number | null;
  qi?: number | null;
  max_qi?: number | null;
  spirit_stones?: number | null;
  sect_merits?: number | null;
  cb_actual?: number | null;
  cb_requerido?: number | null;
  x?: number | null;
  y?: number | null;
}

export interface InventoryItemRow {
  id: number;
  item_key: string;
  name: string;
  category: string;
  quantity: number;
  description: string | null;
}

export const playerService = {
  getMe: () =>
    request<{ success: boolean; player: ServerPlayerRow | null }>('/player/me'),

  saveProgress: (progress: {
    hp: number; maxHp: number; qi: number; maxQi: number;
    spiritStones: number; sectMerits: number;
    cbActual: number; cbRequerido: number;
    x?: number; y?: number;
  }) =>
    request<{ success: boolean; player: ServerPlayerRow }>('/player/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    }),

  meditateTick: (ganancia: number) =>
    request<{
      success: boolean;
      cb_actual: number; cb_requerido: number;
      breakthrough: boolean; realm_name: string;
    }>('/player/meditate', {
      method: 'POST',
      body: JSON.stringify({ ganancia }),
    }),

  getInventory: () =>
    request<{ success: boolean; items: InventoryItemRow[]; capacity: number }>('/player/inventory'),
};
