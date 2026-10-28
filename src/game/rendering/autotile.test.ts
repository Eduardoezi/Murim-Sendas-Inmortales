import { describe, expect, it } from 'vitest';
import { maskFromSides, masksByNeighborType, sidesInMask } from './autotile';

describe('masksByNeighborType', () => {
  it('devuelve máscara vacía si todos los vecinos comparten el tipo central', () => {
    const masks = masksByNeighborType('hierba', {
      n: 'hierba', e: 'hierba', s: 'hierba', w: 'hierba',
    });
    expect(masks.size).toBe(0);
  });

  it('agrupa vecinos del mismo tipo en una sola máscara de 4 bits', () => {
    const masks = masksByNeighborType('hierba', {
      n: 'arena', e: 'arena', s: 'hierba', w: 'agua',
    });
    expect(masks.get('arena')).toBe(1 | 2);
    expect(masks.get('agua')).toBe(8);
    expect(masks.size).toBe(2);
  });

  it('ignora lados sin vecino', () => {
    const masks = masksByNeighborType('arena', { n: undefined, e: 'hierba' });
    expect(masks.get('hierba')).toBe(2);
  });
});

describe('sidesInMask / maskFromSides', () => {
  it('hace round-trip de cualquier combinación de 4 bits', () => {
    for (let mask = 0; mask < 16; mask++) {
      expect(maskFromSides(sidesInMask(mask))).toBe(mask);
    }
  });

  it('mapea los bits documentados', () => {
    expect(maskFromSides(['n'])).toBe(1);
    expect(maskFromSides(['e'])).toBe(2);
    expect(maskFromSides(['s'])).toBe(4);
    expect(maskFromSides(['w'])).toBe(8);
  });
});
