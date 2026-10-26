import { ProvinceSeedData } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// COORDENADAS GEOGRÁFICAS REALES (lon, lat) → proyectadas a mapa 1000x1000.
// Antes estas coords eran arbitrarias (Chang'an caía en el desierto de Gobi).
// Ahora cada provincia está anclada a su posición real en China, coherente con
// ríos, montañas y desiertos definidos en geoChina.ts.
// La proyección se aplica perezosamente vía `provinceMapCoords()` para no
// duplicar datos; las claves crudas quedan como lon/lat.
// ─────────────────────────────────────────────────────────────────────────────

export interface RawProvince {
  id: string;
  name: string;
  region: ProvinceSeedData['region'];
  biome: ProvinceSeedData['biome'];
  geo: [number, number];      // [lon, lat] capital/asentamiento principal
  baseDifficulty: number;
  description: string;
}

const RAW_PROVINCES: RawProvince[] = [
  // --- 1. CORAZÓN IMPERIAL (Zhongyuan) ---
  {
    id: 'prov_henan', name: 'Henan', region: 'Corazón Imperial', biome: 'Estepa',
    geo: [113.6, 34.7], // Kaifeng — entre el Amarillo y Songshan
    baseDifficulty: 1.0,
    description: 'Llanuras centrales cruzadas por el río Amarillo, hogar de Shaolin y el centro espiritual del Jianghu.'
  },
  {
    id: 'prov_shaanxi', name: 'Shaanxi', region: 'Corazón Imperial', biome: 'Montaña',
    geo: [108.95, 34.35], // Chang\'an sobre el río Wei, al norte de Qinling
    baseDifficulty: 1.0,
    description: 'Tierras altas y escarpadas donde descansa Chang\'an, cuna de dinastías y caminos de piedra milenarios.'
  },
  {
    id: 'prov_hubei', name: 'Hubei', region: 'Corazón Imperial', biome: 'Bosque',
    geo: [112.2, 30.4], // Wudang, orilla norte del Yangtsé
    baseDifficulty: 1.1,
    description: 'Dominio de las montañas de Wudang y el centro del equilibrio dinámico entre el Yin y el Yang.'
  },
  {
    id: 'prov_anhui', name: 'Anhui', region: 'Corazón Imperial', biome: 'Bosque',
    geo: [117.2, 31.9], // Hefei, entre Yangtsé y Gran Canal
    baseDifficulty: 1.1,
    description: 'Territorio ancestral del Clan Namgung, donde la ley marcial de la espada pesa tanto como la del Emperador.'
  },
  {
    id: 'prov_hebei', name: 'Hebei', region: 'Corazón Imperial', biome: 'Estepa',
    geo: [115.5, 38.5], // norte, tras el muro Taihang, cerca del Gran Canal
    baseDifficulty: 1.1,
    description: 'Tierras de guerreros robustos, sables gigantes y guardianes de las puertas norteñas del imperio.'
  },

  // --- 2. FRONTERAS OESTE (Tierras Salvajes) ---
  {
    id: 'prov_xinjiang', name: 'Xinjiang', region: 'Fronteras Oeste', biome: 'Desierto',
    geo: [80.3, 41.2], // cuenca Tarim, sur de Tian Shan, oeste de Taklamakan
    baseDifficulty: 1.8,
    description: 'Vastas extensiones áridas y las Montañas Kunlun; sede temida del Culto Divino del Demonio Celestial.'
  },
  {
    id: 'prov_sichuan', name: 'Sichuan', region: 'Fronteras Oeste', biome: 'Bosque',
    geo: [104.1, 30.6], // Chengdú, cuenca regada por el Yangtsé, Emei al suroeste
    baseDifficulty: 1.3,
    description: 'Cuencas brumosas repletas de bambú espiritual, hierbas raras y dominios letales del Clan Tang.'
  },
  {
    id: 'prov_yunnan', name: 'Yunnan', region: 'Fronteras Oeste', biome: 'Pantano',
    geo: [101.7, 24.9], // Kunming, entre Hengduan y el Lancang
    baseDifficulty: 1.4,
    description: 'Tierras tropicales y densas selvas fronterizas con tribus bárbaras y refugio de sectas heterodoxas.'
  },
  {
    id: 'prov_guizhou', name: 'Guizhou', region: 'Fronteras Oeste', biome: 'Montaña',
    geo: [106.7, 26.8], // Guiyang, karst del sur
    baseDifficulty: 1.3,
    description: 'Montañas kársticas famosas por sus profundas minas de hierro y forjas de armas de altísima calidad.'
  },
  {
    id: 'prov_qinghai', name: 'Qinghai', region: 'Fronteras Oeste', biome: 'Nieve',
    geo: [97.5, 35.5], // meseta al sur del Lago Qinghai, cabecera del Amarillo
    baseDifficulty: 1.7,
    description: 'Mesetas heladas y lagos celestiales donde resuenan los ecos de las leyes del caos primordial.'
  },
  {
    id: 'prov_gansu', name: 'Gansu', region: 'Fronteras Oeste', biome: 'Desierto',
    geo: [100.5, 38.2], // corredor Hexi bajo Qilian Shan (Ruta de la Seda)
    baseDifficulty: 1.5,
    description: 'La polvorienta y peligrosa puerta de entrada a la Ruta de la Seda, infestada de bandidos de alto nivel.'
  },
  {
    id: 'prov_xizang', name: 'Xizang', region: 'Fronteras Oeste', biome: 'Nieve',
    geo: [88.5, 31.0], // meseta tibetana, norte de Himalaya
    baseDifficulty: 1.8,
    description: 'Techo del mundo, cumbres nevadas eternas y monasterios donde se practica el vacío mental absoluto.'
  },

  // --- 3. DOMINIO NORTE (Tierras Frías) ---
  {
    id: 'prov_heilongjiang', name: 'Heilongjiang', region: 'Dominio Norte', biome: 'Nieve',
    geo: [128.5, 46.5], // llanura del Amur, noreste profundo
    baseDifficulty: 1.9,
    description: 'El extremo norte helado, permafrost infinito y hogar de bestias espirituales de escarcha pura.'
  },
  {
    id: 'prov_jilin', name: 'Jilin', region: 'Dominio Norte', biome: 'Bosque',
    geo: [127.5, 42.5], // pies de Changbai — taiga nevada (bosque de coníferas)
    baseDifficulty: 1.7,
    description: 'Montañas Changbai y bosques congelados donde crece el codiciado Ginseng Emperador.'
  },
  {
    id: 'prov_liaoning', name: 'Liaoning', region: 'Dominio Norte', biome: 'Montaña',
    geo: [122.5, 41.5], // cuenca del Liao, puerta de Manchuria
    baseDifficulty: 1.5,
    description: 'Puerta marítima y terrestre del norte, resguardada por fortalezas militares y clanes aristocráticos.'
  },
  {
    id: 'prov_shanxi', name: 'Shanxi', region: 'Dominio Norte', biome: 'Montaña',
    geo: [112.5, 37.8], // meseta entre Taihang y el codo del Amarillo, Wutai Shan
    baseDifficulty: 1.2,
    description: 'Escarpados pasos de montaña vigilados estrictamente por la Secta Zhongnan contra incursiones externas.'
  },

  // --- 4. LITORAL ESTE (Comercio y Riqueza) ---
  {
    id: 'prov_shandong', name: 'Shandong', region: 'Litoral Este', biome: 'Montaña',
    geo: [117.0, 36.2], // Monte Tai, península entre Bohai y Amarillo
    baseDifficulty: 1.2,
    description: 'Hogar del Clan Zhuge en el Valle del Cálculo Eterno; cuna de grandes estrategas y maestros de la lanza.'
  },
  {
    id: 'prov_jiangsu', name: 'Jiangsu', region: 'Litoral Este', biome: 'Costa',
    geo: [119.5, 32.5], // Nanjing / canales Jiangnan, estuario del Yangtsé
    baseDifficulty: 1.2,
    description: 'Una intrincada red de canales navegables y ciudades comerciales donde el Clan Moyong dirige las finanzas.'
  },
  {
    id: 'prov_zhejiang', name: 'Zhejiang', region: 'Litoral Este', biome: 'Costa',
    geo: [120.5, 30.0], // Hangzhou, boca sur del Gran Canal y lago Tai vecino
    baseDifficulty: 1.2,
    description: 'Astilleros imperiales, brisas marinas y la Secta Diancang protegiendo las rutas comerciales del este.'
  },
  {
    id: 'prov_fujian', name: 'Fujian', region: 'Litoral Este', biome: 'Costa',
    geo: [118.3, 26.0], // costa montañosa tras los Montes Wuyi
    baseDifficulty: 1.3,
    description: 'Costa montañosa y escarpada, refugio ideal para el contrabando de reliquias marciales y transacciones oscuras.'
  },

  // --- 5. TIERRAS SUR (Selva y Misterio) ---
  {
    id: 'prov_hunan', name: 'Hunan', region: 'Tierras Sur', biome: 'Bosque',
    geo: [111.5, 27.5], // sur del Dongting, norte de Nan Ling
    baseDifficulty: 1.2,
    description: 'Lagos brumosos, colinas ondulantes y sabios ermitaños que estudian antiguos secretos alquímicos.'
  },
  {
    id: 'prov_jiangxi', name: 'Jiangxi', region: 'Tierras Sur', biome: 'Bosque',
    geo: [115.8, 27.5], // valle del Gan, entre Poyang y Montes Wuyi
    baseDifficulty: 1.2,
    description: 'Valles fluviales ricos en minerales y sectas menores dedicadas al perfeccionamiento del cuerpo y mente.'
  },
  {
    id: 'prov_guangdong', name: 'Guangdong', region: 'Tierras Sur', biome: 'Costa',
    geo: [113.3, 23.1], // Guangzhou, delta del Río de las Perlas
    baseDifficulty: 1.3,
    description: 'Puertos tropicales del sur, comercio exterior dinámico y escuelas de artes marciales de golpe externo.'
  },
  {
    id: 'prov_guangxi', name: 'Guangxi', region: 'Tierras Sur', biome: 'Pantano',
    geo: [108.3, 23.8], // karst de Guilin, alto Zhu Jiang
    baseDifficulty: 1.3,
    description: 'Paisajes de picos singulares de piedra caliza, ríos subterráneos y criaturas de pantano venenosas.'
  },
  {
    id: 'prov_ningxia', name: 'Ningxia', region: 'Dominio Norte', biome: 'Estepa',
    geo: [106.2, 37.3], // Yinchuan, oasis del Amarillo frente a Alashan
    baseDifficulty: 1.4,
    description: 'Franja fronteriza de transición entre las estepas del norte y las arenas del oeste, zona de constante fricción.'
  }
];

