// src/core/data/world/seeds/geoChina.ts
// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRÍA BASE DEL REINO — proyección del mapa real de China al plano del juego.
//
// El mundo de Murim está montado sobre la geografía real de China. Este archivo
// es la "fuente de verdad" cartográfica: convierte coordenadas geográficas
// (longitud/latitud) a coordenadas de mapa del juego, y define las formaciones
// naturales canónicas (ríos, lagos, montañas, desiertos, cordilleras).
//
// Convención del sistema de coordenadas del juego:
//   - Mapa lógico: WORLD_SEED.gridSize = 1000 x 1000 tiles.
//   - X crece hacia el ESTE, Y crece hacia el SUR (arriba = norte).
//   - Envolvente geográfica china: lon [73,135], lat [17,54].
//   - Para que China QUEDE CUADRADA en el plano (ancho real ≈ 62° de lon,
//     alto real ≈ 37° de lat + corrección cos(lat)), se proyecta con escala
//     uniforme por eje: 1000/62 ≈ 16.13 tiles/grado en ambos ejes.
// ─────────────────────────────────────────────────────────────────────────────

import { Point } from '../types';
import { WORLD_SEED } from './worldSeed';

// ── 1. PROYECTOR GEOGRÁFICO ──────────────────────────────────────────────────

export const GEO_BOUNDS = {
  lonMin: 73,
  lonMax: 135,
  latMin: 20, // sur (delta del Perla / Hainan norte)
  latMax: 54, // norte (Mohe, Heilongjiang)
};

const GRID = WORLD_SEED.gridSize; // 1000 x 1000

/** Convierte (longitud, latitud) reales → coordenadas del mapa del juego. */
export function geoToMap(lon: number, lat: number): Point {
  const fx = (lon - GEO_BOUNDS.lonMin) / (GEO_BOUNDS.lonMax - GEO_BOUNDS.lonMin);
  const fy = (GEO_BOUNDS.latMax - lat) / (GEO_BOUNDS.latMax - GEO_BOUNDS.latMin);
  return {
    x: Math.round(fx * GRID.width),
    y: Math.round(fy * GRID.height),
  };
}

/** Inverso: coordenadas del mapa → (lon, lat) aproximada (para debug/hover). */
export function mapToGeo(x: number, y: number): { lon: number; lat: number } {
  const lon = GEO_BOUNDS.lonMin + (x / GRID.width) * (GEO_BOUNDS.lonMax - GEO_BOUNDS.lonMin);
  const lat = GEO_BOUNDS.latMax - (y / GRID.height) * (GEO_BOUNDS.latMax - GEO_BOUNDS.latMin);
  return { lon, lat };
}

/** Latitud aproximada de una Y de mapa (para biomas por latitud). */
export function mapLat(y: number): number {
  return GEO_BOUNDS.latMax - (y / GRID.height) * (GEO_BOUNDS.latMax - GEO_BOUNDS.latMin);
}

// ── 2. RÍOS PRINCIPALES (trazados por waypoints geográficos reales) ─────────

export interface RiverDef {
  id: string;
  name: string;
  /** Anchura base en tiles (el ancho final varía con caudal/estuario). */
  width: number;
  /** Waypoints en (lon,lat) reales, de cabecera a desembocadura. */
  waypointsGeo: Array<[number, number]>;
  /** Tramo navegable (tiles desde la desembocadura): permite barcas/pescar. */
  navigableFromMouth?: number;
  loreNote: string;
}

