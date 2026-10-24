/**
 * Types and interfaces for Murim: Sendas Inmortales
 * Grounded in the lore, sect system, library scrolls, and world map.
 */

export type CharacterClass = 'rogue' | 'warrior' | 'scholar' | 'archer' | 'lancer';

export type CultivationRealm = 
  | 'Condensación de Qi'
  | 'Refinamiento de Qi'
  | 'Establecimiento de Fundación'
  | 'Fundación Espiritual'
  | 'Núcleo Dorado'
  | 'Alma Naciente'
  | 'Formación del Espíritu'
  | 'Vacío de Fusión Corporal'
  | 'Tribulación de Trascendencia'
  | 'Iluminación'
  | 'Ascensión Inmortal'
  | 'Inmortal Rebelde';

export type DantianScale = 
  | 'Gota'
  | 'Cáliz'
  | 'Estanque'
  | 'Lago'
  | 'Mar'
  | 'Océano'
  | 'Firmamento'
  | 'Cosmos'
  | 'Primordial';

export type ElementType = 'Fuego' | 'Agua' | 'Madera' | 'Tierra' | 'Rayo' | 'Caos' | 'Viento';

export type ItemRarity = 'Común' | 'Mortal' | 'Raro' | 'Tierra' | 'Alma' | 'Celestial' | 'Primordial';

export type SectRank = 
  | 'Discípulo Externo' 
  | 'Discípulo Interno' 
  | 'Discípulo Élite' 
  | 'Anciano de Pabellón' 
  | 'Gran Maestro'
  | 'Líder Supremo / Patriarca';

export interface Meridian {
  id: string;
  name: string;
  pinyin: string;
  bonus: string;
  bonusType: 'hp' | 'attack' | 'defense' | 'spirit' | 'speed';
  bonusValue: number;
  qiCost: number;
  unlocked: boolean;
  elementAffinity: ElementType;
}

export interface MartialTechnique {
  id: string;
  name: string;
  chineseName?: string;
  pinyin?: string;
  element: ElementType;
  qiCost: number;
  cooldown: number;
  powerMultiplier: number;
  effect: 'damage' | 'stun' | 'shield' | 'bleed' | 'burn' | 'heal' | 'drain' | 'illusion';
  effectValue: number;
  description: string;
  requiredRealm: CultivationRealm;
  masteryLevel: number;
  masteryExp: number;
  grade: ItemRarity;
  classSpecific?: CharacterClass;
}

export interface LibraryScroll {
  id: string;
  code: string;
  title: string;
  chineseTitle: string;
  category: 'marcial' | 'cultivo' | 'alquimia' | 'forja' | 'formacion' | 'medicina';
  grade: ItemRarity;
  requiredRealm: CultivationRealm;
  requiredInt: number;
  requiredWis: number;
  studyCostQi: number;
  studyTimeSeconds: number;
  description: string;
  effects: string;
  originSect: string;
  isUnlocked: boolean;
  studyProgress: number;
  isMastered: boolean;
}

export interface CustomSecretTechnique {
  id: string;
  name: string;
  element: ElementType;
  baseMultiplier: number;
  qiCost: number;
  specialEffect: 'burn_drain' | 'thunder_stun' | 'frost_shield' | 'fatal_strike';
  effectName: string;
  level: number;
}

export interface BaZi {
  year: string;
  month: string;
  day: string;
  hour: string;
  dominantElement: ElementType;
}

export interface Physique {
  id: string;
  name: string;
  description: string;
  bonus: string;
}

export interface Providence {
  id: string;
  name: string;
  description: string;
}

export interface SoulData {
  scars: string[];
  oaths: string[];
  guardian?: string;
}

export interface Item {
  id: string;
  name: string;
  chineseName?: string;
  category: 'weapon' | 'armor' | 'artifact' | 'pill' | 'material' | 'manual' | 'special';
  rarity: ItemRarity;
  description: string;
  statBonus?: {
    hp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    speed?: number;
    fuerza?: number;
    destreza?: number;
    constitucion?: number;
    inteligencia?: number;
    percepcion?: number;
    voluntad?: number;
    sabiduria?: number;
    carisma?: number;
    suerte?: number;
  };
  cultivationBoost?: number;
  value: number;
  currencyType?: 'stones' | 'merits' | 'gold';
  element?: ElementType;
  quantity?: number;
}

export interface Disciple {
  id: string;
  name: string;
  realm: CultivationRealm;
  aptitude: 'Ordinario' | 'Notable' | 'Genio Celestial' | 'Monstruo del Dao';
  loyalty: number;
  assignedTask: 'none' | 'meditation' | 'herb_gathering' | 'sect_patrol' | 'refining' | 'library_archiving';
  taskProgress: number;
  taskDurationSeconds: number;
  tributeYield: {
    spiritStones: number;
    merits: number;
    materials?: string;
  };
}

export interface SectMission {
  id: string;
  title: string;
  chineseTitle?: string;
  difficulty: 'Mortal' | 'Tierra' | 'Alma' | 'Celestial';
  minRank: SectRank;
  description: string;
  location: string;
  targetCount: number;
  currentCount: number;
  rewardStones: number;
  rewardMerits: number;
  rewardExp: number;
  rewardItem?: Item;
  completed: boolean;
  claimed: boolean;
}

export interface WorldMapNode {
  id: string;
  name: string;
  chineseName: string;
  province: string;
  type: 'sect' | 'mountain' | 'forest' | 'swamp' | 'city' | 'cave' | 'ruins';
  qiDensity: 'Baja' | 'Media' | 'Alta' | 'Grado Cielo' | 'Grado Primordial';
  recommendedRealm: CultivationRealm;
  description: string;
  rulerFaction: string;
  coordinates: { x: number; y: number };
  availableResources: string[];
  threatLevel: number;
  unlocked: boolean;
}

