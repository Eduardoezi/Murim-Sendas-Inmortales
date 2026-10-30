import './geoSampler';
import { describe, expect, it } from 'vitest';
import { getElevationAt, getTileTypeAt } from './terrainGenerator';
import { sampleGeoCached } from './geoTileCache';

const MOUNTAIN_KINDS = new Set(['montania_alta', 'montania_media', 'estribacion']);

describe('elevación del terreno', () => {
  it('el suelo base (llanura, desierto, agua) está a nivel 0', () => {
    expect(getElevationAt(583, 581)).toBe(0);
    expect(getElevationAt(725, 506)).toBe(0);
  });

  it('coincide con heightLevel del muestreador geográfico en toda la región', () => {
    for (let y = 560; y <= 620; y++) {
      for (let x = 550; x <= 620; x++) {
        const sample = sampleGeoCached(x, y);
        const expected = sample.heightLevel ?? 0;
        expect(getElevationAt(x, y)).toBe(expected);

        if (MOUNTAIN_KINDS.has(sample.kind ?? '')) {
          expect(expected).toBeGreaterThanOrEqual(1);
          expect(expected).toBeLessThanOrEqual(3);
        } else {
          expect(expected).toBe(0);
        }
      }
    }
  });

  it('los tiles de montaña se clasifican en estribación, media y pico', () => {
    const kinds = new Map<number, string>();
    for (let y = 540; y <= 640; y++) {
      for (let x = 540; x <= 640; x++) {
        const elevation = getElevationAt(x, y);
        if (elevation > 0 && !kinds.has(elevation)) kinds.set(elevation, getTileTypeAt(x, y));
      }
    }
    for (const [elevation, tileType] of kinds) {
      expect(elevation).toBeGreaterThanOrEqual(1);
      expect(elevation).toBeLessThanOrEqual(3);
      expect(['montana', 'nieve']).toContain(tileType);
    }
  });

  it('nunca produce elevaciones fuera de 0..3 en un radio grande', () => {
    for (let y = 500; y <= 700; y += 3) {
      for (let x = 500; x <= 700; x += 3) {
        const elevation = getElevationAt(x, y);
        expect(Number.isInteger(elevation)).toBe(true);
        expect(elevation).toBeGreaterThanOrEqual(0);
        expect(elevation).toBeLessThanOrEqual(3);
      }
    }
  });
});
