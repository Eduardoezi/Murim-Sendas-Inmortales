// src/core/data/world/generators/geoSampler.ts
// ─────────────────────────────────────────────────────────────────────────────
// Muestreo determinista de la geometría real de China sobre el plano del juego.
// Sin estado global: cualquier tile (x,y) puede consultarse en O(waypoints).
// Lo usan: terrainGenerator (capa base), ChunkManager (colisiones/visual),
// y más adelante worldLayout (ubicación de POIs coherentes con el terreno).
// ─────────────────────────────────────────────────────────────────────────────

import { Point } from '../types';
import {
  geoToMap, MAIN_RIVERS, MAIN_LAKES, MAIN_PEAKS, MAIN_RANGES,
  MAIN_DESERTS, SEA_POLYGON_GEO, GRAND_CANAL_GEO, RiverDef,
  LakeDef, MountainPeakDef, RangeDef, DesertDef,
} from '../seeds/geoChina';
import { stringToHash, mulberry32 } from '../../../utils/prng';
import { mapLat } from '../seeds/geoChina';
import { sampleGeoCached, __bindSampleGeo } from './geoTileCache';

// Enlaza el muestreador crudo en la caché (rompe el ciclo de imports:
// geoTileCache no importa funciones de este módulo, solo tipos).
__bindSampleGeo(sampleGeo);

// Precomputar los trazados en coords de mapa una sola vez (determinista).
interface Polyline { pts: Point[]; cum: number[]; totalLen: number; }

function buildPolyline(geoWaypoints: Array<[number, number]>): Polyline {
  const pts = geoWaypoints.map(([lon, lat]) => geoToMap(lon, lat));
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return { pts, cum, totalLen: cum[cum.length - 1] };
}

const RIVER_PATHS: Array<{ def: RiverDef; line: Polyline }> =
  MAIN_RIVERS.map((def) => ({ def, line: buildPolyline(def.waypointsGeo) }));

const CANAL_LINE: Polyline = buildPolyline(GRAND_CANAL_GEO);

const RANGE_LINES = MAIN_RANGES.map((r) => ({
  def: r,
  line: buildPolyline(r.pointsGeo),
}));

const SEA_POLY_MAP: Point[] = SEA_POLYGON_GEO.map(([lon, lat]) => geoToMap(lon, lat));

const LAKES_MAP = MAIN_LAKES.map((l) => ({ def: l, center: geoToMap(l.centerGeo[0], l.centerGeo[1]) }));
const PEAKS_MAP = MAIN_PEAKS.map((p) => ({ def: p, center: geoToMap(p.centerGeo[0], p.centerGeo[1]) }));
const DESERTS_MAP = MAIN_DESERTS.map((d) => ({ def: d, center: geoToMap(d.centerGeo[0], d.centerGeo[1]) }));

// ── utilidades geométricas ───────────────────────────────────────────────────

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * abx + (py - ay) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

/** Distancia mínima del punto a una polilínea suavizada (con serpenteo senoidal). */
function distToRiver(x: number, y: number, line: Polyline, seedNum: number): number {
  let best = Infinity;
  const { pts } = line;
  // Serpenteo: desplazamos cada tramo perpendicularmente con sin() determinista.
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1].x, ay = pts[i - 1].y;
    const bx = pts[i].x, by = pts[i].y;
    const segLen = Math.hypot(bx - ax, by - ay);
    if (segLen < 1) continue;
    // vector normal unitario
    const nx = -(by - ay) / segLen, ny = (bx - ax) / segLen;
    // proyección → parámetro s a lo largo del tramo (en tiles)
    let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (segLen * segLen);
    t = Math.max(0, Math.min(1, t));
    const sAbs = line.cum[i - 1] + t * segLen; // distancia acumulada global
    const wobble = Math.sin(sAbs * 0.045 + seedNum) * 5 + Math.sin(sAbs * 0.013 + seedNum * 2) * 8;
    const sax = ax + (bx - ax) * t + nx * wobble;
    const say = ay + (by - ay) * t + ny * wobble;
    const d = Math.hypot(x - sax, y - say);
    if (d < best) best = d;
  }
  return best;
}