export interface SectPavilionInfo {
  id: 'patriarch' | 'library' | 'missions' | 'medicine' | 'merits' | 'training' | 'vault';
  name: string;
  chineseName: string;
  title: string;
  managerName: string;
  description: string;
  level: number;
  buffDescription: string;
}

export interface SectInfo {
  id: string;
  name: string;
  chineseName: string;
  element: ElementType;
  alignment: 'Ortodoxa' | 'Pabellón Académico' | 'Fuerza Marcial' | 'Sombra Inmortal';
  description: string;
  leaderName: string;
  territoryControl: number;
  totalMembers: number;
  sectTreasury: number;
  activeBuff: string;
  specialtySkill: string;
}

export interface MeritMilestone {
  id: string;
  category: 'cultivo' | 'marcial' | 'alquimia' | 'secta' | 'jianghu';
  title: string;
  chineseTitle: string;
  description: string;
  meritReward: number;
  stoneReward: number;
  targetCount: number;
}

export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerClass: CharacterClass;
  item: Item;
  currentBid: number;
  buyoutPrice: number;
  highestBidderId?: string;
  highestBidderName?: string;
  expiresAt: number;
  currencyType?: 'stones' | 'merits';
  meritBuyoutPrice?: number;
}

export interface WorldBossState {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  currentHp: number;
  maxHp: number;
  phase: number;
  timeRemainingSec: number;
  activeStatus: 'alive' | 'defeated' | 'escaped';
  participants: {
    id: string;
    name: string;
    className: CharacterClass;
    damageDealt: number;
    sectName: string;
  }[];
  rewards: {
    spiritStones: number;
    rareItemName: string;
    sectMerits: number;
  };
}

export interface Cultivator {
  id: string;
  userId?: number;
  name: string;
  chineseName?: string;
  classType: CharacterClass;
  title: string;
  realm: CultivationRealm;
  subRealm: number;
  dantianScale: DantianScale;
  qi: number;
  maxQi: number;
  hp: number;
  maxHp: number;
  activeMissions?: ActiveMission[];
  
  // Atributos Fundamentales del Lore
  attributes: {
    fuerza: number;
    destreza: number;
    constitucion: number;
    inteligencia: number;
    percepcion: number;
    astucia: number;
    voluntad: number;
    suerte: number;
    carisma: number;
    sabiduria: number;
  };
  
  // Nuevos campos lore
  bazi?: BaZi;
  physiques?: Physique[];
  providences?: Providence[];
  soul?: SoulData;
  background?: string;
  backgroundStory?: string; // Añadido del Master Prompt
  origin?: string;          // Añadido del Master Prompt
  affinity?: 'Ortodoxo' | 'Heterodoxo' | 'Demoniaco';
  lineage?: 'Noble' | 'Plebeyo' | 'Hijo de secta' | 'Hijo de realeza';
  birthDate?: string;       // Guardamos la fecha para calcular la edad

  karma: number;
  fama: number;
  freeAttributePoints: number;
  freeSkillPoints: number;

  baseAttack: number;
  baseDefense: number;
  spiritPower: number;
  speed: number;
  spiritSense: number;
  
  currency: {
    gold: number;
    silver: number;
    copper: number;
    stonesLow: number;
    stonesMid: number;
    stonesHigh: number;
    stonesSupreme: number;
  };
  
  spiritStones: number;
  sectMerits: number;
  reputation?: Record<string, number>;
  sectId: string;
  sectRank: SectRank;
  dantianPurity: number;
  meridians: Meridian[];
  
  inventoryMaxSlots: number;
  inventory: Item[];
  equippedGear: {
    weapon?: Item;
    armor?: Item;
    artifact?: Item;
    boots?: Item;
    ring?: Item;
  };
  
  knownTechniques: MartialTechnique[];
  libraryScrolls: LibraryScroll[];
  secretTechnique?: CustomSecretTechnique;
  disciples: Disciple[];
  completedQuests: string[];
  claimedAchievements: string[];
  
  currentLocationNodeId: string;
  travelState?: {
    destinationNodeId: string;
    progressPercent: number;
    eventLog: string[];
  };
  
  stats: {
    duelsWon: number;
    duelsLost: number;
    bossDamageDealt: number;
    pillsCrafted: number;
    meridiansOpened: number;
    auctionsWon: number;
    disciplesRecruited: number;
    scrollsMastered: number;
    nodesDiscovered: number;
  };
}

export interface AlchemyRecipe {
  id: string;
  name: string;
  rarity: ItemRarity;
  description: string;
  requiredSpirit: number;
  optimalTemperature: number;
  ingredients: { itemId: string; name: string; amount: number }[];
  resultItem: Item;
}

export interface LiveDuelState {
  id: string;
  p1: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    qi: number;
    maxQi: number;
    classType: CharacterClass;
    realm: CultivationRealm;
    shield: number;
    elementAffinity: ElementType;
  };
  p2: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    qi: number;
    maxQi: number;
    classType: CharacterClass;
    realm: CultivationRealm;
    shield: number;
    elementAffinity: ElementType;
  };
  currentTurn: string;
  turnNumber: number;
  combatLog: { text: string; type: 'p1' | 'p2' | 'system' }[];
  status: 'waiting' | 'in_progress' | 'finished';
  winnerId?: string;
}

export interface ActiveMission {
  id: string;
  factionId: string;
  title: string;
  description: string;
  type: 'Caza' | 'Recolección' | 'Viaje' | 'Cultivo';
  targetRegionId: string;
  durationMinutes: number;
  startedAt: number;
  status: 'in_progress' | 'completed' | 'claimed';
  rewardStones: number;
  rewardReputation: number;
}