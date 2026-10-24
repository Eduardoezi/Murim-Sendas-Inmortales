import { ElementType, ItemRarity } from '../types/game';

// ==========================================
// 1. GEOGRAFÍA Y DIVISIÓN POLÍTICA (MAPA VIVO)
// ==========================================

export interface MapRegion {
  id: string;
  name: string;
  chineseName: string;
  macroRegion: 'Corazón' | 'Espalda' | 'Norte Helado' | 'Este Próspero' | 'Oeste Prohibido';
  chunks: string[];
  qiDensity: 'Baja' | 'Media' | 'Alta' | 'Grado Cielo' | 'Grado Primordial';
  controllingFaction: string;
  description: string;
  coords: { x: number; y: number };
  
  // NUEVOS DATOS PARA EL MUNDO VIVO
  population: number;
  economy: {
    exports: string[];
    imports: string[];
    wealthLevel: 'Pobre' | 'Moderado' | 'Próspero' | 'Opulento';
  };
  threatLevel: number; // 1-10
}

export const MAP_REGIONS: MapRegion[] = [
  // --- EL CORAZÓN (CENTRO) ---
  {
    id: 'prov_shaanxi', name: 'Shaanxi', chineseName: '陝西', macroRegion: 'Corazón',
    chunks: ['D9', 'D10', 'E9', 'E10'], qiDensity: 'Alta', controllingFaction: 'Corte Imperial / Clan Long',
    description: 'Antigua capital imperial, sede de la Secta Monte Hua y puerta de entrada a Sichuan.',
    coords: { x: 45, y: 45 },
    population: 2500000,
    economy: { exports: ['Carbón', 'Hierro Frío', 'Sedas'], imports: ['Grano', 'Píldoras'], wealthLevel: 'Próspero' },
    threatLevel: 5
  },
  {
    id: 'prov_henan', name: 'Henan', chineseName: '河南', macroRegion: 'Corazón',
    chunks: ['D10', 'D11', 'E10', 'E11'], qiDensity: 'Alta', controllingFaction: 'Templo Shaolin / Corte Imperial',
    description: 'El corazón de las artes marciales. Hogar de Shaolin y la Secta de los Mendigos.',
    coords: { x: 55, y: 45 },
    population: 3200000,
    economy: { exports: ['Grano', 'Té', 'Textos Marciales'], imports: ['Armas', 'Minerales'], wealthLevel: 'Moderado' },
    threatLevel: 4
  },
  {
    id: 'prov_hebei', name: 'Hebei', chineseName: '河北', macroRegion: 'Corazón',
    chunks: ['C11', 'C12', 'D11'], qiDensity: 'Media', controllingFaction: 'Clan Peng / Corte Imperial',
    description: 'Trono del Norte, la Ciudad Prohibida y el Paso de Shanhaiguan.',
    coords: { x: 60, y: 30 },
    population: 4000000,
    economy: { exports: ['Seda Imperial', 'Joyas', 'Política'], imports: ['Alimento', 'Materia prima'], wealthLevel: 'Opulento' },
    threatLevel: 3
  },
  {
    id: 'prov_shanxi', name: 'Shanxi', chineseName: '山西', macroRegion: 'Corazón',
    chunks: ['C10', 'D10'], qiDensity: 'Media', controllingFaction: 'Clan Zhuge / Mercaderes',
    description: 'Tierra del carbón, el comercio y la banca. Sede del Valle del Cálculo Eterno.',
    coords: { x: 52, y: 35 },
    population: 1800000,
    economy: { exports: ['Carbón', 'Banca', 'Formaciones'], imports: ['Seda', 'Granos'], wealthLevel: 'Próspero' },
    threatLevel: 4
  },
  // --- LA ESPALDA (SUROESTE) ---
  {
    id: 'prov_sichuan', name: 'Sichuan', chineseName: '四川', macroRegion: 'Espalda',
    chunks: ['E8', 'E9', 'F8'], qiDensity: 'Alta', controllingFaction: 'Clan Tang / Secta Emei',
    description: 'Cuenca de los Mil Senderos. Maestros del veneno y el cultivo fluido.',
    coords: { x: 35, y: 55 },
    population: 1500000,
    economy: { exports: ['Venenos', 'Seda Medicinal', 'Brocado'], imports: ['Hierro', 'Caballos'], wealthLevel: 'Moderado' },
    threatLevel: 7
  },
  {
    id: 'prov_yunnan', name: 'Yunnan', chineseName: '雲南', macroRegion: 'Espalda',
    chunks: ['F7', 'F8', 'G8'], qiDensity: 'Alta', controllingFaction: 'Valle de la Curación / Palacio de la Sangre',
    description: 'Frontera sur, selvas tropicales y cultos demoníacos.',
    coords: { x: 30, y: 70 },
    population: 800000,
    economy: { exports: ['Hierbas raras', 'Antídotos', 'Maderas exóticas'], imports: ['Ropa', 'Herramientas'], wealthLevel: 'Pobre' },
    threatLevel: 8
  },
  {
    id: 'prov_guangxi', name: 'Guangxi', chineseName: '廣西', macroRegion: 'Espalda',
    chunks: ['F9', 'F10', 'G9', 'G10'], qiDensity: 'Media', controllingFaction: 'Culto de la Sangre',
    description: 'Paisaje kárstico, cuevas ocultas y rituales de sangre.',
    coords: { x: 45, y: 80 },
    population: 600000,
    economy: { exports: ['Cinabrio', 'Reliquias robadas'], imports: ['Sangre', 'Esclavos'], wealthLevel: 'Pobre' },
    threatLevel: 9
  },
  // --- EL NORTE HELADO ---
  {
    id: 'prov_heilongjiang', name: 'Heilongjiang', chineseName: '黑龍江', macroRegion: 'Norte Helado',
    chunks: ['A12', 'A13', 'B13', 'B14', 'B15', 'C13', 'C14'], qiDensity: 'Baja', controllingFaction: 'Orden del Río Negro / Chamanes',
    description: 'Extremo norte, frío perpetuo y el río Dragón Negro.',
    coords: { x: 80, y: 10 },
    population: 300000,
    economy: { exports: ['Pieles', 'Hielo Eterno', 'Ginseng Emperador'], imports: ['Comida', 'Armas'], wealthLevel: 'Pobre' },
    threatLevel: 8
  },
  {
    id: 'prov_mongolia', name: 'Mongolia Interior', chineseName: '內蒙古', macroRegion: 'Norte Helado',
    chunks: ['A12', 'B11', 'B12', 'B13', 'C7', 'C8', 'C9'], qiDensity: 'Baja', controllingFaction: 'Tribus de la Estepa',
    description: 'Estepas del Lobo, jinetes nómadas y el Desierto de Gobi.',
    coords: { x: 65, y: 15 },
    population: 400000,
    economy: { exports: ['Caballos', 'Lana', 'Carne'], imports: ['Té', 'Hierro', 'Seda'], wealthLevel: 'Moderado' },
    threatLevel: 6
  },
  // --- EL ESTE PRÓSPERO ---
  {
    id: 'prov_jiangsu', name: 'Jiangsu', chineseName: '江蘇', macroRegion: 'Este Próspero',
    chunks: ['D12', 'E12'], qiDensity: 'Alta', controllingFaction: 'Clan Moyong',
    description: 'La Venecia del Este, centro financiero y de la seda.',
    coords: { x: 70, y: 50 },
    population: 2800000,
    economy: { exports: ['Seda', 'Préstamos', 'Jade'], imports: ['Materia prima', 'Grano'], wealthLevel: 'Opulento' },
    threatLevel: 2
  },
  {
    id: 'prov_anhui', name: 'Anhui', chineseName: '安徽', macroRegion: 'Este Próspero',
    chunks: ['E11', 'E12'], qiDensity: 'Grado Cielo', controllingFaction: 'Clan Namgung',
    description: 'Montañas Amarillas y los Reyes de la Espada.',
    coords: { x: 65, y: 50 },
    population: 1200000,
    economy: { exports: ['Espadas', 'Té de Montaña', 'Hierro de Rayo'], imports: ['Comida', 'Seda'], wealthLevel: 'Próspero' },
    threatLevel: 5
  },
  {
    id: 'prov_zhejiang', name: 'Zhejiang', chineseName: '浙江', macroRegion: 'Este Próspero',
    chunks: ['E9', 'F9'], qiDensity: 'Alta', controllingFaction: 'Clan de Forjadores Longquan',
    description: 'Tierra del té, las espadas legendarias y la Isla de los Melocotoneros.',
    coords: { x: 75, y: 55 },
    population: 2000000,
    economy: { exports: ['Espadas Longquan', 'Té', 'Seda'], imports: ['Mineral de Hierro'], wealthLevel: 'Próspero' },
    threatLevel: 3
  },
  {
    id: 'prov_fujian', name: 'Fujian', chineseName: '福建', macroRegion: 'Este Próspero',
    chunks: ['F8', 'F9'], qiDensity: 'Media', controllingFaction: 'Secta de la Grulla Blanca',
    description: 'Fortaleza costera, comercio marítimo y el linaje de la Grulla.',
    coords: { x: 75, y: 65 },
    population: 900000,
    economy: { exports: ['Porcelana', 'Té', 'Pescado'], imports: ['Armas', 'Grano'], wealthLevel: 'Moderado' },
    threatLevel: 4
  },
  // --- EL OESTE PROHIBIDO ---
  {
    id: 'prov_xinjiang', name: 'Xinjiang', chineseName: '新疆', macroRegion: 'Oeste Prohibido',
    chunks: ['B4', 'B5', 'B6', 'C3', 'C4', 'C5', 'D3', 'D4', 'D5'], qiDensity: 'Grado Primordial', controllingFaction: 'Culto del Demonio Celestial',
    description: 'Oeste profundo, desiertos mortales y las Montañas Kunlun.',
    coords: { x: 15, y: 30 },
    population: 200000,
    economy: { exports: ['Jade de Khotan', 'Reliquias del Caos'], imports: ['Todo tipo de bienes'], wealthLevel: 'Pobre' },
    threatLevel: 10
  },
  {
    id: 'prov_xizang', name: 'Xizang (Tíbet)', chineseName: '西藏', macroRegion: 'Oeste Prohibido',
    chunks: ['D4', 'D5', 'E4', 'E5', 'E6', 'E7'], qiDensity: 'Grado Cielo', controllingFaction: 'Palacio de Potala',
    description: 'El techo del mundo. Monasterios budistas y artes marciales esotéricas.',
    coords: { x: 20, y: 55 },
    population: 150000,
    economy: { exports: ['Sutras', 'Incienso', 'Loto de Hielo'], imports: ['Comida', 'Sal'], wealthLevel: 'Pobre' },
    threatLevel: 7
  },
  {
    id: 'prov_qinghai', name: 'Qinghai', chineseName: '青海', macroRegion: 'Oeste Prohibido',
    chunks: ['D6', 'D7', 'D8', 'E6', 'E7', 'E8'], qiDensity: 'Grado Primordial', controllingFaction: 'Secta Kunlun',
    description: 'Meseta de los inmortales y el Lago Esmeralda.',
    coords: { x: 25, y: 45 },
    population: 100000,
    economy: { exports: ['Fruto de la Vida', 'Yaks Espirituales'], imports: ['Herramientas', 'Grano'], wealthLevel: 'Moderado' },
    threatLevel: 8
  }
];

