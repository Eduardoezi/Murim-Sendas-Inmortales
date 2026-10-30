// Persistencia local de la última tesela pisada. El mundo es determinista y el
// jugador se mueve por coordenadas de mapa, así que guardar la tesela basta
// para reanudar en el mismo punto tras recargar o remontar la escena.
export const PLAYER_POSITION_KEY = 'murim_world_pos';

export interface TilePosition {
  x: number;
  y: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadPlayerPosition(
  storage: StorageLike | null = defaultStorage(),
): TilePosition | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PLAYER_POSITION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown } | null;
    if (!parsed || typeof parsed !== 'object') return null;

    const { x, y } = parsed;
    if (typeof x !== 'number' || typeof y !== 'number') return null;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return { x: Math.round(x), y: Math.round(y) };
  } catch {
    return null;
  }
}

export function savePlayerPosition(
  pos: TilePosition,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(
      PLAYER_POSITION_KEY,
      JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }),
    );
  } catch {
    // Modo privado o cuota llena: la sesión continúa sin persistencia.
  }
}
