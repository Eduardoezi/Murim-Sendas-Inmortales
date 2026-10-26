// src/core/data/world/generators/terrainGenerator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capa de terreno por chunk. Dos modos:
//   1. GEOGRÁFICO (nuevo, recomendado): la geografía real de China (geoChina +
//      geoSampler) es la fuente de verdad. El bioma de provincia solo modula
//      densidad de vegetación en tierra libre.
//   2. LEGACY: río senoidal matemático (se conserva para no romper nada).
// La bandera USE_GEO decide cuál se usa; activada por defecto.
// ─────────────────────────────────────────────────────────────────────────────
import { stringToHash } from '../../../utils/prng';
import { BiomeType } from '../types';
import { sampleGeo, naturalBiomeAt } from './geoSampler';
import { sampleGeoCached, getBiomeCached } from './geoTileCache';

export type TileType = 'hierba' | 'agua' | 'arena' | 'nieve' | 'montana' | 'pantano';

export interface Tile {
  waterDepth: number;
  x: number;
  y: number;
  type: TileType;
  density: number; 
  isEdgeWater: boolean; 
  isNearWater: boolean;
  /** Tramo navegable del Huang He / Yangtsé / canal (barcas/pesca futuras). */
  navigable?: boolean;
  /** ID geográfico real si aplica (river_yellow, desert_gobi, peak_wudang...). */
  geoId?: string;
}

/** Bandera de migra: modo geográfico vs legado. */
export const USE_GEO = true;

// 1. Curva Seno con MAYOR frecuencia para que se note el serpenteo (LEGACY)
export function getRiverCenterY(x: number): number {
  return x + Math.sin(x * 0.15) * 12;
}

export function getRiverWidth(x: number): number {
  return 4.5 + Math.sin(x * 0.2) * 2.5;
}

function getForestDensity(x: number, y: number, seed: number): number {
  const noise = (Math.sin(x * 0.05 + seed) * Math.cos(y * 0.05 + seed) + 1) / 2;
  if (noise < 0.2 || noise > 0.8) return 1.0; 
  if (noise < 0.4 || noise > 0.6) return 0.6;
  if (noise < 0.45 || noise > 0.55) return 0.25;
  return 0.07;
}

/** Densidad de vegetación según bioma MODULADOR sobre tierra libre geográfica. */
function biomeVegetation(biome: BiomeType): number {
  switch (biome) {
    case 'Bosque': return 0.9;
    case 'Estepa': return 0.25;
    case 'Costa': return 0.35;
    case 'Montaña': return 0.5;
    case 'Pantano': return 0.7;
    case 'Nieve': return 0.2;
    case 'Desierto': return 0.05;
  }
}

// ── MODO GEOGRÁFICO ──────────────────────────────────────────────────────────
function geoTileFor(mapX: number, mapY: number, provinceBiome: BiomeType, seedNum: number): Tile {
  // CACHE: cada tile se muestrea una sola vez de por vida (fix lag carga de chunks)
  const g = sampleGeoCached(mapX, mapY);
  const base: Tile = { x: mapX, y: mapY, type: 'hierba', density: 0, isEdgeWater: false, isNearWater: false, waterDepth: 0 };

  switch (g.kind) {
    case 'mar':
      return { ...base, type: 'agua', waterDepth: 1, geoId: 'sea' };
    case 'rio':
      return { ...base, type: 'agua', waterDepth: 1, navigable: g.navigable, geoId: g.riverId };
    case 'canal':
      return { ...base, type: 'agua', waterDepth: 0, navigable: true, geoId: 'grand_canal' };
    case 'lago':
      return { ...base, type: 'agua', waterDepth: 1, geoId: g.lakeId };
    case 'ribera': {
      // llanura aluvial: arena húmeda junto al agua, fértil (densidad media)
      const d = getForestDensity(mapX, mapY, seedNum);
      return { ...base, type: 'arena', isNearWater: true, density: Math.min(1, d * 0.8), geoId: g.riverId };
    }
    case 'desierto':
      return { ...base, type: 'arena', density: 0.02, geoId: g.desertId };
    case 'montania_alta':
      return { ...base, type: 'nieve', density: 0.0, geoId: undefined };
    case 'montania_media':
      return { ...base, type: 'montana', density: 0.15 };
    case 'estribacion':
      return { ...base, type: 'montana', density: 0.35 };
    default: break; // null → tierra libre
  }

  // Tierra libre: usar bioma natural derivado de latitud/ruido + modulador provincial
  const nat = getBiomeCached(mapX, mapY);
  let type: TileType = 'hierba';
  if (nat === 'Desierto') type = 'arena';
  else if (nat === 'Nieve') type = 'nieve';
  else if (nat === 'Pantano') type = 'pantano';

  const veg = biomeVegetation(provinceBiome);
  const natFactor = nat === 'Bosque' ? 1.0 : nat === 'Estepa' ? 0.4 : nat === 'Desierto' ? 0.1 : 0.7;
  const density = getForestDensity(mapX, mapY, seedNum) * veg * natFactor;

  // ¿vecino agua? (para palmeras/juncos en ChunkManager)
  const near = [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => {
    if (dx === 0 && dy === 0) return false;
    const n = sampleGeoCached(mapX + dx, mapY + dy);
    return n.kind === 'rio' || n.kind === 'lago' || n.kind === 'mar' || n.kind === 'canal';
  }));

  return { ...base, type, density, isNearWater: near };
}

export function generateChunkTerrain(
  provinceSeed: string,
  biome: BiomeType,
  chunkX: number,
  chunkY: number,
  chunkSize: number = 16
): Tile[] {
  const seedNum = stringToHash(provinceSeed) / 1000;
  const tiles: Tile[] = [];

  for (let x = 0; x < chunkSize; x++) {
    for (let y = 0; y < chunkSize; y++) {
      const mapX = chunkX * chunkSize + x;
      const mapY = chunkY * chunkSize + y;

      if (USE_GEO) {
        tiles.push(geoTileFor(mapX, mapY, biome, seedNum));
        continue;
      }

      // ── LEGACY ──
      let type: TileType = 'hierba';
      let density = 0;
      let isEdgeWater = false;
      let isNearWater = false;
      let waterDepth = 0;

      const centerY = getRiverCenterY(mapX);
      const width = getRiverWidth(mapX);
      const dist = Math.abs(mapY - centerY);

      if (dist < width) {
        type = 'agua';
        isEdgeWater = dist > width - 1;
        waterDepth = dist < width * 0.5 ? 1 : 0; 
      } else if (dist < width + 1.5) {
        type = 'arena';
        isNearWater = true;
      } else {
        density = getForestDensity(mapX, mapY, seedNum);
        const isNeighborWater = (cx: number, cy: number) => Math.abs(cy - getRiverCenterY(cx)) < getRiverWidth(cx) + 2.5;
        isNearWater = isNeighborWater(mapX + 1, mapY) || isNeighborWater(mapX - 1, mapY) || 
                      isNeighborWater(mapX, mapY + 1) || isNeighborWater(mapX, mapY - 1);
      }

      tiles.push({ x: mapX, y: mapY, type, density, isEdgeWater, isNearWater, waterDepth });
    }
  }
  return tiles;
}