// ==========================================
// 2. FACCIONES (Se mantiene igual)
// ==========================================
export interface WorldFaction {
  id: string;
  name: string;
  type: 'Secta Ortodoxa' | 'Secta Heterodoxa' | 'Clan Noble' | 'Culto Demoníaco' | 'Institución Neutral' | 'Corte Imperial' | 'Bandidos';
  location: string;
  leader: string;
  description: string;
  powerLevel: string;
  speciality: string;
}

export const WORLD_FACTIONS: WorldFaction[] = [
  { id: 'fac_shaolin', name: 'Templo Shaolin', type: 'Secta Ortodoxa', location: 'prov_henan', leader: 'Abad Supremo', description: 'Árbitros del Wulin. Maestros del cuerpo y el bastón.', powerLevel: 'Rango 6', speciality: 'Cuerpo de Diamante, 18 Manos de Arhat' },
  { id: 'fac_wudang', name: 'Secta Wudang', type: 'Secta Ortodoxa', location: 'prov_hubei', leader: 'Gran Maestro', description: 'Estrategas taoístas. Expertos en el Tai Chi y la espada flexible.', powerLevel: 'Rango 6', speciality: 'Tai Chi Chuan, Espada del Tai Chi' },
  { id: 'fac_huashan', name: 'Secta Monte Hua', type: 'Secta Ortodoxa', location: 'prov_shaanxi', leader: 'Pung Chungwun', description: 'Artistas marciales. Su espada es poesía en movimiento.', powerLevel: 'Rango 5', speciality: 'Espada del Ciruelo (36 estilos)' },
  { id: 'fac_namgung', name: 'Clan Namgung', type: 'Clan Noble', location: 'prov_anhui', leader: 'Namgung Shin', description: 'Reyes de la Espada. Portadores del Trueno.', powerLevel: 'Rango 6', speciality: '36 Estilos del Trueno' },
  { id: 'fac_tang', name: 'Clan Tang', type: 'Clan Noble', location: 'prov_sichuan', leader: 'Tang Wuji', description: 'Maestros del veneno y las armas ocultas.', powerLevel: 'Rango 6', speciality: 'Tres Tesoros Venenosos' },
  { id: 'fac_moyong', name: 'Clan Moyong', type: 'Clan Noble', location: 'prov_jiangsu', leader: 'Moyong Fu', description: 'Banqueros del imperio. Devuelven los golpes con el doble de fuerza.', powerLevel: 'Rango 6', speciality: 'Técnica del Espejo Roto' },
  { id: 'fac_zhuge', name: 'Clan Zhuge', type: 'Clan Noble', location: 'prov_shanxi', leader: 'Zhuge Liang', description: 'Estrategas supremos. El sabio gana sin luchar.', powerLevel: 'Rango 6', speciality: 'Ocho Formaciones del Diagrama' },
  { id: 'fac_peng', name: 'Clan Peng', type: 'Clan Noble', location: 'prov_hebei', leader: 'Peng Hu', description: 'La primera línea de defensa del norte. Fuerza bruta.', powerLevel: 'Rango 6', speciality: 'Estilo del Tifón Devastador' },
  { id: 'fac_demonio_celestial', name: 'Culto del Demonio Celestial', type: 'Culto Demoníaco', location: 'prov_xinjiang', leader: 'Demonio Celestial', description: 'Buscan la libertad absoluta y el poder trascendente en Kunlun.', powerLevel: 'Rango 6', speciality: 'Arte Divino del Demonio Celestial' },
  { id: 'fac_sangre', name: 'Culto de la Sangre', type: 'Culto Demoníaco', location: 'prov_guangxi', leader: 'Demonio de Sangre', description: 'Consumen la vida de otros para alargar la propia.', powerLevel: 'Rango 5', speciality: 'Arte de la Sangre, Iluminación de Espadas' },
  { id: 'fac_viento', name: 'Culto del Viento Divino', type: 'Culto Demoníaco', location: 'prov_guangdong', leader: 'Ojo del Viento', description: 'Asesinos que se mueven sin ser vistos.', powerLevel: 'Rango 5', speciality: 'Paso del Viento, Asesinato Aéreo' },
  { id: 'fac_cien_oficios', name: 'Pabellón de los Cien Oficios', type: 'Institución Neutral', location: 'prov_jiangxi', leader: 'Consejo de Maestros', description: 'Artesanos supremos. Forjan armas y píldoras legendarias.', powerLevel: 'Rango 5', speciality: 'Forja y Alquimia de élite' },
  { id: 'fac_sabiduria', name: 'Pabellón de la Sabiduría', type: 'Institución Neutral', location: 'prov_hebei', leader: 'Director', description: 'Venden información, secretos y debilidades de maestros.', powerLevel: 'Rango 4', speciality: 'Espionaje e Inteligencia' },
  { id: 'fac_corte', name: 'La Corte Imperial (Liu Song)', type: 'Corte Imperial', location: 'prov_hebei', leader: 'Emperador Liu Yilong', description: 'Gobierno oficial. Mantiene el equilibrio entre facciones.', powerLevel: 'Rango 6', speciality: 'Guardia Imperial, Espectros Imperiales' },
  { id: 'sect_grulla', name: 'Secta de la Grulla Blanca', type: 'Secta Ortodoxa', location: 'prov_fujian', leader: 'Lin Tian', description: 'Estilo elegante y letal. Maestros del viento y la precisión.', powerLevel: 'Rango 4', speciality: 'Espada de la Grulla Blanca' }
];

