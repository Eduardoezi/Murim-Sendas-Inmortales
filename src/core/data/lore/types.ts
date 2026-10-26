export type Alignment = 'Ortodoxa' | 'Heterodoxa' | 'Demoníaca' | 'Neutral';
export type FactionType = 'Secta' | 'Clan' | 'Culto' | 'Gremio' | 'Organización';

export interface Faction {
  id: string;
  name: string;
  type: FactionType;
  alignment: Alignment;
  element: string;
  description: string;
  powerLevel: number;
  territory: string;
}

export interface Beast {
  /** Opcional: si no se define, se asume terrestre. */
  isAquatic?: boolean;
  id: string;
  name: string;
  tier: 'Mutante' | 'Desolada' | 'Ancestral' | 'Primordial';
  habitat: string;
  keyMaterial: string;
  dangerLevel: number;
}

export interface Flora {
  id: string;
  name: string;
  rarity: 'Común' | 'Rara' | 'Épica' | 'Legendaria';
  effect: string;
  habitat: string;
}