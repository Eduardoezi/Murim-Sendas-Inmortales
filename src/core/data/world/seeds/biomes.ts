import { BiomeType, BiomeConfig } from '../types';


export const BIOME_CONFIGS: Record<BiomeType, BiomeConfig> = {
  Bosque: {
    id: 'Bosque',
    name: 'Bosques y Cuencas Espirituales',
    weight: 25,
    qiDensityModifier: 1.2,
    movementCost: 1.0,
    hazardLevel: 1.2,
    availableFauna: ['beast_crimson_phoenix', 'beast_shadow_wolf'],
    availableFlora: ['flora_dragon_blood_mushroom', 'flora_jade_orchid'],
    description: 'Frondosos bosques repletos de bambú espiritual, niebla mística y refugio de hierbas medicinales.'
  },
  Montaña: {
    id: 'Montaña',
    name: 'Cumbres y Cordilleras Escarpadas',
    weight: 20,
    qiDensityModifier: 1.4,
    movementCost: 1.5,
    hazardLevel: 1.5,
    availableFauna: ['beast_oracle_turtle'],
    availableFlora: ['flora_jade_orchid'],
    description: 'Picos rocosos donde el Qi del cielo es denso, ideales para el cultivo marcial y templos elevados.'
  },
  Desierto: {
    id: 'Desierto',
    name: 'Desiertos Áridos y Arenas del Oeste',
    weight: 15,
    qiDensityModifier: 0.8,
    movementCost: 1.8,
    hazardLevel: 1.8,
    availableFauna: ['beast_shadow_wolf'],
    availableFlora: [],
    description: 'Extensiones desoladas azotadas por tormentas de arena, ruinas olvidadas y dominios de cultos demoníacos.'
  },
  Pantano: {
    id: 'Pantano',
    name: 'Pantanos y Selvas Kársticas',
    weight: 10,
    qiDensityModifier: 1.0,
    movementCost: 2.0,
    hazardLevel: 1.6,
    availableFauna: [],
    availableFlora: ['flora_dragon_blood_mushroom'],
    description: 'Humedales impenetrables cubiertos de vapores venenosos, bestias ponzoñosas y sectas clandestinas.'
  },
  Nieve: {
    id: 'Nieve',
    name: 'Picos Helados y Tundras del Norte',
    weight: 10,
    qiDensityModifier: 1.3,
    movementCost: 1.7,
    hazardLevel: 1.9,
    availableFauna: [],
    availableFlora: ['flora_snow_lotus', 'flora_emperor_ginseng'],
    description: 'Inviernos perpetuos, ventiscas mortales y tierras donde maduran los tesoros botánicos más puros.'
  },
  Costa: {
    id: 'Costa',
    name: 'Litorales y Puertos Marítimos',
    weight: 10,
    qiDensityModifier: 1.1,
    movementCost: 1.0,
    hazardLevel: 1.1,
    availableFauna: [],
    availableFlora: ['flora_jade_orchid'],
    description: 'Rutas fluviales y marítimas prósperas conectadas al comercio exterior, astilleros y redes de información.'
  },
  Estepa: {
    id: 'Estepa',
    name: 'Llanuras Centrales y Estepas',
    weight: 10,
    qiDensityModifier: 1.0,
    movementCost: 0.9,
    hazardLevel: 1.0,
    availableFauna: ['beast_jade_thunder_tiger'],
    availableFlora: [],
    description: 'Vastas llanuras agrícolas y cruces de caminos imperiales, epicentro de la civilización y el poder político.'
  }
};