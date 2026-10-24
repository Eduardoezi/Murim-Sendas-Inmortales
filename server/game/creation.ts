import {
  Cultivator,
  CharacterClass,
  Physique,
  Providence,
  BaZi,
  Item,
  ElementType,
} from '../../src/types/game';

import {
  INITIAL_MERIDIANS,
  INITIAL_TECHNIQUES,
  LIBRARY_SCROLLS,
  SECTS_LIST,
  CHARACTER_CLASSES,
} from '../../src/data/gameData';
import { savePlayer } from './player';

// --- UTILIDADES DETERMINISTAS (Mulberry32) ---
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function getRandomItem<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function getRandomItems<T>(rng: () => number, arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - rng());
  return shuffled.slice(0, count);
}

// --- DATOS DEL MUNDO ---
const ELEMENTS: ElementType[] = ['Fuego', 'Agua', 'Madera', 'Tierra', 'Rayo', 'Viento', 'Caos'];

const PHYSIQUES_DB: Physique[] = [
  { id: 'ph_1', name: 'Cuerpo de Hierro Forjado', description: 'Resiste impactos físicos con facilidad.', bonus: 'Defensa Base +10' },
  { id: 'ph_2', name: 'Venas de Dragón', description: 'Tus meridianos son anchos y absorben Qi más rápido.', bonus: 'Regeneración de Qi +15%' },
  { id: 'ph_3', name: 'Ojos del Vacío', description: 'Puedes ver la intención asesina y el flujo de Qi.', bonus: 'Percepción +5' },
  { id: 'ph_4', name: 'Médula de Jade', description: 'Tu constitución espiritual es perfecta.', bonus: 'Poder Espiritual +10' },
  { id: 'ph_5', name: 'Hueso de Dragón', description: 'Tu fuerza es colosal.', bonus: 'Ataque Base +15' },
];

const PROVIDENCES_DB: Providence[] = [
  { id: 'pr_1', name: 'Nacido Bajo la Estrella de la Fortuna', description: 'El destino te sonríe.' },
  { id: 'pr_2', name: 'Bendición del Fénix', description: 'Tu vitalidad es inmensa.' },
  { id: 'pr_3', name: 'Mente del Sabio', description: 'Aprendes más rápido.' },
  { id: 'pr_4', name: 'Protegido por el Cielo', description: 'Resistes las tribulaciones.' },
];

const SCARS_DB = ['Abandono', 'Pérdida', 'Traición', 'Fracaso', 'Secreto Oscuro'];
const OATHS_DB = ['Venganza', 'Búsqueda', 'Protección', 'Redención', 'Verdad Absoluta'];

// --- LÓGICA DE SERVIDOR ---

export function generateBaZi(dateStr: string): BaZi {
  // Determinismo puro basado en la fecha
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    year: `${(seed % 60) + 1}`,
    month: `${(seed % 12) + 1}`,
    day: `${(seed % 30) + 1}`,
    hour: `${(seed % 12) + 1}`,
    dominantElement: ELEMENTS[seed % ELEMENTS.length],
  };
}