function pointInPolygon(x: number, y: number, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── rejilla de baldosas de proximidad (optimización O(1) amortizado) ─────────
// sampleGeo crudo recorría TODOS los rasgos por tile (~60 segmentos de ríos
// con serpenteo → ~13 µs c/u). Precomputamos una malla donde cada celda sabe
// qué rasgos pueden tocarla (bbox + margen); la consulta solo evalúa esos.
const TILE = 24;
const GTW = Math.ceil(1000 / TILE), GTH = Math.ceil(1000 / TILE);

type GeoCand =
  | { t: 'mar' }
  | { t: 'rio'; def: RiverDef; line: Polyline; seedNum: number }
  | { t: 'canal' }
  | { t: 'lago'; def: LakeDef; center: Point }
  | { t: 'peak'; def: MountainPeakDef; center: Point }
  | { t: 'range'; def: RangeDef; line: Polyline }
  | { t: 'desert'; def: DesertDef; center: Point };

const candGrid: GeoCand[][] = Array.from({ length: GTW * GTH }, () => []);

function markBox(c: GeoCand, minX: number, maxX: number, minY: number, maxY: number): void {
  const gx0 = Math.max(0, Math.floor(minX / TILE)), gx1 = Math.min(GTW - 1, Math.floor(maxX / TILE));
  const gy0 = Math.max(0, Math.floor(minY / TILE)), gy1 = Math.min(GTH - 1, Math.floor(maxY / TILE));
  for (let gy = gy0; gy <= gy1; gy++)
    for (let gx = gx0; gx <= gx1; gx++) candGrid[gy * GTW + gx].push(c);
}

function polylineBBox(line: Polyline): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of line.pts) {
    if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
  }
  return [x0, x1, y0, y1];
}

function buildCandGrid(): void {
  // Mar: su bbox en el mapa (el test exacto sigue siendo pointInPolygon)
  {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of SEA_POLY_MAP) {
      if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
    }
    markBox({ t: 'mar' }, x0, x1, y0, y1);
  }
  for (const { def, line } of RIVER_PATHS) {
    const [x0, x1, y0, y1] = polylineBBox(line);
    markBox({ t: 'rio', def, line, seedNum: (stringToHash(def.id) % 1000) / 97.3 },
      x0 - 20, x1 + 20, y0 - 20, y1 + 20); // margen: serpenteo (±13) + ribera (+2)
  }
  {
    const [x0, x1, y0, y1] = polylineBBox(CANAL_LINE);
    markBox({ t: 'canal' }, x0 - 4, x1 + 4, y0 - 4, y1 + 4);
  }
  for (const { def, center } of LAKES_MAP)
    markBox({ t: 'lago', def, center }, center.x - def.rxTiles, center.x + def.rxTiles, center.y - def.ryTiles, center.y + def.ryTiles);
  for (const { def, center } of PEAKS_MAP)
    markBox({ t: 'peak', def, center }, center.x - def.radiusTiles, center.x + def.radiusTiles, center.y - def.radiusTiles, center.y + def.radiusTiles);
  for (const { def, line } of RANGE_LINES) {
    const [x0, x1, y0, y1] = polylineBBox(line);
    markBox({ t: 'range', def, line }, x0 - def.thicknessTiles, x1 + def.thicknessTiles, y0 - def.thicknessTiles, y1 + def.thicknessTiles);
  }
  for (const { def, center } of DESERTS_MAP)
    markBox({ t: 'desert', def, center }, center.x - def.rxTiles, center.x + def.rxTiles, center.y - def.ryTiles, center.y + def.ryTiles);
}
buildCandGrid();

// ── API pública ──────────────────────────────────────────────────────────────

export type GeoFeatureKind =
  | 'mar' | 'rio' | 'canal' | 'lago'
  | 'montania_alta' | 'montania_media' | 'estribacion'
  | 'desierto' | 'ribera';

export interface GeoSample {
  kind: GeoFeatureKind | null;   // rasgo dominante del tile (null = tierra libre)
  riverId?: string;              // si es agua fluvial, qué río
  navigable?: boolean;           // tramo navegable (barcas/pesca)
  heightLevel?: 1 | 2 | 3;       // elevación montañosa
  desertId?: string;
  lakeId?: string;
}

/**
 * Muestra todos los rasgos geográficos reales para un tile del mapa.
 * Coste: O(#ríos × #tramos) ≈ ~60 ops — despreciable frente a render.
 */
