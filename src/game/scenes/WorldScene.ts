import Phaser from 'phaser';
import { mapToScreen, screenToMap } from '../utils/isoMath';
import { Player } from '../entities/Player';

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private gridSize = 12;

  constructor() {
    super({ key: 'WorldScene' });
  }

  preload() {
    // 1. Cargamos las hojas de sprites
    const frameW = 256; 
    const frameH = 280;

     this.load.spritesheet('hero_idle', '/assets/sprites/idle.png', { frameWidth: 256, frameHeight: 280 });

    this.load.spritesheet('hero_walk', '/assets/sprites/walk.png', { frameWidth: frameW, frameHeight: frameH });
    this.load.spritesheet('hero_run', '/assets/sprites/run.png', { frameWidth: frameW, frameHeight: frameH });
    this.load.spritesheet('hero_crouch', '/assets/sprites/crouch.png', { frameWidth: frameW, frameHeight: frameH });
    this.load.spritesheet('hero_combat', '/assets/sprites/combat.png', { frameWidth: frameW, frameHeight: frameH });

    // Suelo
    const gFloor = this.make.graphics({ x: 0, y: 0 }, false);
    gFloor.fillStyle(0x1e293b, 1);
    gFloor.lineStyle(1, 0x334155, 1);
    gFloor.beginPath();
    gFloor.moveTo(32, 0); gFloor.lineTo(64, 16); gFloor.lineTo(32, 32); gFloor.lineTo(0, 16); gFloor.closePath();
    gFloor.fillPath(); gFloor.strokePath();
    gFloor.generateTexture('floor', 64, 32);
  }
  create() {
    // Animaciones (0 al 7 porque son 8 frames)
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('hero_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('hero_run', { start: 0, end: 7 }), frameRate: 15, repeat: -1 });
    this.anims.create({ key: 'crouch', frames: this.anims.generateFrameNumbers('hero_crouch', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'combat', frames: this.anims.generateFrameNumbers('hero_combat', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('hero_idle', { start: 0, end: 3 }), 
      frameRate: 4, // Lento para que solo se mueva el pelo
      repeat: -1
    });

    // Suelo
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const pos = mapToScreen(x, y);
        const tile = this.add.image(pos.x, pos.y, 'floor');
        tile.setDepth(x + y);
      }
    }

    // Jugador
    const startPos = mapToScreen(6, 6);
    this.player = new Player(this, startPos.x, startPos.y);
    this.player.play('idle');

    // Cámara
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#0f172a');

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const mapCoords = screenToMap(worldPoint.x, worldPoint.y);
      if (mapCoords.x >= 0 && mapCoords.x < this.gridSize && mapCoords.y >= 0 && mapCoords.y < this.gridSize) {
        this.player.moveToTile(mapCoords.x, mapCoords.y);
      }
    });

    // Pruebas de teclado
    this.input.keyboard?.on('keydown-SPACE', () => this.player.play('combat'));
    this.input.keyboard?.on('keydown-C', () => this.player.play('crouch'));
    this.input.keyboard?.on('keydown-SHIFT', () => this.player.play('run'));
    this.input.keyboard?.on('keyup', () => this.player.play('walk'));
  }
}