export const MAIN_RIVERS: RiverDef[] = [
  {
    id: 'river_yellow',
    name: 'Río Amarillo (Huang He)',
    width: 9,
    waypointsGeo: [
      [100.0, 34.8], // nacimiento meseta Qinghai (valle de Longyangxia)
      [103.4, 36.0], // Lanzhou
      [106.8, 37.5], // borde del desierto de Ordos (nodo de Yinshan)
      [108.5, 40.5], // gran codo norte (Baotou)
      [110.5, 39.5], // descenso por el Shanxi (Garganta de Jinsha)
      [111.0, 36.5], // paso de Mengjin (curva este)
      [114.0, 35.5], // llanura norte (Henan-Hebei)
      [116.5, 37.2], // Gran Canal paralelo
      [118.8, 37.8], // estuario Bohai (Shandong norte)
    ],
    navigableFromMouth: 260,
    loreNote: 'El Dragón Amarillo: cuna de la civilización imperial y tumba de ejércitos. Sus crecidas reescriben el mapa cada década.',
  },
  {
    id: 'river_yangtze',
    name: 'Río Yangtsé (Chang Jiang)',
    width: 11,
    waypointsGeo: [
      [97.0, 28.5],  // Garganta del Salto del Tigre (Yunnan/Sichuan)
      [104.0, 29.5], // Chongqing (Ciudad Flotante del Clan Tang)
      [109.0, 30.6], // Tres Gargantas
      [111.3, 30.6], // Yichang — entrada a la llanura
      [114.3, 30.5], // Wuhan (confluencia del Han)
      [117.0, 30.9], // Anqing / Jiujiang (lago Poyang al sur)
      [118.8, 32.0], // Nanjing
      [121.5, 31.4], // estuario (Shanghai / mar de la China Oriental)
    ],
    navigableFromMouth: 500,
    loreNote: 'El Gran Río que parte el reino en dos. Sus tres gargantas son la aduana natural entre las tierras salvajes de Shu y el corazón rico del Jiangnan.',
  },
  {
    id: 'river_pearl',
    name: 'Río de las Perlas (Zhu Jiang)',
    width: 6,
    waypointsGeo: [
      [106.5, 23.8], // confluencia cerca de Wuzhou
      [111.0, 23.2], // Nanning oriental
      [113.3, 22.8], // Guangzhou (Puerto del Sur)
      [113.9, 22.3], // delta hacia Macau
    ],
    navigableFromMouth: 220,
    loreNote: 'Vía comercial del sur: desde aquí sale la seda y la pólvora hacia ultramar, y entran reliquias que el Jianghu desconoce.',
  },
  {
    id: 'river_wei',
    name: 'Río Wei',
    width: 5,
    waypointsGeo: [
      [104.8, 34.8], // Gansu oriental
      [109.0, 34.5], // llanura de Guanzhong
      [109.3, 34.4], // Chang\'an (capital) — vena vital de la capital
      [110.2, 34.6], // confluencia con el Huang He
    ],
    navigableFromMouth: 120,
    loreNote: 'No es un río grande, pero sostiene la capital. Quien controla el Wei, alimenta a Chang\'an; quien envenena el Wei, derroca dinastías.',
  },
  {
    id: 'river_han',
    name: 'Río Han',
    width: 5,
    waypointsGeo: [
      [107.0, 33.2], // sur de Shaanxi (valle de Hanzhong)
      [110.0, 32.6], // Shiyan / embalse
      [112.5, 31.5], // noroeste de Hubei
      [114.3, 30.6], // confluye con el Yangtsé en Wuhan
    ],
    navigableFromMouth: 200,
    loreNote: 'Divide Hubei en "este del río" y "oeste del río"; los pescadores del Han juran que sus nieblas esconden templos hundidos.',
  },
  {
    id: 'river_liao',
    name: 'Río Liao',
    width: 5,
    waypointsGeo: [
      [120.5, 42.8], // alturas de Inner Mongolia/Liaoning oeste
      [122.5, 43.5], // cuenca de Liaoning
      [122.0, 41.5], // descenso al sur
      [121.8, 41.45], // desembocadura en el golfo de Liaodong
    ],
    navigableFromMouth: 100,
    loreNote: 'Frontera líquida del Dominio Norte: más allá del Liao empiezan los bosques congelados de Manchuria.',
  },
  {
    id: 'river_mekong_upper',
    name: 'Río Lancang (Alto Mekong)',
    width: 5,
    waypointsGeo: [
      [98.5, 25.0],  // Yunnan sur (Xishuangbanna)
      [100.2, 22.4], // frontera con Laos
      [101.5, 21.3], // Triángulo Dorado — salida de contrabando de Yunnan
    ],
    loreNote: 'La carretera de agua de las tribus del sur y del contrabando de sectas heterodoxas.',
  },
];

// ── 3. LAGOS (elípticos, posición geográfica real) ──────────────────────────

export interface LakeDef {
  id: string;
  name: string;
  centerGeo: [number, number];
  rxTiles: number; // radio horizontal en tiles
  ryTiles: number; // radio vertical en tiles
  loreNote: string;
}

