export type Alignment = 'Ortodoxa' | 'Heterodoxa' | 'Demoníaca' | 'Neutral';
export type FactionType = 'Secta' | 'Clan' | 'Culto' | 'Gremio' | 'Organización';

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  alignment: Alignment;
  element: string; // Fuego, Agua, etc.
  description: string;
  powerLevel: number; // 1 a 10
  territory: string; // Provincia donde operan
}

export interface Beast {
  isAquatic: boolean;
  id: string;
  name: string;
  tier: 'Mutante' | 'Desolada' | 'Ancestral' | 'Primordial';
  habitat: string;
  keyMaterial: string;
  dangerLevel: number; // 1 a 10
}

export interface Flora {
  id: string;
  name: string;
  rarity: 'Común' | 'Rara' | 'Épica' | 'Legendaria';
  effect: string;
  habitat: string;
}