// src/core/data/world/generators/instanceGenerator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Entradas de instancia (cueva / mina / ruinas) ancladas al terreno.
// Determinista y sin estado de carga: cada chunk de 16×16 decide como máximo
// una entrada a partir de su hash, de modo que cualquier tile puede
// consultarse en O(1) (cacheado) sin depender del orden de carga.
// ─────────────────────────────────────────────────────────────────────────────
import { mulberry32, stringToHash } from '../../../utils/prng';
import { WORLD_SEED } from '../seeds/worldSeed';
import { sampleGeoCached } from './geoTileCache';

export type InstanceKind = 'cueva' | 'mina' | 'ruinas';

export interface InstancePoi {
  id: string;
  kind: InstanceKind;
  x: number;
  y: number;
  name: string;
}

export const INSTANCE_CHUNK = 16;
export const INSTANCE_LABEL: Record<InstanceKind, string> = {
  cueva: 'Cueva',
  mina: 'Mina abandonada',
  ruinas: 'Ruinas antiguas',
};
export const INSTANCE_COLOR: Record<InstanceKind, number> = {
  cueva: 0x94a3b8,
  mina: 0xf59e0b,
  ruinas: 0xd4a94e,
};

const NAMES: Record<InstanceKind, readonly string[]> = {
  cueva: [
    'Cueva del Susurro',
    'Gruta de Jade',
    'Caverna de los Mil Ecos',
    'Cueva del Tigre Ciego',
    'Oquedad del Ermitaño',
  ],
  mina: [
    'Mina del Dragón de Cobre',
    'Pozo de la Veta Roja',
    'Mina de Hierro Negro',
    'Galería del Sino',
    'Excavación del Clan Huang',
  ],
  ruinas: [
    'Ruinas de la Secta Olvidada',
    'Templo del Pabellón Roto',
    'Altar de la Luna Menguante',
    'Ciudadela de Barro',
    'Patio de las Mil Columnas',
  ],
};

const cache = new Map<string, InstancePoi | null>();

function isOpenLand(x: number, y: number): boolean {
  const kind = sampleGeoCached(x, y).kind;
  return kind === null || kind === 'desierto' || kind === 'ribera';
}

function isMountainKind(kind: string | null | undefined): boolean {
  return kind === 'montania_alta' || kind === 'montania_media' || kind === 'estribacion';
}

function hasMountainNear(x: number, y: number): boolean {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (isMountainKind(sampleGeoCached(x + dx, y + dy).kind)) return true;
    }
  }
  return false;
}

/** Datos de la entrada (si existe) que pertenece a un chunk concreto. */
export function getInstanceInChunk(chunkX: number, chunkY: number): InstancePoi | null {
  const key = `${chunkX},${chunkY}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const poi = computeChunkInstance(chunkX, chunkY);
  cache.set(key, poi);
  return poi;
}

function computeChunkInstance(chunkX: number, chunkY: number): InstancePoi | null {
  const rng = mulberry32(stringToHash(`instance_v1_${chunkX}_${chunkY}`));
  if (rng() > 0.4) return null;

  // Barrido determinista desde un offset aleatorio: el primer solar libre.
  const margin = 2;
  const inner = INSTANCE_CHUNK - margin * 2;
  const total = inner * inner;
  const start = Math.floor(rng() * total);

  let spot: { x: number; y: number } | null = null;
  for (let k = 0; k < total; k++) {
    const idx = (start + k) % total;
    const x = chunkX * INSTANCE_CHUNK + margin + (idx % inner);
    const y = chunkY * INSTANCE_CHUNK + margin + Math.floor(idx / inner);
    if (isOpenLand(x, y)) {
      spot = { x, y };
      break;
    }
  }
  if (!spot) return null;

  let kind: InstanceKind;
  if (hasMountainNear(spot.x, spot.y)) {
    kind = rng() < 0.68 ? 'cueva' : 'mina';
  } else if (rng() < 0.55) {
    kind = 'ruinas';
  } else {
    return null;
  }

  const names = NAMES[kind];
  return {
    id: `inst_${spot.x}_${spot.y}`,
    kind,
    x: spot.x,
    y: spot.y,
    name: names[Math.floor(rng() * names.length)] ?? names[0],
  };
}

/** Entrada de instancia exactamente en este tile (o null). */
export function getInstanceAt(x: number, y: number): InstancePoi | null {
  const { width, height } = WORLD_SEED.gridSize;
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const poi = getInstanceInChunk(Math.floor(x / INSTANCE_CHUNK), Math.floor(y / INSTANCE_CHUNK));
  return poi && poi.x === x && poi.y === y ? poi : null;
}
