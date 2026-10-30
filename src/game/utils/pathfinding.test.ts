import { describe, expect, it } from 'vitest';
import { findPath } from './pathfinding';

const OPEN = () => false;

/**
 * Meseta de elevación 1 en el bloque 2..4 × 2..4, valle a 0 alrededor.
 * No hay rampa: bajar de la meseta exige saltar.
 */
function plateauElevation(x: number, y: number): number {
  return x >= 2 && x <= 4 && y >= 2 && y <= 4 ? 1 : 0;
}

const plateauCanStep = (fx: number, fy: number, tx: number, ty: number) =>
  plateauElevation(tx, ty) === plateauElevation(fx, fy);

/** Pared de acantilado de ancho completo: no hay rampa por la que bajar. */
const wallElevation = (x: number, y: number) => (y <= 2 ? 1 : 0);
const wallCanStep = (fx: number, fy: number, tx: number, ty: number) =>
  wallElevation(tx, ty) === wallElevation(fx, fy);

describe('findPath con acantilados', () => {
  it('sin canStep cruza el borde recto (comportamiento previo)', () => {
    const path = findPath(1, 1, 1, 5, OPEN);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 1, y: 1 });
    expect(path[path.length - 1]).toEqual({ x: 1, y: 5 });
  });

  it('con canStep no existe ruta a través de una pared sin rampa', () => {
    const path = findPath(1, 1, 1, 5, OPEN, wallCanStep);
    expect(path).toEqual([]);
  });

  it('rodea la meseta y nunca cambia de elevación entre pasos', () => {
    const path = findPath(1, 3, 5, 3, OPEN, plateauCanStep);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 1, y: 3 });
    expect(path[path.length - 1]).toEqual({ x: 5, y: 3 });

    for (let i = 1; i < path.length; i++) {
      expect(plateauElevation(path[i].x, path[i].y)).toBe(
        plateauElevation(path[i - 1].x, path[i - 1].y),
      );
      expect(Math.abs(path[i].x - path[i - 1].x)).toBeLessThanOrEqual(1);
      expect(Math.abs(path[i].y - path[i - 1].y)).toBeLessThanOrEqual(1);
    }
    // Recto serían 4 pasos; rodear el bloque exige al menos 6.
    expect(path.length - 1).toBeGreaterThanOrEqual(6);
  });

  it('un destino bloqueado devuelve ruta vacía', () => {
    const path = findPath(1, 1, 3, 3, (x, y) => x === 3 && y === 3);
    expect(path).toEqual([]);
  });
});
