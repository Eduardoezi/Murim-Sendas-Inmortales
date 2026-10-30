// src/game/systems/HudDataSource.ts
// ─────────────────────────────────────────────────────────────────────────────
// Contrato entre el mundo y el HUD. El minimapa y el automapa viven en su
// propia escena (cámara sin follow ni zoom) y solo necesitan estas seis
// lectura/ordenes de WorldScene. Mantenerlo como interfaz evita el ciclo de
// imports escena ↔ escena.
// ─────────────────────────────────────────────────────────────────────────────

/** Rectángulo visible de la cámara, en píxeles de pantalla del mundo (iso). */
export interface WorldRectPx {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface HudDataSource {
  /** Tesela actual del personaje, en coordenadas del grid 1000×1000. */
  getPlayerTile(): { x: number; y: number };
  /** Destino del click-to-move activo, o null si el personaje está quieto. */
  getWaypoint(): { x: number; y: number } | null;
  /** Enemigos hostiles en coordenadas de grid. */
  getEnemies(): Array<{ x: number; y: number }>;
  /** Área del mundo que está mostrando la cámara principal, en px de pantalla. */
  getCameraWorldRect(): WorldRectPx;
  /** Pisabilidad real (la del A*), no la del geo: el radar no debe prometer rutas imposibles. */
  isTileWalkable(x: number, y: number): boolean;
  /** Orden de movimiento originada en el radar. */
  moveToTile(x: number, y: number): void;
}
