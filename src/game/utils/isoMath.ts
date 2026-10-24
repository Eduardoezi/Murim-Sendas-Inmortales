// src/game/utils/isoMath.ts
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Convierte de coordenadas de mapa (0,1,2...) a píxeles en pantalla
export const mapToScreen = (mapX: number, mapY: number) => {
  return {
    x: (mapX - mapY) * (TILE_WIDTH / 2),
    y: (mapX + mapY) * (TILE_HEIGHT / 2)
  };
};

// Convierte de píxeles en pantalla a coordenadas del mapa (para los clics)
export const screenToMap = (screenX: number, screenY: number) => {
  return {
    x: Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
    y: Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2)
  };
};