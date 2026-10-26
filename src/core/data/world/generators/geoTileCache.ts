// src/core/data/world/generators/geoTileCache.ts
// ─────────────────────────────────────────────────────────────────────────────
// CACHE DE TERRENO GLOBAL (fix de rendimiento).
//
// Diagnóstico: sampleGeo() cuesta ~10-12 µs por tile porque cada consulta
// recorre TODOS los rasgos geográficos (polígono del mar, 7 ríos con
// serpenteo senoidal + proyecciones sobre ~60 segmentos, cordilleras, picos,
// lagos y desiertos). Con eso:
//   - La carga inicial de 25 chunks (25×256 tiles × ~10 muestras c/u)
//     bloqueaba el hilo principal ~6 s → el juego "se queda lagueado".
//   - El minimapa pintaba su lienzo-mundo (1M tiles) en franjas de 125 filas:
//     ~1.5 s POR FRANJA dentro del game loop → congelación total al iniciar
//     (por eso el minimapa nunca llegaba a verse).
//
// Solución: muestrear cada tile UNA sola vez y servirlo desde un Uint8Array
// (1 byte por tile, 1 MB para 1000×1000). Dos API:
//   - sampleGeoCached(): sincróna (BFS safe-offset, click-to-move). Ante una
//     "miss" cara (tierra libre = sin rasgo) la pospone a la cola frame-safe
//     y devuelve tierra libre provisional; se corrige en cuanto se resuelve.
//   - getBiomeCached(): para render por lotes (ChunkManager/minimapa), que
//     ya procesan franjas incrementales y solo leen resultados cacheados.
// La determinidad se preserva: el valor cacheado es exactamente lo que
// devolvería sampleGeo(x, y) — solo cambia CUÁNDO se calcula.
// ─────────────────────────────────────────────────────────────────────────────

import { WORLD_SEED } from '../seeds/worldSeed';
import { GeoSample, NaturalBiome } from './geoSampler';

// sampleGeo se inyecta desde geoSampler al cargarse (evita el ciclo de imports
// cache↔sampler: aquí solo se importan TIPOS y la caché provee las funciones).
type SampleFn = (x: number, y: number) => GeoSample;
let _sampleGeo: SampleFn | null = null;
export function __bindSampleGeo(fn: SampleFn): void { _sampleGeo = fn; }
function sampleGeo(x: number, y: number): GeoSample {
  if (!_sampleGeo) throw new Error('geoTileCache: sampleGeo no enlazado');
  return _sampleGeo(x, y);
}

const GW = WORLD_SEED.gridSize.width;
const GH = WORLD_SEED.gridSize.height;

// ── codificación en 1 byte ───────────────────────────────────────────────────
// bits 0-3: GeoFeatureKind (NONE=0 … RIBERA=9) | bit 4: navigable
// bits 5-6: heightLevel (0..3)                 | bit 7: válido (resuelto)
type Code = number;
const K_NONE = 0, K_MAR = 1, K_RIO = 2, K_CANAL = 3, K_LAGO = 4,
  K_ALTA = 5, K_MEDIA = 6, K_ESTRIB = 7, K_DESIERTO = 8, K_RIBERA = 9;
const VALID_BIT = 0x80;

function encode(g: GeoSample): Code {
  let k = K_NONE;
  switch (g.kind) {
    case 'mar': k = K_MAR; break;
    case 'rio': k = K_RIO; break;
    case 'canal': k = K_CANAL; break;
    case 'lago': k = K_LAGO; break;
    case 'montania_alta': k = K_ALTA; break;
    case 'montania_media': k = K_MEDIA; break;
    case 'estribacion': k = K_ESTRIB; break;
    case 'desierto': k = K_DESIERTO; break;
    case 'ribera': k = K_RIBERA; break;
    default: k = K_NONE;
  }
  let c = k;
  if (g.navigable) c |= 0x10;
  c |= ((g.heightLevel ?? 0) & 3) << 5;
  return c | VALID_BIT;
}

function decode(c: Code): GeoSample {
  const k = c & 0x0f;
  const nav = (c & 0x10) !== 0;
  const lvl = ((c >> 5) & 3) as 0 | 1 | 2 | 3;
  switch (k) {
    case K_MAR: return { kind: 'mar' };
    case K_RIO: return { kind: 'rio', navigable: nav };
    case K_CANAL: return { kind: 'canal', navigable: true };
    case K_LAGO: return { kind: 'lago' };
    case K_ALTA: return { kind: 'montania_alta', heightLevel: 3 };
    case K_MEDIA: return { kind: 'montania_media', heightLevel: Math.max(2, lvl) as 2 | 3 };
    case K_ESTRIB: return { kind: 'estribacion', heightLevel: (lvl || 1) as 1 | 2 | 3 };
    case K_DESIERTO: return { kind: 'desierto' };
    case K_RIBERA: return { kind: 'ribera' };
    default: return { kind: null };
  }
}