export function sampleGeo(x: number, y: number): GeoSample {
  // Fast-path por rejilla de proximidad: si la celda no tiene ningún rasgo
  // cerca (bbox + margen), es tierra libre sin evaluar geometría.
  if (x < 0 || y < 0 || x >= 1000 || y >= 1000) return { kind: null };
  const cands = candGrid[Math.floor(y / TILE) * GTW + Math.floor(x / TILE)];
  if (cands.length === 0) return { kind: null };
  let hasDesert = false;

  for (const c of cands) {
    switch (c.t) {
      // 1. Mar (polígono este/sureste)
      case 'mar':
        if (pointInPolygon(x, y, SEA_POLY_MAP)) return { kind: 'mar' };
        break;

      // 2. Ríos (con serpenteo determinista por río)
      case 'rio': {
        const d = distToRiver(x, y, c.line, c.seedNum);
        // ancho crece hacia la desembocadura (estuario más ancho)
        const taper = 0.7 + 0.6 * (d >= 0 ? progressAlong(c.line, x, y) : 0); // 0 cabecera → 1 boca
        const halfW = (c.def.width / 2) * taper;
        if (d <= halfW) {
          const prog = progressAlong(c.line, x, y);
          const distFromMouthTiles = (1 - prog) * c.line.totalLen;
          return {
            kind: 'rio',
            riverId: c.def.id,
            navigable: !!c.def.navigableFromMouth && distFromMouthTiles <= c.def.navigableFromMouth,
          };
        }
        if (d <= halfW + 2) return { kind: 'ribera', riverId: c.def.id }; // franja de arena/húmeda
        break;
      }

      // 3. Gran Canal (recto, estrecho)
      case 'canal':
        if (distPlainPolyline(x, y, CANAL_LINE) <= 3) return { kind: 'canal', navigable: true };
        break;

      // 4. Lagos (elipses)
      case 'lago': {
        const ex = (x - c.center.x) / c.def.rxTiles;
        const ey = (y - c.center.y) / c.def.ryTiles;
        if (ex * ex + ey * ey <= 1) return { kind: 'lago', lakeId: c.def.id };
        break;
      }

      // 5/6. Montañas: se evalúan al final para respetar la precedencia original
      case 'peak':
      case 'range':
        break;

      // 7. Desiertos (elipses) — solo si no hay montaña (precedencia original)
      case 'desert': {
        const ex = (x - c.center.x) / c.def.rxTiles;
        const ey = (y - c.center.y) / c.def.ryTiles;
        if (ex * ex + ey * ey <= 1) { hasDesert = true; }
        break;
      }
    }
  }

  // Picos montañosos (círculos con anillos de altura)
  let bestMountain: GeoSample | null = null;
  for (const c of cands) {
    if (c.t !== 'peak') continue;
    const d = Math.hypot(x - c.center.x, y - c.center.y);
    if (d <= c.def.radiusTiles) {
      const ratio = d / c.def.radiusTiles; // 0 centro → 1 borde
      const level: 1 | 2 | 3 =
        c.def.heightLevel === 3 ? (ratio < 0.45 ? 3 : ratio < 0.75 ? 2 : 1)
        : c.def.heightLevel === 2 ? (ratio < 0.55 ? 2 : 1)
        : 1;
      const kind: GeoFeatureKind = level === 3 ? 'montania_alta' : level === 2 ? 'montania_media' : 'estribacion';
      if (!bestMountain || level > (bestMountain.heightLevel ?? 0)) {
        bestMountain = { kind, heightLevel: level };
      }
    }
  }

  // Cordilleras lineales
  for (const c of cands) {
    if (c.t !== 'range') continue;
    const d = distPlainPolyline(x, y, c.line);
    if (d <= c.def.thicknessTiles / 2) {
      const half = c.def.thicknessTiles / 2;
      const ratio = d / half;
      const level: 1 | 2 | 3 =
        c.def.heightLevel === 3 ? (ratio < 0.4 ? 3 : ratio < 0.7 ? 2 : 1)
        : c.def.heightLevel === 2 ? (ratio < 0.5 ? 2 : 1)
        : 1;
      const kind: GeoFeatureKind = level === 3 ? 'montania_alta' : level === 2 ? 'montania_media' : 'estribacion';
      if (!bestMountain || level > (bestMountain.heightLevel ?? 0)) {
        bestMountain = { kind, heightLevel: level };
      }
    }
  }
  if (bestMountain) return bestMountain;

  if (hasDesert) return { kind: 'desierto' };
  return { kind: null };
}

function distPlainPolyline(x: number, y: number, line: Polyline): number {
  let best = Infinity;
  const { pts } = line;
  for (let i = 1; i < pts.length; i++) {
    const d = distToSegment(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    if (d < best) best = d;
  }
  return best;
}

/** Progreso 0..1 a lo largo de la polilínea más cercano al punto. */
function progressAlong(line: Polyline, x: number, y: number): number {
  let bestD = Infinity, bestS = 0;
  const { pts } = line;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1].x, ay = pts[i - 1].y, bx = pts[i].x, by = pts[i].y;
    const segLen = Math.hypot(bx - ax, by - ay);
    if (segLen < 1) continue;
    let t = ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / (segLen * segLen);
    t = Math.max(0, Math.min(1, t));
    const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) { bestD = d; bestS = line.cum[i - 1] + t * segLen; }
  }
  return line.totalLen > 0 ? bestS / line.totalLen : 0;
}