// ==========================================
// 3. FAUNA (Se mantiene igual)
// ==========================================
export interface WorldBeast {
  id: string;
  name: string;
  chineseName: string;
  tier: 'Primordial' | 'Ancestral' | 'Desolada' | 'Mutante';
  habitat: string;
  daoMark: string;
  keyMaterial: string;
  innateSkill: string;
  level: number;
  hp: number;
  attack: number;
}

export const WORLD_BEASTS: WorldBeast[] = [
  { id: 'b_dragon_temporal', name: 'Dragón del Vacío Temporal', chineseName: '時空虛空龍', tier: 'Primordial', habitat: 'prov_xinjiang', daoMark: 'Tiempo / Vacío', keyMaterial: 'Escamas de Flujo Temporal', innateSkill: 'Suspiro del Eón', level: 80, hp: 50000, attack: 1200 },
  { id: 'b_fenix_carmesi', name: 'Fénix de Fuego Carmesí', chineseName: '九天赤焰鳳', tier: 'Primordial', habitat: 'prov_sichuan', daoMark: 'Fuego / Renacimiento', keyMaterial: 'Pluma del Renacer', innateSkill: 'Ascensión Purificadora', level: 75, hp: 42000, attack: 1500 },
  { id: 'b_lobo_caos', name: 'Lobo de la Sombra de Caos', chineseName: '混沌影煞狼', tier: 'Ancestral', habitat: 'prov_xinjiang', daoMark: 'Caos / Sombra', keyMaterial: 'Ojo de la Noche', innateSkill: 'Manada de la Oscuridad', level: 60, hp: 15000, attack: 650 },
  { id: 'b_aguila_acero', name: 'Águila de Pico de Acero', chineseName: '金喙鐵羽鷹', tier: 'Mutante', habitat: 'prov_shaanxi', daoMark: 'Acero / Viento', keyMaterial: 'Pico de Aleación', innateSkill: 'Perforación Metálica', level: 20, hp: 2500, attack: 180 },
  { id: 'b_ciervo_sagrado', name: 'Ciervo del Bosque Sagrado', chineseName: '青木神鹿', tier: 'Desolada', habitat: 'prov_hubei', daoMark: 'Madera / Regeneración', keyMaterial: 'Asta de la Vida', innateSkill: 'Renovación del Espíritu', level: 40, hp: 8000, attack: 320 },
];