const BIOMES: NaturalBiome[] = ['Agua', 'Nieve', 'Montaña', 'Desierto', 'Pantano', 'Costa', 'Estepa', 'Bosque'];
function biomeCode(b: NaturalBiome): number {
  const i = BIOMES.indexOf(b);
  return i < 0 ? 7 : i; // default Estepa(6)? usar Bosque como fallback seguro
}
function biomeFromCode(c: number): NaturalBiome {
  return BIOMES[c & 7] ?? 'Estepa';
}

// ── almacenamiento ───────────────────────────────────────────────────────────
const geoBytes = new Uint8Array(GW * GH);        // 0 = nunca tocado
const biomeBytes = new Uint8Array(GW * GH);      // bit7 = válido
const pendingGeo = new Set<number>();            // índices esperando resolución cara
let budgetUs = 2500;                             // µs máximos de cálculo por frame

const idxOf = (x: number, y: number) => y * GW + x;
const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < GW && y < GH;

/** Muestreo sincrón con caché. Úsalo para lógica puntual (click, BFS, IA).
 *  El coste cara (~10 µs) solo se paga UNA vez por tile; el resto son lecturas
 *  O(1). Es lo que usan los flujos donde la respuesta DEBE ser correcta ya
 *  (no atravesar un río, no spawnear sobre una cumbre). */
export function sampleGeoCached(x: number, y: number): GeoSample {
  if (!inBounds(x, y)) return { kind: null };
  const i = idxOf(x, y);
  const b = geoBytes[i];
  if (b & VALID_BIT) return decode(b);
  geoBytes[i] = encode(sampleGeo(x, y));
  biomeBytes[i] = biomeCode(naturalBiomeFromGeo(decode(geoBytes[i]), x, y)) | VALID_BIT;
  pendingGeo.delete(i);
  return decode(geoBytes[i]);
}

/** Versión NO bloqueante para consultas masivas dentro del game loop
 *  (p. ej. A* con miles de heurísticas): si el tile no está resuelto,
 *  enqueuea y devuelve tierra libre provisional. */
export function sampleGeoLazy(x: number, y: number): GeoSample {
  if (!inBounds(x, y)) return { kind: null };
  const i = idxOf(x, y);
  const b = geoBytes[i];
  if (b & VALID_BIT) return decode(b);
  pendingGeo.add(i);
  return { kind: null };
}

/** Bioma natural cacheado para render por lotes. No calcula si aún no está:
 *  devuelve 'Estepa' provisional; la cola background lo corregirá y el
 *  consumidor (minimapa/chunks) repinta la zona afectada tras step(). */
export function getBiomeCached(x: number, y: number): NaturalBiome {
  if (!inBounds(x, y)) return 'Estepa';
  const i = idxOf(x, y);
  const b = biomeBytes[i];
  if (b & VALID_BIT) return biomeFromCode(b);
  // Si el geo ya fue resuelto, derivar bioma barato sin re-muestrear todo:
  const g = geoBytes[i];
  if (g & VALID_BIT) {
    const code = biomeCode(naturalBiomeFromGeo(decode(g), x, y));
    biomeBytes[i] = code | VALID_BIT;
    return biomeFromCode(code);
  }
  pendingGeo.add(i);
  return 'Estepa';
}

/** Versión de naturalBiomeAt que NO vuelve a entrar a sampleGeo: usa el
 *  GeoSample ya cacheado (el único coste extra es hashNoise, O(1)). */
function naturalBiomeFromGeo(g: GeoSample, x: number, y: number): NaturalBiome {
  switch (g.kind) {
    case 'mar': case 'rio': case 'canal': case 'lago': return 'Agua';
    case 'ribera': return 'Pantano';
    case 'montania_alta': return 'Nieve';
    case 'montania_media': case 'estribacion': return 'Montaña';
    case 'desierto': return 'Desierto';
    default: {
      // replicar la lógica de tierra libre de naturalBiomeAt
      // (latitud + hashNoise) sin llamar a sampleGeo otra vez.
      const GEO_LAT_MAX = 54, GEO_LAT_MIN = 20;
      const lat = GEO_LAT_MAX - (y / GH) * (GEO_LAT_MAX - GEO_LAT_MIN);
      if (lat > 43) return 'Bosque';
      if (lat < 24) return 'Bosque';
      return mulberryNoise(x, y) > 0.5 ? 'Estepa' : 'Bosque';
    }
  }
}

