// src/game/utils/isoProjection.ts
// ─────────────────────────────────────────────────────────────────────────────
// Única fuente de la transformación isométrica del proyecto. El mundo la usa
// para colocar sprites y el minimapa para proyectar terreno, blips y clics, de
// modo que el radar orienta exactamente igual que la pantalla.
// ─────────────────────────────────────────────────────────────────────────────
import { TILE_HEIGHT, TILE_WIDTH } from '../rendering/tileTextures';

export const ISO_HALF_W = TILE_WIDTH / 2;
export const ISO_HALF_H = TILE_HEIGHT / 2;

/** Píxeles de pantalla del mundo por paso de tesela a lo largo de un eje. */
export const ISO_TILE_STEP_PX = Math.hypot(ISO_HALF_W, ISO_HALF_H);

/** Tesela → píxel de pantalla del mundo (origen del iso, sin cámara). */
export function isoTileToPx(mapX: number, mapY: number): { x: number; y: number } {
  return { x: (mapX - mapY) * ISO_HALF_W, y: (mapX + mapY) * ISO_HALF_H };
}

/** Píxel de pantalla del mundo → tesela (sin redondear). */
export function isoPxToTile(px: number, py: number): { x: number; y: number } {
  return {
    x: (px / ISO_HALF_W + py / ISO_HALF_H) / 2,
    y: (py / ISO_HALF_H - px / ISO_HALF_W) / 2,
  };
}
