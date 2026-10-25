// src/game/events/EventBus.ts
import mitt from 'mitt';

// Definimos los eventos que pueden viajar entre React y Phaser
type GameEvents = {
  'ui:open-modal': { type: 'city' | 'sect' | 'dungeon' };
  'game:player-moved': { x: number; y: number };
  'game:pause': void;
  'game:resume': void;
};

export const EventBus = mitt<GameEvents>();