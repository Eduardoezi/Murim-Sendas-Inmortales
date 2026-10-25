// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { EventBus } from '../events/EventBus';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const mapToScreen = (mapX: number, mapY: number) => ({
  x: (mapX - mapY) * (TILE_WIDTH / 2),
  y: (mapX + mapY) * (TILE_HEIGHT / 2)
});

const screenToMap = (screenX: number, screenY: number) => ({
  x: Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
  y: Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2)
});

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private gridSize = 20;
  private isMoving = false;

  constructor() {
    super({ key: 'WorldScene' });
  }

  preload() {
    // Cargamos el espadachín (asegúrate de que el path sea correcto)
    this.load.spritesheet('hero_walk', '/assets/sprites/walk.png', { frameWidth: 256, frameHeight: 280 });
    this.load.spritesheet('hero_idle', '/assets/sprites/idle.png', { frameWidth: 256, frameHeight: 280 });
    
    // Generador procedural del suelo
    const gFloor = this.make.graphics({ x: 0, y: 0 }, false);
    gFloor.fillStyle(0x1e293b, 1);
    gFloor.lineStyle(1, 0x334155, 1);
    gFloor.beginPath();
    gFloor.moveTo(32, 0); gFloor.lineTo(64, 16); gFloor.lineTo(32, 32); gFloor.lineTo(0, 16); gFloor.closePath();
    gFloor.fillPath(); gFloor.strokePath();
    gFloor.generateTexture('floor', 64, 32);
  }

  create() {
    // 1. Crear animaciones
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('hero_walk', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('hero_idle', { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1
    });

    // 2. Dibujar el Grid
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const pos = mapToScreen(x, y);
        const tile = this.add.image(pos.x, pos.y, 'floor');
        tile.setDepth(x + y);
      }
    }

    // 3. Crear al Jugador
    const startPos = mapToScreen(10, 10);
    this.player = this.physics.add.sprite(startPos.x, startPos.y, 'hero_idle');
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(0.35); // Ajuste del tamaño
    
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setSize(60, 40); 
      (this.player.body as Phaser.Physics.Arcade.Body).setOffset(98, 230); 
    }

    this.player.play('idle');

    // 4. Cámara
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 5. Interacción (Click-to-move)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isMoving) return;
      
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const mapCoords = screenToMap(worldPoint.x, worldPoint.y);

      if (mapCoords.x >= 0 && mapCoords.x < this.gridSize && mapCoords.y >= 0 && mapCoords.y < this.gridSize) {
        const targetPos = mapToScreen(mapCoords.x, mapCoords.y);
        
        this.isMoving = true;
        this.player.play('walk');

        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetPos.x, targetPos.y);
        
        this.tweens.add({
          targets: this.player,
          x: targetPos.x,
          y: targetPos.y,
          duration: distance * 2.5,
          ease: 'Linear',
          onUpdate: () => {
            this.player.setDepth(this.player.x + this.player.y + 0.2);
          },
          onComplete: () => {
            this.isMoving = false;
            this.player.play('idle');
            EventBus.emit('game:player-moved', mapCoords);

            // TRIGGER DE PRUEBA: Si llega al borde derecho, abre la ciudad
            if (mapCoords.x > 18) {
              EventBus.emit('ui:open-modal', { type: 'city' });
            }
          }
        });
      }
    });

    // Avisar a React de que Phaser está listo
    this.game.events.emit('ready');
  }
}