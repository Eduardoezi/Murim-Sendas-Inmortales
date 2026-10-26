// src/game/config/minimapConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuración del minimapa (única fuente de ajuste). Cambia aquí, no en el
// sistema: zoom/radio, forma, cadencia de refresco y colores de los iconos.
// ─────────────────────────────────────────────────────────────────────────────

export type MinimapShape = 'circle' | 'square';

export interface MinimapConfig {
  /** Diámetro del minimapa en píxeles de pantalla (esquina inferior derecha). */
  sizePx: number;
  /** Radio de visión en TILES del mundo por cada lado (la "escala/zoom").
   *  Ajustable en caliente con la rueda sobre el minimapa o las teclas +/-. */
  viewRadiusTiles: number;
  viewRadiusMinTiles: number;
  viewRadiusMaxTiles: number;
  shape: MinimapShape;
  /** Cadencia del radar (ms). El render NO depende de esto: es suave por frame. */
  scanIntervalMs: number;
  marginPx: number; // separación del borde de la pantalla
  colors: {
    border: number;
    background: number;
    player: number;
    enemy: number;        // puntos rojos (fauna hostil)
    objective: number;    // puntos amarillos (POIs / objetivos)
    waypoint: number;     // destino de click-to-move activo
    water: number;
    mountain: number;
    desert: number;
    road: number;         // Gran Canal / rutas
    viewport: number;     // rectángulo de cámara visible
  };
}

export const MINIMAP_DEFAULTS: MinimapConfig = {
  sizePx: 180,
  viewRadiusTiles: 64,      // ±64 tiles visibles en el radar
  viewRadiusMinTiles: 24,
  viewRadiusMaxTiles: 150,
  shape: 'circle',
  scanIntervalMs: 100,      // 10 Hz: barato y suficiente para un RPG isométrico
  marginPx: 16,
  colors: {
    border: 0xd4a94e,       // oro imperial
    background: 0x0b1120,
    player: 0xf8fafc,
    enemy: 0xef4444,
    objective: 0xfacc15,
    waypoint: 0x38bdf8,
    water: 0x1d4ed8,
    mountain: 0x475569,
    desert: 0xca8a04,
    road: 0xa16207,
    viewport: 0x94a3b8,
  },
};
