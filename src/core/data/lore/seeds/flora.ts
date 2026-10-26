// flora.ts
import { Flora } from '../types';

export const MAIN_FLORA: Flora[] = [
  {
    id: 'flora_spirit_grass', name: 'Hierba del Qi Espiritual', rarity: 'Común',
    effect: 'Restaura una pequeña cantidad de Qi.', habitat: 'prov_henan',
  },
  {
    id: 'flora_blood_lotus', name: 'Loto de Sangre Milenario', rarity: 'Épica',
    effect: 'Permite a un cultivador romper un cuello de botella sin tribulación.', habitat: 'prov_hubei',
  },
  {
    id: 'flora_void_crystal', name: 'Cristal del Vacío', rarity: 'Legendaria',
    effect: 'Material necesario para forjar armas de grado Celestial.', habitat: 'prov_xizang',
  },
  // ... (Añade hasta 15)
];