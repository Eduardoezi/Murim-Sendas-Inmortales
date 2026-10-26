// src/core/data/world/generators/faunaGenerator.ts
import { mulberry32, stringToHash } from '../../../utils/prng';
import { MAIN_FAUNA } from '../../lore/seeds/fauna' ; // Asegúrate de que esta ruta sea correcta

export interface SpawnedBeast {
  id: string;
  name: string;
  x: number;
  y: number;
  tier: string;
  isAquatic: boolean;
}

export function generateChunkFauna(
  provinceId: string,
  chunkX: number,
  chunkY: number,
  chunkSize: number = 16
): SpawnedBeast[] {
  const beasts: SpawnedBeast[] = [];
  const chunkSeed = stringToHash(`fauna_${provinceId}_${chunkX}_${chunkY}`);
  const rng = mulberry32(chunkSeed);

  // 1. Probabilidad de que aparezca fauna en este chunk (ej. 30% de probabilidad)
  if (rng() > 0.3) return beasts;

  // 2. Filtrar la fauna que pertenece a esta provincia
  const localFauna = MAIN_FAUNA.filter(b => b.habitat === provinceId);
  if (localFauna.length === 0) return beasts;

  // 3. Elegir cuántos animales aparecen (1 o 2 máximo por chunk)
  const numBeasts = Math.floor(rng() * 2) + 1;

  for (let i = 0; i < numBeasts; i++) {
    const beastTemplate = localFauna[Math.floor(rng() * localFauna.length)];
    
    // Posición aleatoria dentro del chunk
    const localX = chunkX * chunkSize + Math.floor(rng() * chunkSize);
    const localY = chunkY * chunkSize + Math.floor(rng() * chunkSize);

    beasts.push({
      id: `${beastTemplate.id}_${chunkX}_${chunkY}_${i}`,
      name: beastTemplate.name,
      tier: beastTemplate.tier,
      x: localX,
      y: localY,
      isAquatic: beastTemplate.isAquatic ?? false,
    });
  }

  return beasts;
}