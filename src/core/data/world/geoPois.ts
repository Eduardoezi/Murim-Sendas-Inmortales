// src/core/data/world/geoPois.ts
// ─────────────────────────────────────────────────────────────────────────────
// Puntos de interés del reino anclados a la geografía real de China (lore
// wulin/murim). Cada POI se proyecta con geoToMap() y se le aplica el mismo
// "desplazamiento seguro" (BFS determinista) que las capitales, de modo que
// NUNCA caigan sobre río/lago/mar/cumbre. Lazy + cacheado: coste cero si el
// juego no consulta los POIs.
// ─────────────────────────────────────────────────────────────────────────────

import { Point } from './types';
import { geoToMap } from './seeds/geoChina';
import { findSafeOffset, isBuildableGeo, sampleGeo } from './generators/geoSampler';
import { INITIAL_PROVINCES, provinceAt } from './seeds/provinces';

export type MinimapPoiKind = 'capital' | 'sect' | 'landmark';

export interface GeoPoi {
  id: string;
  name: string;
  kind: MinimapPoiKind;
  /** Coordenada del mapa 1000x1000 YA desplazada a solar transitable. */
  pos: Point;
  provinceId: string;
  loreNote?: string;
}

// Lugares sagrados/marcas del wulin con posición geográfica real (lon, lat).
const SECTS_GEO: Array<{ id: string; name: string; geo: [number, number]; loreNote: string }> = [
  { id: 'poi_shaolin',   name: 'Monasterio Shaolin',  geo: [113.0, 34.52], loreNote: 'El templo del bastón: cuna del puño externo.' },
  { id: 'poi_wudang',    name: 'Secta Wudang',        geo: [111.0, 32.42], loreNote: 'Taiji y espada interna: el equilibrio Yin.' },
  { id: 'poi_emei',      name: 'Secta Emei',          geo: [103.33, 29.52], loreNote: 'Monjas espada en la niebla del sur.' },
  { id: 'poi_huashan',   name: 'Secta Hua Shan',      geo: [110.08, 34.49], loreNote: 'La espada más afilada del imperio.' },
  { id: 'poi_qingcheng', name: 'Secta Qingcheng',     geo: [103.62, 30.9],  loreNote: 'Cuna taoísta: espadas de aire puro.' },
  { id: 'poi_changbai',  name: 'Escuela Changbai',    geo: [128.1, 42.0],   loreNote: 'Hijos del volcán: palmas de fuego sobre nieve.' },
];

// Hitos naturales singulares (lagos/picos/desierto) como objetivos de viaje.
const LANDMARKS_GEO: Array<{ id: string; name: string; geo: [number, number]; loreNote: string }> = [
  { id: 'poi_lake_menggu', name: 'Lago Menggu (Dongting)', geo: [112.75, 29.25], loreNote: 'Neblina y barcos piratas: paso al sur profundo.' },
  { id: 'poi_lake_cielo',  name: 'Lago del Cielo (Changbai cráter)', geo: [128.25, 42.05], loreNote: 'Agua de cielo: hierba de mil años.' },
  { id: 'poi_gate_yumen',  name: 'Pasada de Yumen',        geo: [97.0, 40.15],  loreNote: 'Última puerta del imperio hacia el desierto.' },
  { id: 'poi_poyang',      name: 'Lago Poyang',            geo: [116.0, 29.1],  loreNote: 'Mar interior del Jiangnan en la crecida.' },
];

let cache: GeoPoi[] | null = null;

function safePlace(id: string, lon: number, lat: number): Point {
  const base = geoToMap(lon, lat);
  if (isBuildableGeo(sampleGeo(base.x, base.y))) return base;
  const off = findSafeOffset(base.x, base.y, 12, `poi_${id}`);
  return { x: base.x + off.dx, y: base.y + off.dy };
}

/** Todos los POIs del reino (capitales + sectas + hitos), una sola vez. */
export function getWorldPois(): GeoPoi[] {
  if (cache) return cache;
  const list: GeoPoi[] = [];

  for (const p of INITIAL_PROVINCES) {
    list.push({
      id: p.id, name: p.name, kind: 'capital',
      pos: p.coords, provinceId: p.id,
    });
  }
  for (const s of SECTS_GEO) {
    const pos = safePlace(s.id, s.geo[0], s.geo[1]);
    list.push({ id: s.id, name: s.name, kind: 'sect', pos, provinceId: provinceAt(pos.x, pos.y).id, loreNote: s.loreNote });
  }
  for (const l of LANDMARKS_GEO) {
    const pos = safePlace(l.id, l.geo[0], l.geo[1]);
    list.push({ id: l.id, name: l.name, kind: 'landmark', pos, provinceId: provinceAt(pos.x, pos.y).id, loreNote: l.loreNote });
  }

  cache = list;
  return list;
}