// mini-PRNG local (misma semilla que hashNoise en geoSampler: `nb_x_y` de bloque 8)
function mulberryNoise(x: number, y: number): number {
  let h = 0;
  const s = `nb_${Math.floor(x / 8)}_${Math.floor(y / 8)}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  let a = h;
  a = (a + 0x6D2B79F5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** ¿Ya tenemos respuesta definitiva para este tile? */
export function isGeoResolved(x: number, y: number): boolean {
  return inBounds(x, y) && (geoBytes[idxOf(x, y)] & VALID_BIT) !== 0;
}

// ── presupuesto por frame ────────────────────────────────────────────────────
let lastStepEnd = 0;

/** Llamar una vez por frame (desde WorldScene.update). Resuelve misses
 *  pendientes hasta agotar `budgetUs` (default 2.5 ms = ¼ de frame a 60 fps).
 *  Devuelve la cantidad de tiles resueltos (útil para debug/repintado). */
export function stepGeoBudget(): number {
  const now = performance.now();
  if (now - lastStepEnd < 16) return 0; // máx. una vez por frame
  lastStepEnd = now;
  return drainBudget(budgetUs);
}

function drainBudget(us: number): number {
  const limit = performance.now() + us / 1000;
  let n = 0;
  for (const i of Array.from(pendingGeo)) {
    if (performance.now() > limit) break;
    const x = i % GW, y = (i / GW) | 0;
    geoBytes[i] = encode(sampleGeo(x, y));
    biomeBytes[i] = biomeCode(naturalBiomeFromGeo(decode(geoBytes[i]), x, y)) | VALID_BIT;
    pendingGeo.delete(i);
    n++;
  }
  return n;
}

/** Precarga SIN límite de tiempo (solo para pantallas de carga, fuera del
 *  game loop normal). Pinta toda la ventana dada en modo "pincel": un solo
 *  recorrido secuencial, mucho más rápido que consultas dispersas. */
export function preloadGeoWindow(cx: number, cy: number, radius: number): void {
  const x0 = Math.max(0, Math.floor(cx - radius)), x1 = Math.min(GW - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius)), y1 = Math.min(GH - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = idxOf(x, y);
      if (!(geoBytes[i] & VALID_BIT)) {
        geoBytes[i] = encode(sampleGeo(x, y));
        biomeBytes[i] = biomeCode(naturalBiomeFromGeo(decode(geoBytes[i]), x, y)) | VALID_BIT;
        pendingGeo.delete(i);
      }
    }
  }
}

/** Precarga asíncrona por franjas (para el lienzo del minimapa): pinta una
 *  fila de `rowsPerSlice` por microtask, nunca bloquea >~1 frame. */
export function preloadGeoRowsAsync(
  rowsPerSlice: number,
  onRowDone?: (y0: number, y1: number) => void,
  onDone?: () => void,
): void {
  let y = 0;
  const slice = () => {
    const y1 = Math.min(GH - 1, y + rowsPerSlice - 1);
    for (let yy = y; yy <= y1; yy++) {
      for (let x = 0; x < GW; x++) {
        const i = idxOf(x, yy);
        if (!(geoBytes[i] & VALID_BIT)) {
          geoBytes[i] = encode(sampleGeo(x, yy));
          biomeBytes[i] = biomeCode(naturalBiomeFromGeo(decode(geoBytes[i]), x, yy)) | VALID_BIT;
          pendingGeo.delete(i);
        }
      }
    }
    onRowDone?.(y, y1);
    y = y1 + 1;
    if (y < GH) queueMicrotask(slice);
    else onDone?.();
  };
  slice();
}

export function setGeoBudgetMs(ms: number): void { budgetUs = ms * 1000; }

/** Estadísticas para debug (window.__geoStats si hace falta). */
export function geoCacheStats() {
  let resolved = 0;
  for (let i = 0; i < geoBytes.length; i++) if (geoBytes[i] & VALID_BIT) resolved++;
  return { resolved, total: GW * GH, pending: pendingGeo.size };
}
