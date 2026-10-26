// src/core/data/world/generators/buildingGenerator.ts
import { mulberry32, stringToHash } from './prng';

const PREFIXES = ['Gran', 'Real', 'Antiguo', 'Oscuro', 'Brillante', 'Sagrado', 'Maldito', 'Celestial', 'Prohibido'];
const NOUNS = ['Bazar', 'Forja', 'Taberna', 'Pabellón', 'Tienda', 'Mercado', 'Taller', 'Santuario'];

/**
 * Genera un nombre único y determinista para un edificio.
 * @param seedString La semilla única del edificio (ej: "prov_shaanxi_set_capital_b_0")
 * @param type El tipo de edificio (ej: "Forja")
 * @param tier El nivel de desarrollo (1-4) para añadir adjetivos de calidad
 */
export function generateBuildingName(seedString: string, type: string, tier: number): string {
  const rng = mulberry32(stringToHash(seedString));
  
  const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  
  // Si es un edificio de alto nivel, le añadimos un título honorífico
  if (tier >= 3) {
    const highTierTitles = ['del Dragón', 'de la Espada', 'del Fénix', 'del Emperador'];
    const title = highTierTitles[Math.floor(rng() * highTierTitles.length)];
    return `${prefix} ${noun} ${title}`;
  }
  
  return `${prefix} ${noun}`;
}