export const MAIN_LAKES: LakeDef[] = [
  {
    id: 'lake_qinghai',
    name: 'Lago Qinghai',
    centerGeo: [100.2, 37.0],
    rxTiles: 34, ryTiles: 16,
    loreNote: 'El lago celeste de la meseta: dicen que su fondo guarda la puerta de una secta primordial congelada.',
  },
  {
    id: 'lake_poyang',
    name: 'Lago Poyang',
    centerGeo: [116.1, 29.2],
    rxTiles: 26, ryTiles: 34,
    loreNote: 'Lago respirador del Yangtsé: cambia de tamaño con las crecidas y ahoga naufragios llenos de tesoros.',
  },
  {
    id: 'lake_dongting',
    name: 'Lago Dongting',
    centerGeo: [112.8, 29.2],
    rxTiles: 24, ryTiles: 18,
    loreNote: 'Brumas del sur de Hunan: hogar de ermitaños alquimistas y del monstruo que los protege.',
  },
  {
    id: 'lake_taipo_proxy',
    name: 'Lago Tai (Taihu)',
    centerGeo: [120.2, 31.2],
    rxTiles: 20, ryTiles: 16,
    loreNote: 'En su orilla flotan los pabellones de té del Clan Moyong; bajo su superficie, archivos ahogados de la Guardia Imperial.',
  },
];

// ── 4. MONTANAS SAGRADAS Y PICOS (puntos de elevación máxima) ───────────────

export interface MountainPeakDef {
  id: string;
  name: string;
  centerGeo: [number, number];
  radiusTiles: number;
  heightLevel: 1 | 2 | 3; // 3 = cumbre perpetua (nieve), 2 = roca alta, 1 = estribación
  sacredSectId?: string;  // secta/clan lore que domina el pico
  loreNote: string;
}

export const MAIN_PEAKS: MountainPeakDef[] = [
  { id: 'peak_tai', name: 'Monte Tai (Taishan)', centerGeo: [117.1, 36.25], radiusTiles: 26, heightLevel: 2, sacredSectId: 'sect_zhuge_proxy', loreNote: 'Donde los emperadores dan gracias al cielo; peregrinación obligada todo artista marcial.' },
  { id: 'peak_shaolin', name: 'Monte Song (Songshan)', centerGeo: [113.0, 34.5], radiusTiles: 20, heightLevel: 2, loreNote: 'Valle de Shaolin: mil monjes guerreros tallados en arenisca.' },
  { id: 'peak_wudang', name: 'Montaña Wudang', centerGeo: [111.0, 32.4], radiusTiles: 22, heightLevel: 2, loreNote: 'Templos dorados del taiji; el equilibrio Yin-Yang hecho piedra.' },
  { id: 'peak_emei', name: 'Monte Emei', centerGeo: [103.3, 29.5], radiusTiles: 24, heightLevel: 3, loreNote: 'Pico sagrado del sur: niebla eterna y monjas espada.' },
  { id: 'peak_qingcheng', name: 'Monte Qingcheng', centerGeo: [103.6, 30.9], radiusTiles: 14, heightLevel: 1, loreNote: '"El mundo secreto y la tierra bendita": cuna del taoísmo Sichuan.' },
  { id: 'peak_huashan', name: 'Montaña Hua (Huashan)', centerGeo: [110.08, 34.48], radiusTiles: 18, heightLevel: 3, loreNote: 'Espada de granite: la escalada más mortal del imperio.' },
  { id: 'peak_hengshan_s', name: 'Monte Heng del Sur', centerGeo: [112.6, 27.3], radiusTiles: 16, heightLevel: 2, loreNote: 'Guardián de Hunan; pasos estrechos defendibles por diez hombres.' },
  { id: 'peak_changbai', name: 'Montaña Changbai', centerGeo: [128.1, 42.0], radiusTiles: 34, heightLevel: 3, loreNote: 'Volcán fronterizo del norte: en su cráter yace el Lago del Cielo y bestias de escarcha.' },
  { id: 'peak_zhongnan', name: 'Montes Zhongnan', centerGeo: [109.3, 33.4], radiusTiles: 20, heightLevel: 2, loreNote: 'Retiro de ermitaños al SUR de Chang\'an (limando con el valle del Han); la Secta Zhongnan vigila los pasos.' },
  { id: 'peak_kunlun_e', name: 'Kunlun Oriental', centerGeo: [90.0, 36.5], radiusTiles: 60, heightLevel: 3, loreNote: 'La cordillera de los dioses: límite helado del Culto Demonio Celestial.' }, // desplazado al oeste para no cubrir el codo del Amarillo/Ningxia
  { id: 'peak_tianshan', name: 'Tian Shan', centerGeo: [85.0, 42.8], radiusTiles: 70, heightLevel: 3, loreNote: 'Montes celestiales de Xinjiang: oasis fortificados entre glaciares.' },
  { id: 'peak_altai', name: 'Altái', centerGeo: [89.5, 47.5], radiusTiles: 45, heightLevel: 3, loreNote: 'Frontera nórdica remota: oro, lobos y tumbas de los antiguos.' },
  { id: 'peak_himalaya_seg', name: 'Himalaya (segmento Xizang)', centerGeo: [88.0, 28.3], radiusTiles: 80, heightLevel: 3, loreNote: 'El techo del mundo: monasterios colgados donde se cultiva el vacío absoluto.' },
  { id: 'peak_hengduan', name: 'Montañas Hengduan', centerGeo: [99.5, 27.0], radiusTiles: 45, heightLevel: 3, loreNote: 'Valles paralelos sur-norte: corredores de tribus y venenos de Yunnan.' },
  { id: 'peak_wutai', name: 'Monte Wutai', centerGeo: [113.6, 39.1], radiusTiles: 18, heightLevel: 2, loreNote: 'Montaña Buda del norte; santuario invernal de peregrinos armados.' },
];