// ==========================================
// 4. RECURSOS (Se mantiene igual)
// ==========================================
export interface WorldResource {
  id: string;
  name: string;
  type: 'Hierba' | 'Mineral' | 'Madera' | 'Esencia';
  rarity: ItemRarity;
  location: string;
  description: string;
}

export const WORLD_RESOURCES: WorldResource[] = [
  { id: 'res_ginseng_emperador', name: 'Ginseng Emperador', type: 'Hierba', rarity: 'Celestial', location: 'prov_heilongjiang', description: 'Raíz con forma humana. Otorga longevidad y avance de cultivo.' },
  { id: 'res_loto_hielo', name: 'Loto de Hielo de Nueve Capas', type: 'Hierba', rarity: 'Celestial', location: 'prov_xizang', description: 'Flor congelada de 9 pétalos. Base para píldoras de resistencia al frío.' },
  { id: 'res_hongo_dragon', name: 'Hongos de Sangre de Dragón', type: 'Hierba', rarity: 'Alma', location: 'prov_yunnan', description: 'Hongo rojo con vetas doradas. Regeneración de Qi.' },
  { id: 'res_jade_khotan', name: 'Jade de Khotan', type: 'Mineral', rarity: 'Alma', location: 'prov_xinjiang', description: 'El mejor jade del imperio, almacena Qi.' },
  { id: 'res_hierro_frio', name: 'Hierro Frío', type: 'Mineral', rarity: 'Tierra', location: 'prov_heilongjiang', description: 'Metal que conserva el frío. Forja de armas de hielo.' },
  { id: 'res_cinabrio', name: 'Cinabrio Puro', type: 'Mineral', rarity: 'Alma', location: 'prov_guangxi', description: 'Mineral rojo de mercurio. Base de píldoras de inmortalidad.' },
  { id: 'res_fruto_vida', name: 'Fruto del Árbol de la Vida', type: 'Esencia', rarity: 'Primordial', location: 'prov_qinghai', description: 'Fruto dorado en Kunlun. Inmortalidad teórica.' }
];

