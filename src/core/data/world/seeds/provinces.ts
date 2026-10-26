import { ProvinceSeedData } from '../types';

export const INITIAL_PROVINCES: ProvinceSeedData[] = [
  // --- 1. CORAZÓN IMPERIAL (Zhongyuan) ---
  {
    id: 'prov_henan',
    name: 'Henan',
    region: 'Corazón Imperial',
    biome: 'Estepa',
    coords: { x: 50, y: 50 },
    baseDifficulty: 1.0,
    description: 'Llanuras centrales cruzadas por el río Amarillo, hogar de Shaolin y el centro espiritual del Jianghu.'
  },
  {
    id: 'prov_shaanxi',
    name: 'Shaanxi',
    region: 'Corazón Imperial',
    biome: 'Montaña',
    coords: { x: 45, y: 48 },
    baseDifficulty: 1.0,
    description: 'Tierras altas y escarpadas donde descansa Chang\'an, cuna de dinastías y caminos de piedra milenarios.'
  },
  {
    id: 'prov_hubei',
    name: 'Hubei',
    region: 'Corazón Imperial',
    biome: 'Bosque',
    coords: { x: 52, y: 58 },
    baseDifficulty: 1.1,
    description: 'Dominio de las montañas de Wudang y el centro del equilibrio dinámico entre el Yin y el Yang.'
  },
  {
    id: 'prov_anhui',
    name: 'Anhui',
    region: 'Corazón Imperial',
    biome: 'Bosque',
    coords: { x: 58, y: 53 },
    baseDifficulty: 1.1,
    description: 'Territorio ancestral del Clan Namgung, donde la ley marcial de la espada pesa tanto como la del Emperador.'
  },
  {
    id: 'prov_hebei',
    name: 'Hebei',
    region: 'Corazón Imperial',
    biome: 'Estepa',
    coords: { x: 53, y: 42 },
    baseDifficulty: 1.1,
    description: 'Tierras de guerreros robustos, sables gigantes y guardianes de las puertas norteñas del imperio.'
  },

  // --- 2. FRONTERAS OESTE (Tierras Salvajes) ---
  {
    id: 'prov_xinjiang',
    name: 'Xinjiang',
    region: 'Fronteras Oeste',
    biome: 'Desierto',
    coords: { x: 15, y: 30 },
    baseDifficulty: 1.8,
    description: 'Vastas extensiones áridas y las Montañas Kunlun; sede temida del Culto Divino del Demonio Celestial.'
  },
  {
    id: 'prov_sichuan',
    name: 'Sichuan',
    region: 'Fronteras Oeste',
    biome: 'Bosque',
    coords: { x: 32, y: 65 },
    baseDifficulty: 1.3,
    description: 'Cuencas brumosas repletas de bambú espiritual, hierbas raras y dominios letales del Clan Tang.'
  },
  {
    id: 'prov_yunnan',
    name: 'Yunnan',
    region: 'Fronteras Oeste',
    biome: 'Pantano',
    coords: { x: 30, y: 82 },
    baseDifficulty: 1.4,
    description: 'Tierras tropicales y densas selvas fronterizas con tribus bárbaras y refugio de sectas heterodoxas.'
  },
  {
    id: 'prov_guizhou',
    name: 'Guizhou',
    region: 'Fronteras Oeste',
    biome: 'Montaña',
    coords: { x: 38, y: 74 },
    baseDifficulty: 1.3,
    description: 'Montañas kársticas famosas por sus profundas minas de hierro y forjas de armas de altísima calidad.'
  },
  {
    id: 'prov_qinghai',
    name: 'Qinghai',
    region: 'Fronteras Oeste',
    biome: 'Nieve',
    coords: { x: 24, y: 45 },
    baseDifficulty: 1.7,
    description: 'Mesetas heladas y lagos celestiales donde resuenan los ecos de las leyes del caos primordial.'
  },
  {
    id: 'prov_gansu',
    name: 'Gansu',
    region: 'Fronteras Oeste',
    biome: 'Desierto',
    coords: { x: 28, y: 40 },
    baseDifficulty: 1.5,
    description: 'La polvorienta y peligrosa puerta de entrada a la Ruta de la Seda, infestada de bandidos de alto nivel.'
  },
  {
    id: 'prov_xizang',
    name: 'Xizang',
    region: 'Fronteras Oeste',
    biome: 'Nieve',
    coords: { x: 18, y: 55 },
    baseDifficulty: 1.8,
    description: 'Techo del mundo, cumbres nevadas eternas y monasterios donde se practica el vacío mental absoluto.'
  },

  // --- 3. DOMINIO NORTE (Tierras Frías) ---
  {
    id: 'prov_heilongjiang',
    name: 'Heilongjiang',
    region: 'Dominio Norte',
    biome: 'Nieve',
    coords: { x: 75, y: 15 },
    baseDifficulty: 1.9,
    description: 'El extremo norte helado, permafrost infinito y hogar de bestias espirituales de escarcha pura.'
  },
  {
    id: 'prov_jilin',
    name: 'Jilin',
    region: 'Dominio Norte',
    biome: 'Nieve',
    coords: { x: 72, y: 22 },
    baseDifficulty: 1.7,
    description: 'Montañas Changbai y bosques congelados donde crece el codiciado Ginseng Emperador.'
  },
  {
    id: 'prov_liaoning',
    name: 'Liaoning',
    region: 'Dominio Norte',
    biome: 'Montaña',
    coords: { x: 68, y: 30 },
    baseDifficulty: 1.5,
    description: 'Puerta marítima y terrestre del norte, resguardada por fortalezas militares y clanes aristocráticos.'
  },
  {
    id: 'prov_shanxi',
    name: 'Shanxi',
    region: 'Dominio Norte',
    biome: 'Montaña',
    coords: { x: 48, y: 40 },
    baseDifficulty: 1.2,
    description: 'Escarpados pasos de montaña vigilados estricamente por la Secta Zhongnan contra incursiones externas.'
  },

  // --- 4. LITORAL ESTE (Comercio y Riqueza) ---
  {
    id: 'prov_shandong',
    name: 'Shandong',
    region: 'Litoral Este',
    biome: 'Montaña',
    coords: { x: 62, y: 44 },
    baseDifficulty: 1.2,
    description: 'Hogar del Clan Zhuge en el Valle del Cálculo Eterno; cuna de grandes estrategas y maestros de la lanza.'
  },
  {
    id: 'prov_jiangsu',
    name: 'Jiangsu',
    region: 'Litoral Este',
    biome: 'Costa',
    coords: { x: 65, y: 55 },
    baseDifficulty: 1.2,
    description: 'Una intrincada red de canales navegables y ciudades comerciales donde el Clan Moyong dirige las finanzas.'
  },
  {
    id: 'prov_zhejiang',
    name: 'Zhejiang',
    region: 'Litoral Este',
    biome: 'Costa',
    coords: { x: 67, y: 62 },
    baseDifficulty: 1.2,
    description: 'Astilleros imperiales, brisas marinas y la Secta Diancang protegiendo las rutas comerciales del este.'
  },
  {
    id: 'prov_fujian',
    name: 'Fujian',
    region: 'Litoral Este',
    biome: 'Costa',
    coords: { x: 64, y: 72 },
    baseDifficulty: 1.3,
    description: 'Costa montañosa y escarpada, refugio ideal para el contrabando de reliquias marciales y transacciones oscuras.'
  },

  // --- 5. TIERRAS SUR (Selva y Misterio) ---
  {
    id: 'prov_hunan',
    name: 'Hunan',
    region: 'Tierras Sur',
    biome: 'Bosque',
    coords: { x: 52, y: 68 },
    baseDifficulty: 1.2,
    description: 'Lagos brumosos, colinas ondulantes y sabios ermitaños que estudian antiguos secretos alquímicos.'
  },
  {
    id: 'prov_jiangxi',
    name: 'Jiangxi',
    region: 'Tierras Sur',
    biome: 'Bosque',
    coords: { x: 58, y: 66 },
    baseDifficulty: 1.2,
    description: 'Valles fluviales ricos en minerales y sectas menores dedicadas al perfeccionamiento del cuerpo y mente.'
  },
  {
    id: 'prov_guangdong',
    name: 'Guangdong',
    region: 'Tierras Sur',
    biome: 'Costa',
    coords: { x: 55, y: 80 },
    baseDifficulty: 1.3,
    description: 'Puertos tropicales del sur, comercio exterior dinámico y escuelas de artes marciales de golpe externo.'
  },
  {
    id: 'prov_guangxi',
    name: 'Guangxi',
    region: 'Tierras Sur',
    biome: 'Pantano',
    coords: { x: 45, y: 78 },
    baseDifficulty: 1.3,
    description: 'Paisajes de picos singulares de piedra caliza, ríos subterráneos y criaturas de pantano venenosas.'
  },
  {
    id: 'prov_ningxia',
    name: 'Ningxia',
    region: 'Dominio Norte',
    biome: 'Estepa',
    coords: { x: 38, y: 38 },
    baseDifficulty: 1.4,
    description: 'Franja fronteriza de transición entre las estepas del norte y las arenas del oeste, zona de constante fricción.'
  }
];