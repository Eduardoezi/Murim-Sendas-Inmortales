// src/game/config/minimapConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuración del minimapa (única fuente de ajuste). Cambia aquí, no en el
// sistema: zoom/radio, forma, cadencia de refresco y colores de los iconos.
// ─────────────────────────────────────────────────────────────────────────────

export type MinimapShape = 'circle' | 'square' | 'diamond';

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
  shape: 'diamond',
  scanIntervalMs: 100,      // 10 Hz: barato y suficiente para un RPG isométrico
  marginPx: 16,
  colors: {
    border: 0xb08d43,       // oro envejecido
    background: 0x05070a,
    player: 0xe8e2d2,
    enemy: 0xb3453f,
    objective: 0xc9a34a,
    waypoint: 0x6f93a8,
    water: 0x1c3340,
    mountain: 0x3d3c3a,
    desert: 0x5a4a33,
    road: 0x544a37,
    viewport: 0x6d6a5e,
  },
};
