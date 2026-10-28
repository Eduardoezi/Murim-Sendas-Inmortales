// Fallback de movimiento ("unstick") acotado y verificable.
//
// El A* puede no encontrar ruta cuando el destino está rodeado de props o
// montañas. El fallback original trazaba una línea recta ignorando colisiones
// y atravesaba montañas. Aquí la decisión se aísla en una función pura para
// poder validarla: destino transitable, distancia máxima y sin montaña en la
// línea directa.
import { Point } from '../../core/data/world/types';

export const MAX_UNSTICK_DISTANCE_TILES = 12;

export type UnstickRejection = 'too-far' | 'target-blocked' | 'mountain-in-path';

export type UnstickDecision =
  | { allowed: true; distanceTiles: number; reason?: never }
  | { allowed: false; distanceTiles: number; reason: UnstickRejection };

export interface TileProbe {
  /** Hay un obstáculo físico (árbol, montaña renderizada) en el tile. */
  isBlocked(x: number, y: number): boolean;
  /** El tile es geometría montañosa (cumbre, ladera, estribación). */
  isMountain(x: number, y: number): boolean;
}

export function evaluateUnstick(from: Point, to: Point, probe: TileProbe): UnstickDecision {
  const tx = Math.round(to.x);
  const ty = Math.round(to.y);
  const dx = tx - from.x;
  const dy = ty - from.y;
  const distanceTiles = Math.hypot(dx, dy);

  if (distanceTiles > MAX_UNSTICK_DISTANCE_TILES) {
    return { allowed: false, distanceTiles, reason: 'too-far' };
  }
  if (probe.isBlocked(tx, ty)) {
    return { allowed: false, distanceTiles, reason: 'target-blocked' };
  }

  const steps = Math.max(1, Math.ceil(distanceTiles));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(from.x + dx * t);
    const y = Math.round(from.y + dy * t);
    if (probe.isMountain(x, y)) {
      return { allowed: false, distanceTiles, reason: 'mountain-in-path' };
    }
  }

  return { allowed: true, distanceTiles };
}
