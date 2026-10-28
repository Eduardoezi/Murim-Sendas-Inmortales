// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { evaluateUnstick } from '../utils/movement';
import { ProvinceSeedData } from '../../core/data/world/types';
import { ChunkManager, screenToMap } from '../managers/ChunkManager';
import { PlayerEntity } from '../entities/PlayerEntity';
import { MinimapSystem } from '../systems/MinimapSystem';
import { stepGeoBudget } from '../../core/data/world/generators/geoTileCache';
import {
  CUBE_HEIGHT,
  MACRO_OVERLAY_ALPHA,
  MACRO_OVERLAY_DEPTH,
  TILE_HEIGHT,
  TILE_WIDTH,
  ensureTerrainTextures,
} from '../rendering/tileTextures';

const mapToScreen = (mapX: number, mapY: number) => ({
  x: (mapX - mapY) * (TILE_WIDTH / 2),
  y: (mapX + mapY) * (TILE_HEIGHT / 2)
});

export class WorldScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private chunkManager!: ChunkManager;
  private treeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private faunaGroup!: Phaser.Physics.Arcade.Group;
  private province!: ProvinceSeedData;
  private minimap!: MinimapSystem;

  constructor() {
    super({ key: 'WorldScene' });
  }

  private macroOverlay?: Phaser.GameObjects.TileSprite;

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

  preload() {
    ensureTerrainTextures(this);
    this.createTrees();
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f172a');

    const shaanxi = (INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') ?? INITIAL_PROVINCES[0]) as ProvinceSeedData;
    this.province = shaanxi;
    const changan = shaanxi.coords ?? { x: 580, y: 578 };

    const absSpawn = { x: changan.x + 8, y: changan.y + 8 };

    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group();

    // El sprite y los chunks trabajan en coordenadas absolutas del mapa:
    // mapToScreen(tile absoluto) es la posición de pantalla del tile.
    const startPos = mapToScreen(absSpawn.x, absSpawn.y);
    
    this.player = new PlayerEntity(this, startPos.x, startPos.y + CUBE_HEIGHT);
    this.chunkManager = new ChunkManager(this, this.province, this.treeGroup, this.faunaGroup);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
    this.ensureWalkableSpawn();

    this.physics.add.collider(this.player.sprite, this.treeGroup);
    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
    this.createMacroOverlay();

    const moveToTile = (tile: { x: number; y: number }) => {
      if (this.player.isMoving) return;
      const target = { x: Math.round(tile.x), y: Math.round(tile.y) };
      const startMapCoords = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
      const path = findPath(
        startMapCoords.x, startMapCoords.y, target.x, target.y,
        (x, y) => this.chunkManager.isBlockedTile(x, y)
      );

      if (path.length > 0) {
        this.player.walkPath(this, path, mapToScreen, () => {
          this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
        });
        return;
      }

      const unstick = evaluateUnstick(startMapCoords, target, {
        isBlocked: (x, y) => this.chunkManager.isBlockedTile(x, y),
        isMountain: (x, y) => this.chunkManager.isMountainTile(x, y),
      });

      if (!unstick.allowed) {
        console.warn('[movement] fallback rechazado', {
          reason: unstick.reason,
          distanceTiles: unstick.distanceTiles,
          from: startMapCoords,
          to: target,
        });
        return;
      }

      console.info('[movement] unstick aplicado', {
        distanceTiles: unstick.distanceTiles,
        from: startMapCoords,
        to: target,
      });
      const directPath = [{ x: startMapCoords.x, y: startMapCoords.y }, target];
      this.player.walkPath(this, directPath, mapToScreen, () => {
        this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
      });
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.minimap && this.minimap.isPointerOver(pointer.x, pointer.y)) return; // Evitar mover si clicas el minimapa
      if (this.player.isMoving) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const local = screenToMap(worldPoint.x, worldPoint.y);
      moveToTile({ x: local.x, y: local.y });
    });

    // 🔥 INICIALIZACIÓN DEL MINIMAPA SEGURA
    this.minimap = new MinimapSystem(this, {
      getPlayerTile: () => screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT),
      getEnemies: () => {
        const out: Array<{ x: number; y: number }> = [];
        this.faunaGroup.getChildren().forEach((child) => {
          const spr = child as Phaser.Physics.Arcade.Sprite;
          if (!spr.active) return;
          if (spr.getData('aquatic')) return;
          out.push(screenToMap(spr.x, spr.y - CUBE_HEIGHT));
        });
        return out;
      },
      getWaypoint: () => null, // De momento no tenemos sistema de waypoints visual
      onMapClick: (tx, ty) => moveToTile({ x: tx, y: ty }),
    });
    this.scale.on('resize', () => {
      this.minimap?.handleResize();
      this.macroOverlay?.setSize(this.scale.width, this.scale.height);
    });

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      const zoomSpeed = 0.001;
      let newZoom = this.cameras.main.zoom - (deltaY * zoomSpeed);
      newZoom = Phaser.Math.Clamp(newZoom, 0.8, 3.5);
      this.cameras.main.setZoom(newZoom);
    });
  }

  /** Evita nacer dentro de una cordillera: mueve al jugador al tile caminable más cercano. */
  private ensureWalkableSpawn(): void {
    const start = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
    const spawn = this.chunkManager.findNearestWalkableTile(start);
    if (!spawn || (spawn.x === start.x && spawn.y === start.y)) return;

    const pos = mapToScreen(spawn.x, spawn.y);
    this.player.sprite.setPosition(pos.x, pos.y + CUBE_HEIGHT);
    this.player.sprite.setDepth(this.player.sprite.y);
    this.player.graphics.setDepth(this.player.sprite.y);
    console.info('[movement] spawn reubicado a tile transitable', { from: start, to: spawn });
  }

  /**
   * Capa macro de variación: ruido grande en multiply al 12 % sobre el suelo.
   * Rompe la repetición de texturas sin tocar la iluminación de los tiles.
   */
  private createMacroOverlay(): void {
    this.macroOverlay = this.add.tileSprite(
      0, 0, this.scale.width, this.scale.height, 'macro_noise'
    );
    this.macroOverlay
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(MACRO_OVERLAY_DEPTH)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(MACRO_OVERLAY_ALPHA);
  }

  update(time: number): void {
    stepGeoBudget();
    if (this.minimap) this.minimap.update();
    if (this.macroOverlay) {
      this.macroOverlay.tilePositionX = this.cameras.main.scrollX;
      this.macroOverlay.tilePositionY = this.cameras.main.scrollY;
    }
    this.player.update(time);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
  }
}