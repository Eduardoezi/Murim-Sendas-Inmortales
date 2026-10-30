// src/game/config.ts
import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import { HudScene } from './scenes/HudScene';


export const WORLD_SCALE = 1.0; // Ajusta este valor para toda la entidad del juego
export const getGameConfig = (parentElement: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: '100%',
  height: '100%',
  parent: parentElement,
  // WorldScene arranca sola; HudScene se añade pero la lanza WorldScene al
  // terminar su create, para que el minimapa nazca con el mundo ya vivo.
  scene: [WorldScene, HudScene],
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