// ── 5. CORDILLERAS LINEALES (huesos montañosos que unen picos) ──────────────

export interface RangeDef {
  id: string;
  name: string;
  pointsGeo: Array<[number, number]>;
  thicknessTiles: number;
  heightLevel: 1 | 2 | 3;
}

export const MAIN_RANGES: RangeDef[] = [
  { id: 'range_qinling', name: 'Cordillera Qinling', pointsGeo: [[104.5, 33.9], [108.0, 34.0], [111.5, 34.1]], thicknessTiles: 22, heightLevel: 2 }, // divide Shaanxi: separa Wei del Han
  { id: 'range_yinshan', name: 'Yin Shan', pointsGeo: [[106.0, 40.8], [111.0, 40.9], [114.5, 41.5]], thicknessTiles: 18, heightLevel: 2 },       // borde norte del codo del Amarillo
  { id: 'range_taihang', name: 'Taihang Shan', pointsGeo: [[112.5, 35.0], [113.8, 37.5], [114.5, 39.5], [115.5, 40.8]], thicknessTiles: 20, heightLevel: 2 }, // muro entre Henan y Hebei/Shanxi
  { id: 'range_liupan', name: 'Liupan Shan', pointsGeo: [[105.5, 36.0], [106.5, 35.5]], thicknessTiles: 14, heightLevel: 1 },
  { id: 'range_ronmaiyin', name: 'Ron Ma Yin (frontera Yunnan)', pointsGeo: [[102.0, 23.0], [104.0, 22.8]], thicknessTiles: 12, heightLevel: 1 },
  { id: 'range_wuyi', name: 'Montes Wuyi', pointsGeo: [[116.0, 27.8], [117.8, 26.5], [119.5, 25.8]], thicknessTiles: 16, heightLevel: 1 }, // divide Jiangxi-Fujian
  { id: 'range_dabie', name: 'Dabie Shan', pointsGeo: [[114.0, 31.5], [115.8, 31.2], [116.6, 30.8]], thicknessTiles: 14, heightLevel: 1 },
  { id: 'range_nanling', name: 'Nan Ling', pointsGeo: [[110.0, 25.2], [112.5, 24.8], [114.5, 24.6]], thicknessTiles: 16, heightLevel: 1 }, // barrera Guangdong/Hunan
  { id: 'range_qilian', name: 'Qilian Shan', pointsGeo: [[98.0, 38.8], [100.5, 38.2], [102.8, 37.8]], thicknessTiles: 24, heightLevel: 3 }, // pasillo de la Ruta de la Seda (Gansu)
  { id: 'range_karakoram', name: 'Karakorum (borde)', pointsGeo: [[76.5, 35.8], [80.5, 35.5]], thicknessTiles: 30, heightLevel: 3 },
];

