import './geoSampler';
import { describe, expect, it } from 'vitest';
import {
  INSTANCE_CHUNK,
  InstancePoi,
  getInstanceInChunk,
} from './instanceGenerator';
import { sampleGeoCached } from './geoTileCache';

const CHUNKS = { x0: 26, y0: 26, w: 20, h: 20 };

function collectInstances(): InstancePoi[] {
  const out: InstancePoi[] = [];
  for (let cy = CHUNKS.y0; cy < CHUNKS.y0 + CHUNKS.h; cy++) {
    for (let cx = CHUNKS.x0; cx < CHUNKS.x0 + CHUNKS.w; cx++) {
      const poi = getInstanceInChunk(cx, cy);
      if (poi) out.push(poi);
    }
  }
  return out;
}

describe('instanceGenerator', () => {
  const pois = collectInstances();

  it('reparte entradas por la región sin saturarla', () => {
    expect(pois.length).toBeGreaterThan(5);
    expect(pois.length).toBeLessThan(CHUNKS.w * CHUNKS.h);
  });

  it('usa ids únicos y coordenadas enteras dentro de su chunk', () => {
    expect(new Set(pois.map((p) => p.id)).size).toBe(pois.length);
    for (const poi of pois) {
      expect(Number.isInteger(poi.x)).toBe(true);
      expect(Number.isInteger(poi.y)).toBe(true);
      expect(poi.x).toBeGreaterThanOrEqual(Math.floor(poi.x / INSTANCE_CHUNK) * INSTANCE_CHUNK);
      expect(poi.x).toBeLessThan((Math.floor(poi.x / INSTANCE_CHUNK) + 1) * INSTANCE_CHUNK);
      expect(poi.y).toBeGreaterThanOrEqual(Math.floor(poi.y / INSTANCE_CHUNK) * INSTANCE_CHUNK);
      expect(poi.y).toBeLessThan((Math.floor(poi.y / INSTANCE_CHUNK) + 1) * INSTANCE_CHUNK);
      expect(poi.name.length).toBeGreaterThan(0);
    }
  });

  it('nunca coloca una entrada sobre agua o montaña', () => {
    for (const poi of pois) {
      const kind = sampleGeoCached(poi.x, poi.y).kind;
      expect(kind === null || kind === 'desierto' || kind === 'ribera').toBe(true);
    }
  });

  it('cuevas y minas quedan a menos de 2 tiles de una montaña', () => {
    const mountainKinds = ['montania_alta', 'montania_media', 'estribacion'];
    for (const poi of pois) {
      if (poi.kind === 'ruinas') continue;
      let found = false;
      for (let dy = -2; dy <= 2 && !found; dy++) {
        for (let dx = -2; dx <= 2 && !found; dx++) {
          if (dx === 0 && dy === 0) continue;
          found = mountainKinds.includes(sampleGeoCached(poi.x + dx, poi.y + dy).kind ?? '');
        }
      }
      expect(found).toBe(true);
    }
  });

  it('es estable entre llamadas repetidas', () => {
    for (const poi of pois.slice(0, 12)) {
      const again = getInstanceInChunk(Math.floor(poi.x / INSTANCE_CHUNK), Math.floor(poi.y / INSTANCE_CHUNK));
      expect(again).toEqual(poi);
    }
  });
});
