// src/game/utils/jumpNodes.ts
// Nodos de salto en bordes de acantilado. Deterministas y sin estado: cualquier
// tile puede consultarse sin depender de qué chunks estén cargados.
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { getElevationAt, getTileTypeAt } from '../../core/data/world/generators/terrainGenerator';

export interface JumpNode {
  /** Tile bajo desde el que se despega (o al que se cae al saltar hacia abajo). */
  from: { x: number; y: number };
  /** Tile alto, exactamente un nivel de elevación por encima de `from`. */
  to: { x: number; y: number };
}

/**
 * Probabilidad por borde elegible. El briefing pide que no sean comunes: con
 * ~6 % solo una fracción de los bordes de acantilado tiene runa de salto.
 */
export const JUMP_NODE_CHANCE = 0.06;

// Solo caras visibles: el tile bajo queda al sur o al este del alto. Un borde
// norte/oeste es una cara trasera que la meseta oculta.
const HIGH_OFFSETS: ReadonlyArray<readonly [number, number]> = [[0, -1], [-1, 0]];

function nodeRoll(lowX: number, lowY: number, highX: number, highY: number): number {
  return mulberry32(stringToHash(`jump_${lowX}_${lowY}_${highX}_${highY}`))();
}

/** Nodo de salto cuyo despegue es exactamente este tile (o null). */
export function jumpNodeForLowTile(lowX: number, lowY: number): JumpNode | null {
  const elevation = getElevationAt(lowX, lowY);
  if (elevation >= 3) return null;
  if (getTileTypeAt(lowX, lowY) === 'agua') return null;

  for (const [dx, dy] of HIGH_OFFSETS) {
    const highX = lowX + dx;
    const highY = lowY + dy;
    if (getElevationAt(highX, highY) !== elevation + 1) continue;
    if (nodeRoll(lowX, lowY, highX, highY) < JUMP_NODE_CHANCE) {
      return { from: { x: lowX, y: lowY }, to: { x: highX, y: highY } };
    }
  }
  return null;
}

function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

/**
 * Nodo más cercano a un tile clicado, a ≤ `radius` de cualquiera de sus dos
 * extremos. Un clic sobre la meseta también encuentra el nodo porque su
 * despegue queda a un tile de distancia.
 */
export function jumpNodeNear(tileX: number, tileY: number, radius = 1): JumpNode | null {
  let best: JumpNode | null = null;
  let bestDistance = Infinity;

  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const node = jumpNodeForLowTile(tileX + dx, tileY + dy);
      if (!node) continue;
      const distance = Math.min(
        chebyshev(tileX, tileY, node.from.x, node.from.y),
        chebyshev(tileX, tileY, node.to.x, node.to.y),
      );
      if (distance > radius || distance >= bestDistance) continue;
      best = node;
      bestDistance = distance;
    }
  }
  return best;
}

/** Nodos cuyo despegue pertenece al chunk (para renderizar sus runas). */
export function jumpNodesInChunk(chunkX: number, chunkY: number, chunkSize: number): JumpNode[] {
  const nodes: JumpNode[] = [];
  const originX = chunkX * chunkSize;
  const originY = chunkY * chunkSize;
  for (let y = 0; y < chunkSize; y++) {
    for (let x = 0; x < chunkSize; x++) {
      const node = jumpNodeForLowTile(originX + x, originY + y);
      if (node) nodes.push(node);
    }
  }
  return nodes;
}
