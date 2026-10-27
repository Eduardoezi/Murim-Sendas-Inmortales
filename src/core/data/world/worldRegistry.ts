// src/core/data/world/worldRegistry.ts
// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO ÚNICO DE PUNTOS DE INTERÉS DEL REINO (fuente de verdad).
// Antes: los asentamientos se generaban proceduralmente en ChunkManager y las
// capitales/sectas vivían en geoPois por separado → dos mundos inconectados.
// Ahora: UN solo listado determinista (seed WORLD_SEED) que consumen:
//   - ChunkManager  → renderiza el puesto en el tile exacto al entrar en rango
//   - MinimapSystem → icono amarillo + etiqueta
//   - WorldScene    → dispara ui:open-modal con el GeoPoi REAL al llegar
//   - AdminPage     → modal con nombre, provincia, lore y distancia reales
// Nada de esto está hardcodeado en la UI: todo deriva de geoChina/provinces.
// ─────────────────────────────────────────────────────────────────────────────
import { getWorldPois, GeoPoi } from './geoPois';
import { getRawProvince } from './seeds/provinces';
import { mulberry32, stringToHash } from '../../utils/prng';
import { WORLD_SEED } from './seeds/worldSeed';
const SEED_KEY = WORLD_SEED.rootHash;
import type { Point } from './types';

export interface WorldOutpost {
  id: string;
  name: string;
  kind: GeoPoi['kind'];
  /** Tile ABSOLUTO del mapa 1000x1000 donde se planta el puesto. */
  pos: Point;
  provinceId: string;
  /** Nombre real de la provincia (para el modal de React, sin hardcodeo). */
  provinceName: string;
  loreNote?: string;
}

/** Radio (tiles) dentro del cual se considera "llegada" a un puesto. */
export const ARRIVAL_RADIUS = 4;

let cache: WorldOutpost[] | null = null;

/**
 * Asentamientos menores deterministas: cada capital provincial obtiene 1–2
 * puestos satélite (aldea/pueblo) a 10–25 tiles, desplazados hasta terreno
 * transitable vía sampleGeoCached (mismo sistema que usó el safe-offset).
 */
function generateSatellites(capitals: GeoPoi[]): WorldOutpost[] {
  const rng = mulberry32(stringToHash(`${SEED_KEY}_satellites`));
  const out: WorldOutpost[] = [];
  const SUFFIXES = ['Superior', 'del Postero', 'de la Grulla', 'del Carretero', 'Oculto', 'de Piedra'];

  for (const cap of capitals) {
    const n = 1 + Math.floor(rng() * 2); // 1 o 2 satélites
    for (let i = 0; i < n; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 10 + Math.floor(rng() * 16);
      let x = Math.round(cap.pos.x + Math.cos(angle) * dist);
      let y = Math.round(cap.pos.y + Math.sin(angle) * dist);
      // empuje simple hacia terreno construible (barato, acotado)
      for (let tries = 0; tries < 24; tries++) {
        if (isBuildableTile(x, y)) break;
        x += Math.round(Math.cos(angle + tries) * 2);
        y += Math.round(Math.sin(angle + tries) * 2);
      }
      const suf = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
      out.push({
        id: `${cap.id}_sat_${i}`,
        name: `Aldea ${suf}`,
        kind: 'capital', // pinta como objetivo menor; el modal distingue por id
        pos: { x, y },
        provinceId: cap.provinceId,
        provinceName: getRawProvince(cap.provinceId)?.name ?? 'Tierras Sin Cartografiar',
        loreNote: `Aldea satélite de ${cap.name}: posta de carromatos y arrozales.`,
      });
    }
  }
  return out;
}

// Import tardío para evitar ciclo: geoSampler ya importa del cache, no del registry.
import { isBuildableGeo } from './generators/geoSampler';
import { sampleGeoCached } from './generators/geoTileCache';
function isBuildableTile(x: number, y: number): boolean {
  return isBuildableGeo(sampleGeoCached(x, y));
}

/** Todos los puntos de interés del reino (capitales + sectas + hitos + aldeas). Cacheado. */
export function getOutposts(): WorldOutpost[] {
  if (cache) return cache;
  const pois = getWorldPois();
  const capitals = pois.filter((p) => p.kind === 'capital');
  const majors: WorldOutpost[] = pois.map((p) => ({
    id: p.id, name: p.name, kind: p.kind, pos: p.pos, provinceId: p.provinceId,
    provinceName: getRawProvince(p.provinceId)?.name ?? 'Tierras Sin Cartografiar',
    loreNote: p.loreNote,
  }));
  cache = [...majors, ...generateSatellites(capitals)];
  return cache;
}

/** El puesto más cercano al tile dado, si está dentro de `radius`. O(#pois), barato. */
export function nearestOutpost(x: number, y: number, radius = ARRIVAL_RADIUS): WorldOutpost | null {
  let best: WorldOutpost | null = null;
  let bestD = radius * radius;
  for (const o of getOutposts()) {
    const d = (o.pos.x - x) ** 2 + (o.pos.y - y) ** 2;
    if (d <= bestD) { bestD = d; best = o; }
  }
  return best;
}

/** Distancia euclídea en tiles a un puesto (para mostrarla en el modal). */
export function distanceToOutpost(from: Point, to: Point): number {
  return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
}
