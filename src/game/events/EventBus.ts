// src/game/events/EventBus.ts
import mitt from 'mitt';

import type { WorldOutpost } from '../../core/data/world/worldRegistry';

// Definimos los eventos que pueden viajar entre React y Phaser
export type PoiModalData = {
  /** Puesto REAL del registry (nombre, tipo, provincia y lore de geoChina). */
  poi: WorldOutpost;
  /** Posicion actual del jugador en tiles absolutos (para distancia viva). */
  playerPos: { x: number; y: number };
  /** Distancia real en tiles desde el jugador al POI (dato vivo del mundo). */
  distanceTiles: number;
};

type GameEvents = {
  'ui:open-modal': PoiModalData;
  'game:player-moved': { x: number; y: number };
  'game:pause': void;
  'game:resume': void;
};

export const EventBus = mitt<GameEvents>();