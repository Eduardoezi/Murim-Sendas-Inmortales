// src/game/config/minimapConfig.ts
// ─────────────────────────────────────────────────────────────────────────────
// Configuración del minimapa (única fuente de ajuste). Cambia aquí, no en el
// sistema: zoom/radio, forma, cadencia de refresco y colores de los iconos.
// Los colores del TERRENO no están aquí: los pinta MapDiscovery, para que el
// radar y el automapa de Tab sean literalmente el mismo mapa.
// ─────────────────────────────────────────────────────────────────────────────

export type MinimapShape = 'circle' | 'square' | 'diamond';

export interface MinimapConfig {
  /** Diámetro del minimapa en píxeles de pantalla (esquina inferior derecha). */
  sizePx: number;
  /** Radio de visión en TESLAS por cada lado, medido a lo largo de un eje de
   *  tesela (la diagonal del rombo iso). Es la "escala/zoom" del radar:
   *  adjustable con la rueda encima del minimapa o las teclas +/-. */
  viewRadiusTiles: number;
  viewRadiusMinTiles: number;
  viewRadiusMaxTiles: number;
  /** Salto de radio (teselas) por cada golpe de rueda. */
  wheelStepTiles: number;
  shape: MinimapShape;
  /** Radio del anillo de revelado de niebla, en teselas. Lo lee MapDiscovery:
   *  define cuánto mundo se descubre al cruzar de tesela (radar y Tab). */
  revealRadiusTiles: number;
  /** Cadencia del radar (ms). El render NO depende de esto: es suave por frame. */
  scanIntervalMs: number;
  marginPx: number; // separación del borde de la pantalla
  /** Por debajo de este ancho de tesela (px de radar) se pre-muestrea 2× antes
   *  de proyectar, para que el zoom-out no produzca ruido de aliasing. */
  lodMinStepPx: number;
  /** Desplazamiento del personaje (teselas) que dispara un re-recorte. */
  blitMoveThresholdTiles: number;
  /** Radio de detección del hover sobre POIs, en px de radar (no de mundo). */
  hoverRadiusPx: number;
  colors: {
    border: number;
    background: number;
    player: number;
    enemy: number;        // puntos rojos (fauna hostil)
    objective: number;    // puntos amarillos (POIs ya descubiertos)
    waypoint: number;     // destino de click-to-move activo
    viewport: number;     // rectángulo de cámara visible sobre el radar
  };
}

export const MINIMAP_DEFAULTS: MinimapConfig = {
  sizePx: 180,
  viewRadiusTiles: 64,      // ±64 teselas visibles en el radar
  viewRadiusMinTiles: 24,
  viewRadiusMaxTiles: 150,
  wheelStepTiles: 8,
  shape: 'circle',          // el terreno se proyecta en iso real: un marco
                            // rombo dejaría vacías las puntas norte/sur
  revealRadiusTiles: 26,
  scanIntervalMs: 100,      // 10 Hz: barato y suficiente para un RPG isométrico
  marginPx: 16,
  lodMinStepPx: 2,
  blitMoveThresholdTiles: 0.25,
  hoverRadiusPx: 9,
  colors: {
    border: 0xb08d43,       // oro envejecido
    background: 0x05070a,
    player: 0xe8e2d2,
    enemy: 0xb3453f,
    objective: 0xc9a34a,
    waypoint: 0x6f93a8,
    viewport: 0x6d6a5e,
  },
};
