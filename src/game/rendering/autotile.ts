// src/game/rendering/autotile.ts
// Máscara de bits isométrica pura (sin Phaser) para elegir las piezas de borde.
// Bits: N (y-1) = 1, E (x+1) = 2, S (y+1) = 4, W (x-1) = 8.

export type IsoSide = 'n' | 'e' | 's' | 'w';

export const SIDES: readonly IsoSide[] = ['n', 'e', 's', 'w'];

export const SIDE_BIT: Record<IsoSide, number> = {
  n: 1,
  e: 2,
  s: 4,
  w: 8,
};

export interface NeighborTypes {
  n?: string;
  e?: string;
  s?: string;
  w?: string;
}

/**
 * Agrupa los lados cuyo vecino comparte tipo en una máscara de 4 bits.
 * Un tile con dos vecinos de arena agrupa ambos lados en una sola pieza.
 */
export function masksByNeighborType(
  centerType: string,
  neighbors: NeighborTypes,
): Map<string, number> {
  const masks = new Map<string, number>();
  for (const side of SIDES) {
    const type = neighbors[side];
    if (!type || type === centerType) continue;
    masks.set(type, (masks.get(type) ?? 0) | SIDE_BIT[side]);
  }
  return masks;
}

export function sidesInMask(mask: number): IsoSide[] {
  return SIDES.filter((side) => (mask & SIDE_BIT[side]) !== 0);
}

export function maskFromSides(sides: Iterable<IsoSide>): number {
  let mask = 0;
  for (const side of sides) mask |= SIDE_BIT[side];
  return mask;
}