// ==========================================
// 5. MISIONES DE FACCIÓN
// ==========================================
export interface FactionMission {
  id: string;
  factionId: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  rewardStones: number;
  rewardReputation: number;
  requiredRealmLevel: number;
  durationMinutes: number; // <--- AÑADIR
  targetRegionId: string;  // <--- AÑADIR
}
export const WORLD_MISSIONS: FactionMission[] = [
  // Shaolin
  { id: 'm_shao_1', factionId: 'fac_shaolin', title: 'Purificar el Monte Song', description: 'Elimina a los espectros que rondan el templo por las noches.', difficulty: 'Fácil', rewardStones: 150, rewardReputation: 10, requiredRealmLevel: 1, durationMinutes: 30, targetRegionId: 'prov_henan' },
  { id: 'm_shao_2', factionId: 'fac_shaolin', title: 'Recuperar el Sutra Robado', description: 'Unos bandidos robaron un texto sagrado. Recupéralo.', difficulty: 'Medio', rewardStones: 400, rewardReputation: 25, requiredRealmLevel: 3, durationMinutes: 60, targetRegionId: 'prov_henan' },
  // Wudang
  { id: 'm_wu_1', factionId: 'fac_wudang', title: 'Meditación en el Pico', description: 'Ayuda a los monjes a purificar el Qi de la montaña.', difficulty: 'Fácil', rewardStones: 120, rewardReputation: 10, requiredRealmLevel: 1, durationMinutes: 30, targetRegionId: 'prov_hubei' },
  // Monte Hua
  { id: 'm_hua_1', factionId: 'fac_huashan', title: 'Duelo de Espadas', description: 'Derrota a un discípulo rebelde en la plataforma del pico.', difficulty: 'Medio', rewardStones: 350, rewardReputation: 20, requiredRealmLevel: 2, durationMinutes: 45, targetRegionId: 'prov_shaanxi' },
  // Tang
  { id: 'm_tang_1', factionId: 'fac_tang', title: 'Recolección de Veneno', description: 'Trae 5 glándulas de araña de la cueva trasera.', difficulty: 'Medio', rewardStones: 300, rewardReputation: 15, requiredRealmLevel: 2, durationMinutes: 45, targetRegionId: 'prov_sichuan' },
  // Demonio Celestial
  { id: 'm_demo_1', factionId: 'fac_demonio_celestial', title: 'Prueba del Caos', description: 'Sobrevive a la presión del Qi demoníaco en Kunlun.', difficulty: 'Difícil', rewardStones: 800, rewardReputation: 40, requiredRealmLevel: 4, durationMinutes: 90, targetRegionId: 'prov_qinghai' },
  // Corte Imperial
  { id: 'm_corte_1', factionId: 'fac_corte', title: 'Cacería de Bandidos', description: 'Elimina a los saqueadores de la Ruta de la Seda.', difficulty: 'Medio', rewardStones: 500, rewardReputation: 30, requiredRealmLevel: 3, durationMinutes: 60, targetRegionId: 'prov_gansu' },
];

