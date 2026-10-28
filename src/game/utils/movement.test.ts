import { describe, expect, it } from 'vitest';
import { evaluateUnstick, MAX_UNSTICK_DISTANCE_TILES, TileProbe } from './movement';

function probe(overrides: Partial<TileProbe> = {}): TileProbe {
  return {
    isBlocked: () => false,
    isMountain: () => false,
    ...overrides,
  };
}

describe('evaluateUnstick', () => {
  it('permite un fallback corto sobre terreno libre', () => {
    const result = evaluateUnstick({ x: 10, y: 10 }, { x: 13, y: 14 }, probe());
    expect(result.allowed).toBe(true);
    expect(result.distanceTiles).toBeCloseTo(5);
  });

  it('permite movimiento diagonal (sin bloqueo de esquinas)', () => {
    const result = evaluateUnstick({ x: 0, y: 0 }, { x: 1, y: 1 }, probe());
    expect(result.allowed).toBe(true);
  });

  it(`respeta el límite exacto de ${MAX_UNSTICK_DISTANCE_TILES} tiles`, () => {
    const ok = evaluateUnstick({ x: 0, y: 0 }, { x: 12, y: 0 }, probe());
    expect(ok.allowed).toBe(true);

    const tooFar = evaluateUnstick({ x: 0, y: 0 }, { x: 13, y: 0 }, probe());
    expect(tooFar).toMatchObject({ allowed: false, reason: 'too-far' });
  });

  it('rechaza un destino con obstáculo físico', () => {
    const result = evaluateUnstick(
      { x: 5, y: 5 },
      { x: 8, y: 5 },
      probe({ isBlocked: (x, y) => x === 8 && y === 5 })
    );
    expect(result).toMatchObject({ allowed: false, reason: 'target-blocked' });
  });

  it('rechaza la ruta que cruza una montaña', () => {
    const result = evaluateUnstick(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      probe({ isMountain: (x, y) => x === 5 && y === 0 })
    );
    expect(result).toMatchObject({ allowed: false, reason: 'mountain-in-path' });
  });

  it('rechaza un destino sobre montaña aunque no haya obstáculo cargado', () => {
    const result = evaluateUnstick(
      { x: 0, y: 0 },
      { x: 3, y: 3 },
      probe({ isMountain: (x, y) => x === 3 && y === 3 })
    );
    expect(result).toMatchObject({ allowed: false, reason: 'mountain-in-path' });
  });
});
