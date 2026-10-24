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

const ELEMENTS = ['Fuego', 'Agua', 'Madera', 'Tierra', 'Rayo', 'Viento', 'Caos'];

const PHYSIQUES_DB: Physique[] = [
  { id: 'ph_1', name: 'Cuerpo de Hierro Forjado', description: 'Resiste impactos físicos con facilidad.', bonus: {} as Physique['bonus'] },
  { id: 'ph_2', name: 'Venas de Dragón', description: 'Tus meridianos son anchos y absorben Qi más rápido.', bonus: {} as Physique['bonus'] },
  { id: 'ph_3', name: 'Ojos del Vacío', description: 'Puedes ver la intención asesina y el flujo de Qi.', bonus: {} as Physique['bonus'] },
  { id: 'ph_4', name: 'Médula de Jade', description: 'Tu constitución espiritual es perfecta.', bonus: {} as Physique['bonus'] },
  { id: 'ph_5', name: 'Hueso de Dragón', description: 'Tu fuerza es colosal.', bonus: {} as Physique['bonus'] },
];

const PROVIDENCES_DB: Providence[] = [
  { id: 'pr_1', name: 'Nacido Bajo la Estrella de la Fortuna', description: 'El destino te sonríe.' },
  { id: 'pr_2', name: 'Bendición del Fénix', description: 'Tu vitalidad es inmensa.' },
  { id: 'pr_3', name: 'Mente del Sabio', description: 'Aprendes más rápido.' },
  { id: 'pr_4', name: 'Protegido por el Cielo', description: 'Resistes las tribulaciones.' },
];

const SCARS_DB = ['Abandono', 'Pérdida', 'Traición', 'Fracaso', 'Secreto Oscuro'];
const OATHS_DB = ['Venganza', 'Búsqueda', 'Protección', 'Redención', 'Verdad Absoluta'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function generateBaZi(dateStr: string): BaZi {
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return {
    year: `${(seed % 60) + 1}`,
    month: `${(seed % 12) + 1}`,
    day: `${(seed % 30) + 1}`,
    hour: `${(seed % 12) + 1}`,
    dominantElement: ELEMENTS[seed % ELEMENTS.length] as ElementType,
  };
}

export function rollDestiny() {
  return {
    bazi: generateBaZi(new Date().toISOString()),
    physiques: getRandomItems(PHYSIQUES_DB, 3),
    providences: getRandomItems(PROVIDENCES_DB, 3),
    scars: getRandomItems(SCARS_DB, 3),
    oaths: getRandomItems(OATHS_DB, 3),
  };
}

export function createSyntacticCharacter(payload: any): Cultivator {
  const { id, name, classType, sectId, rollData, background, lineage, affinity } = payload;

  const classData = CHARACTER_CLASSES[classType as CharacterClass];
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

  let baseAttack = classData.bonusStats.attack;
  let baseDefense = classData.bonusStats.defense;
  let maxHp = classData.bonusStats.hp;

  const initialCultivator: Cultivator = {
    id,
    name,
    classType,
    title: 'Discípulo Novicio',
    realm: 'Condensación de Qi',
    subRealm: 1,
    dantianScale: 'Gota',
    qi: 80,
    maxQi: 200,
    hp: maxHp,
    maxHp: maxHp,
    baseAttack,
    baseDefense,
    spiritPower: classData.bonusStats.spirit,
    speed: classData.bonusStats.speed,
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
    
    bazi: rollData.bazi,
    physiques: rollData.physiques,
    providences: rollData.providences,
    soul: {
      scars: rollData.scars,
      oaths: rollData.oaths,
    },
    background,
    lineage,
    affinity,
  };

  savePlayer(initialCultivator);
  return initialCultivator;
}