// En src/data/worldData.ts

// Añade esto al final del archivo
export interface CityBuilding {
  id: string;
  name: string;
  type: 'Mercado' | 'Forja' | 'Taberna' | 'Burdel' | 'Casa de Té';
  description: string;
}

export const CITY_BUILDINGS: Record<string, CityBuilding[]> = {
  'prov_henan': [
    { id: 'b_henan_market', name: 'Gran Bazar de Luoyang', type: 'Mercado', description: 'El mercado más grande del centro del imperio.' },
    { id: 'b_henan_forge', name: 'Forja de la Espada Menor', type: 'Forja', description: 'Forjan armas básicas para los monjes de Shaolin.' },
    { id: 'b_henan_tea', name: 'Casa de Té del Loto', type: 'Casa de Té', description: 'Un lugar para escuchar rumores y recuperar Qi.' },
  ],
  'prov_shaanxi': [
    { id: 'b_shaanxi_market', name: 'Mercado de la Seda de Xi\'an', type: 'Mercado', description: 'Comercio de seda, carbón y minerales.' },
    { id: 'b_shaanxi_forge', name: 'Forja del Filo del Dragón', type: 'Forja', description: 'Afiliada al Clan Long. Armas de alta calidad.' },
    { id: 'b_shaanxi_brothel', name: 'Pabellón de las Nubes', type: 'Burdel', description: 'Un lugar para el descanso y los secretos políticos.' },
  ],
  // Añade más provincias aquí...
  'prov_sichuan': [
    { id: 'b_sichuan_market', name: 'Bazar de los Venenos', type: 'Mercado', description: 'Hierbas exóticas y venenos del Clan Tang.' },
    { id: 'b_sichuan_tea', name: 'Casa de Té de los Cien Aromas', type: 'Casa de Té', description: 'El mejor té de la región, famoso por sus propiedades medicinales.' },
  ],
  // Añade el resto de provincias o un genérico
};

// Generador genérico para provincias sin edificios definidos
export function getCityBuildings(regionId: string): CityBuilding[] {
  if (CITY_BUILDINGS[regionId]) return CITY_BUILDINGS[regionId];
  return [
    { id: `b_${regionId}_market`, name: 'Mercado Local', type: 'Mercado', description: 'Un mercado modesto con bienes locales.' },
    { id: `b_${regionId}_tavern`, name: 'Taberna del Viajero', type: 'Taberna', description: 'Un lugar para descansar y escuchar noticias.' }
  ];
}