// ── Proyección perezosa + caché ─────────────────────────────────────────────
import { geoToMap } from './geoChina';

let projectedCache: ProvinceSeedData[] | null = null;

/** PROVINCIAS ya proyectadas a coordenadas del mapa 1000x1000 (con caché). */
export const INITIAL_PROVINCES: ProvinceSeedData[] = new Proxy({} as ProvinceSeedData[], {
  get(_t, prop) {
    if (!projectedCache) {
      projectedCache = RAW_PROVINCES.map((p) => ({
        id: p.id,
        name: p.name,
        region: p.region,
        biome: p.biome,
        coords: geoToMap(p.geo[0], p.geo[1]),
        baseDifficulty: p.baseDifficulty,
        description: p.description,
      }));
    }
    return (projectedCache as any)[prop as any];
  },
});

/** Acceso directo a la definición cruda (lon/lat) de una provincia. */
export function getRawProvince(id: string): RawProvince | undefined {
  return RAW_PROVINCES.find((p) => p.id === id);
}

/** ¿Qué provincia contiene este punto del mapa? (vecino más cercano ponderado) */
export function provinceAt(x: number, y: number): ProvinceSeedData {
  const list = INITIAL_PROVINCES;
  let best = list[0];
  let bestD = Infinity;
  for (const p of list) {
    const d = (p.coords.x - x) ** 2 + (p.coords.y - y) ** 2;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}