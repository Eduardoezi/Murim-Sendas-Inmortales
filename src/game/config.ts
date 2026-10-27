// src/game/config.ts
import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';


export const WORLD_SCALE = 1.0; // Ajusta este valor para toda la entidad del juego
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
    arcade: { debug: false }
  },
  backgroundColor: '#05070c', // Fondo oscuro igual al de React
});