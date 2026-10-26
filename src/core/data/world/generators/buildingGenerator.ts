// src/core/data/world/generators/buildingGenerator.ts
import { mulberry32, stringToHash } from '../../../utils/prng';
import { BuildingTemplate } from '../seeds/buildingTemplates';

const PREFIXES = ['Gran', 'Real', 'Antiguo', 'Oscuro', 'Brillante', 'Sagrado', 'Prohibido', 'Olvidado'];
const NOUNS = ['Pabellón', 'Bazar', 'Taller', 'Santuario', 'Torre', 'Fuerte'];

export interface Building {
  id: string;
  type: string;
  name: string;
  description: string;
  tier: number;
}

export function generateBuilding(
  settlementSeed: string,
  template: BuildingTemplate,
  tier: number,
  index: number
): Building {
  // Semilla única por edificio (incluye el índice para evitar duplicados exactos)
  const buildingSeed = `${settlementSeed}_b_${index}_${template.type}`;
  const rng = mulberry32(stringToHash(buildingSeed));

  let finalName = template.type;

  // Si el tier es alto, generamos un nombre poético
  if (tier >= 3) {
    const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)];
    const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
    const title = ['del Dragón', 'de la Espada', 'del Fénix', 'del Emperador', 'del Loto'][Math.floor(rng() * 5)];
    finalName = `${prefix} ${noun} ${title}`;
  } else {
    // En tiers bajos, nombres más simples
    finalName = `${template.type} ${['Local', 'del Pueblo', 'del Camino', 'Antiguo'][Math.floor(rng() * 4)]}`;
  }

  return {
    id: buildingSeed,
    type: template.type,
    name: finalName,
    description: template.description,
    tier,
  };
}