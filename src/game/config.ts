// src/game/config.ts
import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';

export const getGameConfig = (parentElement: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: '100%',
  height: '100%',
  parent: parentElement,
  scene: [WorldScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false } // Cambia a true si quieres ver las cajas de colisión
  }
});