import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../core/data/world/generators/geoSampler';
import { getTileTypeAt } from '../../core/data/world/generators/terrainGenerator';
import { WORLD_SEED } from '../../core/data/world/seeds/worldSeed';
import { MINIMAP_DEFAULTS } from '../config/minimapConfig';
import {
  MapDiscovery,
  TILE_MOUNTAIN,
  TILE_NORMAL,
  TILE_UNEXPLORED,
  TILE_WATER,
} from './MapDiscovery';

const GRID = WORLD_SEED.gridSize;

interface FakeContext {
  fillStyle: string;
  fills: number;
  clears: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
}

let ctx: FakeContext;

beforeAll(() => {
  ctx = {
    fillStyle: '',
    fills: 0,
    clears: 0,
    fillRect() { this.fills++; },
    clearRect() { this.clears++; },
  };
  vi.stubGlobal('document', {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
  });
});

afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
  ctx.fills = 0;
  ctx.clears = 0;
});

function revealedCount(md: MapDiscovery, cx: number, cy: number, r: number): number {
  let n = 0;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (md.isExplored(x, y)) n++;
    }
  }
  return n;
}

function expectedCircleTiles(r: number): number {
  let n = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) n++;
    }
  }
  return n;
}

describe('MapDiscovery', () => {
  it('nace con un lienzo del tamaño del grid y sin nada explorado', () => {
    const md = new MapDiscovery();
    expect(md.canvas.width).toBe(GRID.width);
    expect(md.canvas.height).toBe(GRID.height);
    expect(md.isExplored(0, 0)).toBe(false);
    expect(md.typeAt(0, 0)).toBe(TILE_UNEXPLORED);
    expect(md.discoveredInstances()).toEqual([]);
  });

  it('revela exactamente el disco configurado y no cruza el borde del grid', () => {
    const md = new MapDiscovery();
    md.update({ x: 500, y: 500 });

    const r = MINIMAP_DEFAULTS.revealRadiusTiles;
    const expected = expectedCircleTiles(r);
    expect(revealedCount(md, 500, 500, r)).toBe(expected);
    expect(ctx.fills).toBe(expected);
    expect(md.isExplored(500, 500)).toBe(true);
    expect(md.isExplored(500 + r + 1, 500)).toBe(false);
    expect(md.isExplored(500, 500 + r + 1)).toBe(false);

    // En el borde del mundo el disco se recorta, no se sale del array.
    const edge = new MapDiscovery();
    edge.update({ x: 0, y: 0 });
    expect(edge.isExplored(0, 0)).toBe(true);
    expect(edge.isExplored(-1, 0)).toBe(false);
    expect(revealedCount(edge, 0, 0, r)).toBeLessThan(expected);
  });

  it('clasifica cada tesela revelada con el mismo tipo que el generador', () => {
    const md = new MapDiscovery();
    md.update({ x: 580, y: 578 });

    const r = MINIMAP_DEFAULTS.revealRadiusTiles;
    let checked = 0;
    for (let y = 578 - r; y <= 578 + r; y++) {
      for (let x = 580 - r; x <= 580 + r; x++) {
        if (!md.isExplored(x, y)) continue;
        const type = getTileTypeAt(x, y);
        const expected = type === 'montana' ? TILE_MOUNTAIN : type === 'agua' ? TILE_WATER : TILE_NORMAL;
        expect(md.typeAt(x, y)).toBe(expected);
        checked++;
      }
    }
    expect(checked).toBe(expectedCircleTiles(r));
  });

  it('solo repinta al cruzar de tesela', () => {
    const md = new MapDiscovery();
    md.update({ x: 500, y: 500 });
    const afterFirst = ctx.fills;

    md.update({ x: 500.4, y: 500.6 });
    expect(ctx.fills).toBe(afterFirst);

    md.update({ x: 503, y: 500 });
    expect(ctx.fills).toBeGreaterThan(afterFirst);
  });

  it('asocia las instancias descubiertas al disco revelado, sin duplicados', () => {
    const md = new MapDiscovery();
    md.update({ x: 580, y: 578 });

    const r = MINIMAP_DEFAULTS.revealRadiusTiles;
    const instances = md.discoveredInstances();
    expect(Array.isArray(instances)).toBe(true);
    expect(new Set(instances.map((p) => p.id)).size).toBe(instances.length);
    for (const p of instances) {
      const dx = p.x - 580;
      const dy = p.y - 578;
      expect(dx * dx + dy * dy).toBeLessThanOrEqual(r * r);
    }
  });

  it('reset borra niebla, tipos e instancias y vuelve a revelar desde cero', () => {
    const md = new MapDiscovery();
    md.update({ x: 500, y: 500 });
    md.reset();

    expect(ctx.clears).toBe(1);
    expect(md.isExplored(500, 500)).toBe(false);
    expect(md.typeAt(500, 500)).toBe(TILE_UNEXPLORED);
    expect(md.discoveredInstances()).toEqual([]);

    const fillsAfterReset = ctx.fills;
    md.update({ x: 500, y: 500 });
    expect(ctx.fills).toBeGreaterThan(fillsAfterReset);
    expect(md.isExplored(500, 500)).toBe(true);
  });
});
