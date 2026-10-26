// src/core/utils/prng.ts

/**
 * Implementación del algoritmo Mulberry32 (GDD V3 - Sección 16.1)
 * Genera una función RNG determinista a partir de una semilla numérica.
 */
export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * Convierte un string (ej: 'seed_sects') en un número hash para usar como semilla.
 */
export function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return hash;
}

