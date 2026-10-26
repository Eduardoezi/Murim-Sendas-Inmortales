// src/core/data/world/generators/terrainGenerator.ts
import { stringToHash } from '../../../utils/prng';
import { BiomeType } from '../types';

export type TileType = 'hierba' | 'agua' | 'arena' | 'nieve';

export interface Tile {
  waterDepth: number;
  x: number;
  y: number;
  type: TileType;
  density: number; 
  isEdgeWater: boolean; 
  isNearWater: boolean; 
}

// 1. Curva Seno con MAYOR frecuencia para que se note el serpenteo
export function getRiverCenterY(x: number): number {
  // Aumentamos el multiplicador de 0.05 a 0.15
  return x + Math.sin(x * 0.15) * 12;
}

export function getRiverWidth(x: number): number {
  // Ancho variable más dramático
  return 4.5 + Math.sin(x * 0.2) * 2.5;
}

function getForestDensity(x: number, y: number, seed: number): number {
  const noise = (Math.sin(x * 0.05 + seed) * Math.cos(y * 0.05 + seed) + 1) / 2;
  if (noise < 0.2 || noise > 0.8) return 1.0; 
  if (noise < 0.4 || noise > 0.6) return 0.6;
  if (noise < 0.45 || noise > 0.55) return 0.25;
  return 0.07;
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

      tiles.push({
        x: mapX, y: mapY, type, density, isEdgeWater, isNearWater, waterDepth
      });
    }
  }
  return tiles;
}