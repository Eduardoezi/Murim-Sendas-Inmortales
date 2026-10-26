// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { Province } from '../../core/data/world/types';
import { ChunkManager, screenToMap } from '../managers/ChunkManager';
import { PlayerEntity } from '../entities/PlayerEntity';
import { BeastEntity } from '../entities/BeastEntity';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const CUBE_HEIGHT = 16;

const mapToScreen = (mapX: number, mapY: number) => ({
  x: (mapX - mapY) * (TILE_WIDTH / 2),
  y: (mapX + mapY) * (TILE_HEIGHT / 2)
});

export class WorldScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private chunkManager!: ChunkManager;
  private treeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private faunaGroup!: Phaser.Physics.Arcade.Group;
  private province!: Province;
  private vignette!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'WorldScene' });
  }

  // --- 1. GENERACIÓN DE TEXTURAS TEMPORALES (Se quedarán aquí hasta tener arte real) ---
  private createTileTexture(key: string, topColor: number, sideColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(topColor, 1);
    g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath();
    g.fillStyle(sideColor, 1);
    g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 32); g.lineTo(32, 32 + CUBE_HEIGHT); g.lineTo(0, 16 + CUBE_HEIGHT); g.closePath(); g.fillPath();
    g.fillStyle(sideColor - 0x111111, 1);
    g.beginPath(); g.moveTo(32, 32); g.lineTo(64, 16); g.lineTo(64, 16 + CUBE_HEIGHT); g.lineTo(32, 32 + CUBE_HEIGHT); g.closePath(); g.fillPath();
    g.generateTexture(key, 64, 32 + CUBE_HEIGHT);
    g.destroy();
  }

  private createTrees() {
    const gRound = this.make.graphics({ x: 0, y: 0 }, false);
    gRound.fillStyle(0x5c4033, 1); gRound.fillRect(28, 40, 8, 20);
    gRound.fillStyle(0x22c55e, 1);
    const leafPositions = [
      {x:32, y:30}, {x:24, y:35}, {x:40, y:35}, {x:20, y:25}, {x:44, y:25}, 
      {x:28, y:20}, {x:36, y:20}, {x:32, y:15}, {x:16, y:32}, {x:48, y:32},
      {x:26, y:12}, {x:38, y:12}
    ];
    leafPositions.forEach(p => gRound.fillCircle(p.x, p.y, 10));
    gRound.generateTexture('tree_round', 64, 64);
    
    const gPine = this.make.graphics({ x: 0, y: 0 }, false);
    gPine.fillStyle(0x5c4033, 1); gPine.fillRect(28, 50, 8, 14);
    for(let i=0; i<4; i++) {
      const yOffset = 10 + (i * 10);
      const width = 10 + (i * 6);
      gPine.fillStyle(0x15803d, 1); gPine.fillTriangle(32, yOffset, 32 - width, yOffset + 20, 32, yOffset + 20);
      gPine.fillStyle(0x22c55e, 1); gPine.fillTriangle(32, yOffset, 32 + width, yOffset + 20, 32, yOffset + 20);
    }
    gPine.generateTexture('tree_pine', 64, 64);

    const gPalm = this.make.graphics({ x: 0, y: 0 }, false);
    gPalm.lineStyle(6, 0x8b5a2b, 1);
    gPalm.beginPath(); gPalm.moveTo(32, 60); gPalm.lineTo(40, 20); gPalm.strokePath();
    gPalm.lineStyle(4, 0x22c55e, 1);
    for(let i=0; i<6; i++) {
      gPalm.beginPath(); gPalm.moveTo(40, 20); 
      const angle = (Math.PI / 3) * i;
      gPalm.lineTo(40 + Math.cos(angle)*20, 20 + Math.sin(angle)*10); gPalm.strokePath();
    }
    gPalm.generateTexture('tree_palm', 64, 64);

    const gDead = this.make.graphics({ x: 0, y: 0 }, false);
    gDead.lineStyle(6, 0x4a4a4a, 1);
    gDead.beginPath(); gDead.moveTo(32, 60); gDead.lineTo(32, 20); gDead.strokePath();
    gDead.lineStyle(4, 0x4a4a4a, 1);
    gDead.beginPath(); gDead.moveTo(32, 40); gDead.lineTo(15, 25); gDead.strokePath();
    gDead.beginPath(); gDead.moveTo(32, 30); gDead.lineTo(50, 15); gDead.strokePath();
    gDead.generateTexture('tree_dead', 64, 64);
  }

  private createBeastTextures() {
    const gSnake = this.make.graphics({ x: 0, y: 0 }, false);
    gSnake.fillStyle(0x22c55e, 1); gSnake.fillCircle(16, 16, 8);
    gSnake.generateTexture('beast_snake', 32, 32);

    const gSplash = this.make.graphics({ x: 0, y: 0 }, false);
    gSplash.lineStyle(2, 0xffffff, 1);
    gSplash.strokeCircle(10, 10, 5);
    gSplash.generateTexture('splash_ring', 20, 20);
  }

  private createVignette() {
    const width = this.scale.width;
    const height = this.scale.height;
    const vignetteTexture = this.textures.createCanvas('vignette', width, height);
    if (!vignetteTexture) return;
    
    const ctx = vignetteTexture.getContext();
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.4, width / 2, height / 2, Math.max(width, height) * 0.8);
    gradient.addColorStop(0, 'rgba(5, 7, 12, 0)');
    gradient.addColorStop(0.6, 'rgba(5, 7, 12, 0.7)');
    gradient.addColorStop(1, 'rgba(5, 7, 12, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    vignetteTexture.refresh();
    
    this.vignette = this.add.image(width / 2, height / 2, 'vignette');
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(10000);
  }

  // --- 2. CICLO DE VIDA DE PHASER ---
  preload() {
    this.createTileTexture('tile_hierba', 0x4ade80, 0x22c55e);
    this.createTileTexture('tile_agua', 0x3b82f6, 0x2563eb);
    this.createTileTexture('tile_arena', 0xfcd34d, 0xd97706);
    this.createTileTexture('tile_nieve', 0xf8fafc, 0xcbd5e1);
    
    this.createTrees();
    this.createBeastTextures(); 
  }

  create() {
    this.createVignette();
    this.cameras.main.setBackgroundColor('#0f172a'); // Fondo oscuro para la niebla

    this.province = INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') as Province || INITIAL_PROVINCES[0];
    
    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group(); 

    // Cargar posición inicial
    let startMapX = 8;
    let startMapY = 8;
    try {
      const saved = localStorage.getItem('murim_player_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          startMapX = parsed.x;
          startMapY = parsed.y;
        }
      }
    } catch (e) {}

    const startPos = mapToScreen(startMapX, startMapY);
    
    // Inicializar Entidades y Managers
    this.player = new PlayerEntity(this, startPos.x, startPos.y + CUBE_HEIGHT);
    this.chunkManager = new ChunkManager(this, this.province, this.treeGroup, this.faunaGroup);

    // Colisiones
    this.physics.add.collider(this.player.sprite, this.treeGroup);
    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    // Cámara
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);

    // Input: Click to Move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.player.isMoving) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const mapCoords = screenToMap(worldPoint.x, worldPoint.y);
      const tileKey = `${mapCoords.x},${mapCoords.y}`;

      // Bloquear clic en agua o árboles (O(1))
      if (this.chunkManager.waterTiles.has(tileKey) || this.chunkManager.obstacles.has(tileKey)) return;

      const startMapCoords = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
      const path = findPath(
        startMapCoords.x, startMapCoords.y, mapCoords.x, mapCoords.y, 
        (x, y) => this.chunkManager.obstacles.has(`${x},${y}`)
      );

      if (path.length > 0) {
        this.player.walkPath(this, path, mapToScreen, () => {
          localStorage.setItem('murim_player_pos', JSON.stringify({ x: mapCoords.x, y: mapCoords.y }));
          this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
        });
      }
    });

    // Input: Zoom con la Rueda
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      const zoomSpeed = 0.001;
      let newZoom = this.cameras.main.zoom - (deltaY * zoomSpeed);
      
      newZoom = Phaser.Math.Clamp(newZoom, 0.8, 3.5);
      
      this.cameras.main.setZoom(newZoom);
      this.vignette.setScale(1 / newZoom); // La niebla cubre la pantalla
    });
  }

  update(time: number): void {
  // 1. Jugador
  this.player.update(time);

  // 2. Chunks (cargar/descargar)
  this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);

  // 3. IA de fauna — el sprite físico es la ÚNICA fuente de verdad
  const playerX = this.player.sprite.x;
  const playerY = this.player.sprite.y;

  this.faunaGroup.getChildren().forEach((child) => {
    const beastSprite = child as Phaser.Physics.Arcade.Sprite;
    if (!beastSprite.active) return;

    const beastEntity = beastSprite.getData('entity') as BeastEntity | undefined;
    if (beastEntity) {
      beastEntity.update(time, playerX, playerY);
    }
  });
}
}