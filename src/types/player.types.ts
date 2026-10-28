//Player.types.ts
// CONTRATO CANÓNICO DE TIPOS - GDD MAESTRO V3 (SECCIÓN 3, 4 y 16)
// NO MODIFICAR NI ELIMINAR CAMPOS SIN ACTUALIZAR EL GDD

export interface CultivatorAttributes {
  fuerza: number;        // Daño físico y peso
  destreza: number;      // Velocidad, esquiva, críticos
  constitucion: number;  // Base de Vida (HP)
  inteligencia: number;  // Capacidad de aprender técnicas
  percepcion: number;    // Detección de peligro y absorción de Qi
  astucia: number;       // Comercio, estratagema, subterfugio
  voluntad: number;      // Resistencia a la tribulación, rupturas
  suerte: number;        // Encuentros fortuitos y calidad de botín
  carisma: number;       // Influencia, diplomacia y reclutamiento
  sabiduria: number;     // Eficiencia de comprensión del Dao
}

export interface PlayerAppearance {
  skinTone: string;
  hairStyle: number;
  hairColor: string;
  eyeType: number;
  eyeColor: string;
  eyebrowType: number;
  mouthType: number;
  noseType: number;
  outfitColor: string;
  accessoryType: number; // 0 = Ninguno, 1 = Corona, 2 = Horquilla
}

/** Género jugable según el creador de personaje (contrato con la BD). */
export type PlayerGender = 'Hombre' | 'Mujer' | 'Otro';

/** Armas que el avatar procedural sabe dibujar. */
export type WeaponType = 'none' | 'wooden-sword' | 'iron-sword' | 'frost-sword';

/** Armaduras que alteran el polígono y la paleta del torso. */
export type ArmorType = 'disciple' | 'jade' | 'crimson';

export interface PlayerEquipment {
  weapon: WeaponType;
  armor: ArmorType;
}

export type DantianScale = 
  | 'Gota' | 'Cáliz' | 'Estanque' | 'Lago' 
  | 'Mar' | 'Océano' | 'Firmamento' | 'Cosmos' | 'Primordial';

export type MortalRealm = 
  | 'Refinamiento de Qi'
  | 'Establecimiento de Fundación'
  | 'Núcleo Dorado'
  | 'Alma Naciente'
  | 'Formación del Espíritu'
  | 'Vacío de Fusión Corporal'
  | 'Tribulación de Trascendencia'
  | 'Iluminación';

export interface PlayerData {
  id: string;
  name: string;
  gender: PlayerGender;
  birthdate?: string;
  lineage: string;
  appearance: PlayerAppearance;
  affinity: 'Ortodoxo' | 'Heterodoxo' | 'Demoníaco';
  faction: string;
  originDetail?: string;
  
  // Reinos y Dantian
  realm: MortalRealm;
  subRealm: number; // 1 a 6
  dantianScale: DantianScale;
  dantianPurity: number; // 0 a 100%
  
  // Recursos Vitales
  hp: number;
  maxHp: number;
  qi: number;
  maxQi: number;
  
  // Economía
  spiritStones: number;
  sectMerits: number;
  
  // Atributos Fundamentales
  attributes: CultivatorAttributes;
}
