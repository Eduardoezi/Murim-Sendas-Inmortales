import { describe, expect, it } from 'vitest';
import {
  ISO_HALF_H,
  ISO_HALF_W,
  ISO_TILE_STEP_PX,
  isoPxToTile,
  isoTileToPx,
} from './isoProjection';

describe('isoProjection', () => {
  it('hace round-trip tesela → píxel → tesela en teselas enteras', () => {
    const cases = [
      [0, 0], [1, 0], [0, 1], [-3, 7], [580, 578], [999, 0],
    ];
    for (const [x, y] of cases) {
      const px = isoTileToPx(x, y);
      const back = isoPxToTile(px.x, px.y);
      expect(back.x).toBeCloseTo(x, 6);
      expect(back.y).toBeCloseTo(y, 6);
    }
  });

  it('un paso de tesela a lo largo de un eje mide ISO_TILE_STEP_PX', () => {
    const o = isoTileToPx(100, 100);
    const pasoX = isoTileToPx(101, 100);
    expect(Math.hypot(pasoX.x - o.x, pasoX.y - o.y)).toBeCloseTo(ISO_TILE_STEP_PX, 6);
    expect(ISO_TILE_STEP_PX).toBeCloseTo(Math.hypot(ISO_HALF_W, ISO_HALF_H), 6);
  });

  // El bug histórico del radar: el clic se resolvía en espacio de grid mientras
  // el terreno se dibujaba en espacio iso, así que caía en otra tesela.
  it('traduce un punto del radar a la tesela que se ve bajo el puntero', () => {
    const radiusPx = 89;
    const viewRadiusTiles = 64;
    const z = (viewRadiusTiles * ISO_TILE_STEP_PX) / radiusPx;

    const player = { x: 580, y: 578 };
    const target = { x: player.x + 12, y: player.y + 5 };

    const pIso = isoTileToPx(player.x, player.y);
    const tIso = isoTileToPx(target.x, target.y);
    // px de radar desde el centro hacia la tesela objetivo (lo que dibuja el blip)
    const local = { x: (tIso.x - pIso.x) / z, y: (tIso.y - pIso.y) / z };
    // y lo que el clic debe reconstruir
    const back = isoPxToTile(pIso.x + local.x * z, pIso.y + local.y * z);

    expect(Math.round(back.x)).toBe(target.x);
    expect(Math.round(back.y)).toBe(target.y);
  });
});