export function createSyntacticCharacter(payload: any): Cultivator {
  const { id, userId, name, classType, sectId, birthDate, background, lineage } = payload;

  // 1. Crear semilla determinista única para este personaje
  const seedString = `${name}_${birthDate}_${userId}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
  }
  const rng = mulberry32(hash);

  // 2. El SERVIDOR tira los dados, NO el cliente.
  const bazi = generateBaZi(birthDate || new Date().toISOString());
  const physiques = getRandomItems(rng, PHYSIQUES_DB, 3);
  const providences = getRandomItems(rng, PROVIDENCES_DB, 3);
  const scars = getRandomItems(rng, SCARS_DB, 3);
  const oaths = getRandomItems(rng, OATHS_DB, 3);

  // 3. Calcular afinidad basada en BaZi
  let affinity: 'Ortodoxo' | 'Heterodoxo' | 'Demoniaco' = 'Ortodoxo';
  if (bazi.dominantElement === 'Fuego' || bazi.dominantElement === 'Caos') affinity = 'Demoniaco';
  else if (bazi.dominantElement === 'Agua' || bazi.dominantElement === 'Viento') affinity = 'Heterodoxo';

  // 4. Configuración de Clase y Secta
  const classData = CHARACTER_CLASSES[classType as CharacterClass] || CHARACTER_CLASSES.warrior;
  const startingSect = SECTS_LIST.find(s => s.id === sectId) || SECTS_LIST[0];

  const starterItems: Item[] = [
    {
      id: `starter_weapon_${Date.now()}`,
      name: classType === 'warrior' ? 'Sable de Acero Frío' : classType === 'scholar' ? 'Pincel de Caligrafía Mística' : 'Arma Inicial',
      category: 'weapon',
      rarity: 'Común',
      description: 'Arma inicial forjada para nuevos discípulos del Dao.',
      statBonus: { attack: 15 },
      value: 30,
    },
    {
      id: `starter_pill_${Date.now()}`,
      name: 'Píldora Purificadora de Qi',
      category: 'pill',
      rarity: 'Común',
      description: 'Restaura 120 de Qi y purifica el Dantian.',
      cultivationBoost: 120,
      value: 50,
    }
  ];

  // 5. Ensamblar el Cultivator completo
  const initialCultivator: Cultivator = {
    id,
    userId, // <--- VITAL para la autenticación
    name,
    classType,
    title: 'Discípulo Novicio',
    realm: 'Condensación de Qi',
    subRealm: 1,
    dantianScale: 'Gota',
    qi: 80,
    maxQi: 200,
    hp: classData.bonusStats.hp || 100,
    maxHp: classData.bonusStats.hp || 100,
    baseAttack: classData.bonusStats.attack || 15,
    baseDefense: classData.bonusStats.defense || 10,
    spiritPower: classData.bonusStats.spirit || 10,
    speed: classData.bonusStats.speed || 10,
    spiritSense: 35,
    karma: 50,
    fama: 50,
    freeAttributePoints: 10,
    freeSkillPoints: 5,
    attributes: {
      fuerza: classType === 'warrior' ? 24 : 16,
      destreza: classType === 'rogue' || classType === 'archer' ? 24 : 16,
      constitucion: classType === 'warrior' || classType === 'lancer' ? 22 : 16,
      inteligencia: classType === 'scholar' ? 24 : 16,
      percepcion: 18,
      astucia: classType === 'rogue' ? 20 : 14,
      voluntad: 18,
      suerte: 15,
      carisma: 14,
      sabiduria: classType === 'scholar' ? 22 : 15,
    },
    currency: { gold: 15, silver: 400, copper: 2500, stonesLow: 250, stonesMid: 0, stonesHigh: 0, stonesSupreme: 0 },
    spiritStones: 250,
    sectMerits: 50,
    sectId: startingSect.id,
    sectRank: 'Discípulo Externo',
    dantianPurity: 35,
    meridians: JSON.parse(JSON.stringify(INITIAL_MERIDIANS)),
    inventoryMaxSlots: 30,
    inventory: starterItems,
    equippedGear: { weapon: starterItems[0] },
    knownTechniques: INITIAL_TECHNIQUES.slice(0, 3),
    libraryScrolls: JSON.parse(JSON.stringify(LIBRARY_SCROLLS)),
    currentLocationNodeId: startingSect.id === 'sect_tianjian' ? 'node_huashan_peak' : 'node_kunlun_sect',
    disciples: [],
    completedQuests: [],
    claimedAchievements: [],
    stats: { duelsWon: 0, duelsLost: 0, bossDamageDealt: 0, pillsCrafted: 0, meridiansOpened: 0, auctionsWon: 0, disciplesRecruited: 0, scrollsMastered: 0, nodesDiscovered: 1 },
    
    // Lore determinista generado en el servidor
    bazi,
    physiques,
    providences,
    soul: { scars, oaths },
    background,
    lineage,
    affinity,
    origin: background, // Mapeamos background a origin según el prompt
    backgroundStory: `Nacido en el año ${bazi.year}, tu linaje ${lineage} te ha marcado con ${physiques[0].name}.`,
    birthDate,
  };

  savePlayer(initialCultivator);
  return initialCultivator;
}