// ── Bioma "natural" derivado de la geografía (sin semilla de provincia) ─────
// Útil como capa base: el generador de chunk combina esto con el bioma de la
// provincia para decidir vegetación/densidad. Ej: una provincia Bosque que cae
// sobre Taklamakan muestra dunas igualmente (la geografía gana en rasgos duros).

export type NaturalBiome = 'Agua' | 'Nieve' | 'Montaña' | 'Desierto' | 'Pantano' | 'Costa' | 'Estepa' | 'Bosque';

export function naturalBiomeAt(x: number, y: number): NaturalBiome {
  const g = sampleGeo(x, y);
  switch (g.kind) {
    case 'mar': case 'rio': case 'canal': case 'lago': return 'Agua';
    case 'ribera': return 'Pantano'; // llanura aluvial fértil/húmeda
    case 'montania_alta': return 'Nieve';
    case 'montania_media': case 'estribacion': return 'Montaña';
    case 'desierto': return 'Desierto';
    default: {
      // tierra libre: decidir por latitud aproximada + ruido determinista suave
      const lat = mapLat(y);
      if (lat > 43) return 'Bosque';            // Manchuria/Norte: taiga
      if (lat < 24) return 'Bosque';            // Sur tropical
      const n = hashNoise(x, y);
      return n > 0.5 ? 'Estepa' : 'Bosque';     // mosaico central
    }
  }
}

function hashNoise(x: number, y: number): number {
  const rng = mulberry32(stringToHash(`nb_${Math.floor(x / 8)}_${Math.floor(y / 8)}`));
  return rng();
}

/** ¿Es este tile impenetrable? (agua profunda, cumbre alta, mar) */
export function isImpassableGeo(g: GeoSample): boolean {
  return g.kind === 'mar' || g.kind === 'montania_alta' ||
    (g.kind === 'rio') || g.kind === 'lago';
}

/** ¿Es un buen solar para construir/asentarse? (tierra firme, no escarpada) */
export function isBuildableGeo(g: GeoSample): boolean {
  if (isImpassableGeo(g)) return false;
  if (g.kind === 'montania_media') return false; // laderas: sin solares
  return true; // tierra libre, riberas, estribaciones, desierto (oasis), canal-ribera
}

// ── Desplazamiento seguro de capitales / spawns ──────────────────────────────
// Algunas capitales históricas caen exactamente sobre el tramo de un río
// (ciudades fluviales legítimas: Nanjing en el Yangtsé, Nanning en el Zhu
// Jiang, Yinchuan en el oasis del Amarillo). Para spawn/asentamientos
// buscamos el tile transitable más cercano con una BFS determinista.

interface SafeOffset { dx: number; dy: number; distTiles: number }

const safeOffsetCache = new Map<string, SafeOffset>();

/**
 * Devuelve el offset (en tiles) desde (x,y) hasta el solar construible más
 * cercano, buscando en anillos concéntricos (BFS por capas). Determinista:
 * el orden de vecinos es fijo, así el resultado siempre es el mismo.
 * Clave opcional para cachear por punto (p. ej. id de provincia).
 */
export function findSafeOffset(x: number, y: number, maxRadius = 12, cacheKey?: string): SafeOffset {
  const key = cacheKey ?? `${Math.floor(x)}_${Math.floor(y)}`;
  const cached = safeOffsetCache.get(key);
  if (cached) return cached;

  const ix = Math.round(x), iy = Math.round(y);
  const found = bfsFirstBuildable(ix, iy, maxRadius);
  const off: SafeOffset = found
    ? { dx: found[0] - ix, dy: found[1] - iy, distTiles: Math.hypot(found[0] - x, found[1] - y) }
    : { dx: 0, dy: 0, distTiles: 0 }; // sin solar cercano: mantener original (spawn gestionará colisión)
  safeOffsetCache.set(key, off);
  return off;
}

/** Primer tile construible encontrando en BFS desde (sx,sy), o null.
 *  Usa el CACHE (no sampleGeo crudo): la BFS puede visitar ~500 tiles y
 *  cada uno solo se muestrea una vez de por vida. */
function bfsFirstBuildable(sx: number, sy: number, maxRadius: number): [number, number] | null {
  if (isBuildableGeo(sampleGeoCached(sx, sy))) return [sx, sy];
  const visited = new Set<number>();
  // cola por anillos (anillo r = todos los Chebyshev-distancia r)
  for (let ring = 1; ring <= maxRadius; ring++) {
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue; // solo el borde del anillo
        const nx = sx + dx, ny = sy + dy;
        const code = (nx + 4096) * 8192 + (ny + 4096);
        if (visited.has(code)) continue;
        visited.add(code);
        if (isBuildableGeo(sampleGeoCached(nx, ny))) return [nx, ny];
      }
    }
  }
  return null;
}