// ── 6. DESIERTOS Y ESTEPAS ÁRIDAS (manchas elípticas) ───────────────────────

export interface DesertDef {
  id: string;
  name: string;
  centerGeo: [number, number];
  rxTiles: number;
  ryTiles: number;
  loreNote: string;
}

export const MAIN_DESERTS: DesertDef[] = [
  { id: 'desert_taklamakan', name: 'Taklamakan', centerGeo: [83.5, 39.0], rxTiles: 110, ryTiles: 55, loreNote: '"Entrar y no salir". Dunas que devoran caravanas; bajo la arena, ruinas de reinos pre-imperiales.' },
  { id: 'desert_gobi', name: 'Gobi', centerGeo: [103.5, 42.5], rxTiles: 95, ryTiles: 45, loreNote: 'Estepa pedregosa del norte: bandidos jinetes y bestias de sombra.' },
  { id: 'desert_ordos', name: 'Arena de Ordos', centerGeo: [108.0, 38.5], rxTiles: 38, ryTiles: 26, loreNote: 'Islas de dunas dentro del codo del Amarillo; campamentos de clanes nómadas.' },
  { id: 'desert_alashan', name: 'Alashan', centerGeo: [102.0, 40.0], rxTiles: 34, ryTiles: 20, loreNote: 'Pasillo árido entre Gansu y Mongolia: emboscadas clásicas de la Ruta de la Seda.' },
  { id: 'basin_turpan', name: 'Depresión de Turpan', centerGeo: [89.5, 42.5], rxTiles: 24, ryTiles: 14, loreNote: 'Infierno seco de Xinjiang: uvas de sangre y ladridos de los perros del Culto.' },
];

// ── 7. MAR (frontera este/sureste) ───────────────────────────────────────────

export const SEA_POLYGON_GEO: Array<[number, number]> = [
  [122.5, 41.0],   // Bohai / Liaodong
  [121.0, 38.8],   // Shandong peninsula tip (dips inland)
  [119.0, 37.0],   // Bohai coast
  [118.5, 35.0],   // Jiangsu north
  [120.5, 32.0],   // Jiangsu coast
  [121.9, 31.0],   // estuario Yangtsé
  [121.5, 28.0],   // Zhejiang
  [120.0, 26.0],   // Fujian
  [118.0, 24.0],   // Fujian sur
  [116.0, 22.5],   // Guangdong este
  [113.5, 21.8],   // delta Perla
  [110.0, 21.0],   // Zhanjiang
  [108.5, 20.5],   // Guangxi costa / Vietnam
  [107.0, 19.0],   // límite suroeste
  [135.5, 17.0],   // cierre al océano (sureste lejano)
  [135.5, 41.0],   // cierre al océano (noreste lejano)
];

// ── 8. GRAN CANAL (ruta acuática artificial — conecta POIs comerciales) ─────

export const GRAND_CANAL_GEO: Array<[number, number]> = [
  [116.4, 39.9],  // Beijing (Hebei norte)
  [117.2, 39.1],  // Tianjin
  [117.9, 36.5],  // Shandong occidental
  [118.7, 35.0],  // cruzando el Amarillo
  [117.0, 33.0],  // Jiangsu norte (Huai'an)
  [118.8, 32.0],  // near Nanjing
  [120.2, 31.2],  // Suzhou/Taihu
  [120.2, 30.2],  // Hangzhou (Zhejiang)
];

// ── 9. HELPER DE PRECISIÓN PARA CHUNKS ───────────────────────────────────────
// Un chunk cubre [baseX, baseX+CHUNK_SIZE). Esta función dice si un círculo
// geográfico podría tocar ese rango (para descartar trabajo por chunk barato).

export function circleTouchesChunk(
  center: Point, radius: number,
  chunkBaseX: number, chunkBaseY: number, chunkSize: number
): boolean {
  const cx = Math.max(chunkBaseX, Math.min(center.x, chunkBaseX + chunkSize));
  const cy = Math.max(chunkBaseY, Math.min(center.y, chunkBaseY + chunkSize));
  const dx = center.x - cx;
  const dy = center.y - cy;
  return dx * dx + dy * dy <= (radius + 2) * (radius + 2);
}
