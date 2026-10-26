import { mulberry32, stringToHash } from '../../../utils/prng'; 
import { Faction, Beast, Flora, Alignment } from '../types';

const PREFIXES = ['Tian', 'Long', 'Xue', 'Yun', 'Xiao', 'Qing', 'Huang', 'Zi', 'Jin', 'Bai'];
const SUFFIXES = ['Men', 'Pai', 'Ge', 'Zong', 'Gong', 'Tang', 'Jiao', 'Hui'];
const ELEMENTS = ['Fuego', 'Agua', 'Madera', 'Tierra', 'Metal', 'Rayo', 'Viento'];
const ALIGNMENTS: Alignment[] = ['Ortodoxa', 'Heterodoxa', 'Demoníaca', 'Neutral'];

export function generateFactions(seedString: string, type: Faction['type'], count: number): Faction[] {
  const seed = stringToHash(seedString);
  const rng = mulberry32(seed);
  const factions: Faction[] = [];

  for (let i = 0; i < count; i++) {
    const name = `${PREFIXES[Math.floor(rng() * PREFIXES.length)]} ${SUFFIXES[Math.floor(rng() * SUFFIXES.length)]}`;
    const alignment = ALIGNMENTS[Math.floor(rng() * ALIGNMENTS.length)];
    const element = ELEMENTS[Math.floor(rng() * ELEMENTS.length)];
    
    factions.push({
      id: `${type.toLowerCase()}_gen_${i}`,
      name: name,
      type: type,
      alignment: alignment,
      element: element,
      description: `Una ${type} ${alignment.toLowerCase()} que domina el Qi de ${element}.`,
      powerLevel: Math.floor(rng() * 10) + 1,
      territory: `prov_gen_${Math.floor(rng() * 25)}`
    });
  }
  return factions;
}

export function generateFauna(seedString: string, count: number): Beast[] {
  const seed = stringToHash(seedString);
  const rng = mulberry32(seed);
  const beasts: Beast[] = [];
  const TIERS: Beast['tier'][] = ['Mutante', 'Desolada', 'Ancestral', 'Primordial'];

  for (let i = 0; i < count; i++) {
    const name = `${PREFIXES[Math.floor(rng() * PREFIXES.length)]} ${['Lobo', 'Tigre', 'Serpiente', 'Águila', 'Dragón'][Math.floor(rng() * 5)]}`;
    beasts.push({
      id: `beast_gen_${i}`,
      name: name,
      tier: TIERS[Math.floor(rng() * TIERS.length)],
      habitat: `prov_gen_${Math.floor(rng() * 25)}`,
      keyMaterial: `Colmillo de ${name}`,
      dangerLevel: Math.floor(rng() * 10) + 1
    });
  }
  return beasts;
}

export function generateFlora(seedString: string, count: number): Flora[] {
  const seed = stringToHash(seedString);
  const rng = mulberry32(seed);
  const floraList: Flora[] = [];
  const RARITIES: Flora['rarity'][] = ['Común', 'Rara', 'Épica', 'Legendaria'];

  for (let i = 0; i < count; i++) {
    const name = `${PREFIXES[Math.floor(rng() * PREFIXES.length)]} ${['Flor', 'Raíz', 'Hongo', 'Loto', 'Hierba'][Math.floor(rng() * 5)]}`;
    floraList.push({
      id: `flora_gen_${i}`,
      name: name,
      rarity: RARITIES[Math.floor(rng() * RARITIES.length)],
      effect: `Efecto alquímico del Qi de ${ELEMENTS[Math.floor(rng() * ELEMENTS.length)]}.`,
      habitat: `prov_gen_${Math.floor(rng() * 25)}`
    });
  }
  return floraList;
}