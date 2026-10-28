// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { evaluateUnstick } from '../utils/movement';
import { ProvinceSeedData } from '../../core/data/world/types';
import { ChunkManager, screenToMap } from '../managers/ChunkManager';
import { ProceduralCharacter } from '../entities/ProceduralCharacter';
import { MinimapSystem } from '../systems/MinimapSystem';
import { AutoMapSystem } from '../systems/AutoMapSystem';
import { stepGeoBudget } from '../../core/data/world/generators/geoTileCache';
import { ensureTreeTextures } from '../rendering/treeTextures';
import {
  CUBE_HEIGHT,
  MACRO_OVERLAY_ALPHA,
  MACRO_OVERLAY_DEPTH,
  ensureTerrainTextures,
} from '../rendering/tileTextures';
import { DEFAULT_APPEARANCE, DEFAULT_EQUIPMENT, usePlayerStore } from '../../core/store/usePlayerStore';

export class WorldScene extends Phaser.Scene {
  private player!: ProceduralCharacter;
  private chunkManager!: ChunkManager;
  private treeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private faunaGroup!: Phaser.Physics.Arcade.Group;
  private province!: ProvinceSeedData;
  private minimap!: MinimapSystem;
  private autoMap!: AutoMapSystem;
  private attackKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'WorldScene' });
  }

  private macroOverlay?: Phaser.GameObjects.TileSprite;
  private atmosphere?: Phaser.GameObjects.Image;

  preload() {
    ensureTerrainTextures(this);
    ensureTreeTextures(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.createAtmosphere();

    const shaanxi = (INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') ?? INITIAL_PROVINCES[0]) as ProvinceSeedData;
    this.province = shaanxi;
    const changan = shaanxi.coords ?? { x: 580, y: 578 };

    const absSpawn = { x: changan.x + 8, y: changan.y + 8 };

    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group();

    this.chunkManager = new ChunkManager(this, this.province, this.treeGroup, this.faunaGroup);

    // El store manda sobre la apariencia y el equipo: el avatar nace con lo
    // elegido en el CharacterCustomizer.
    const playerState = usePlayerStore.getState();
    this.player = new ProceduralCharacter(this, {
      cartX: absSpawn.x,
      cartY: absSpawn.y,
      appearance: { ...DEFAULT_APPEARANCE, ...(playerState.appearance ?? {}) },
      equipment: { ...DEFAULT_EQUIPMENT, ...(playerState.equipment ?? {}) },
      isWalkable: (x, y) => this.chunkManager.isTileWalkable(x, y),
    });

    this.chunkManager.update(this.player.cartX, this.player.cartY);
    this.ensureWalkableSpawn();

    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.chunkManager.update(this.player.cartX, this.player.cartY);
    this.createMacroOverlay();
    this.bindPlayerState();

    this.attackKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const moveToTile = (tile: { x: number; y: number }) => {
      if (this.player.isMoving) return;
      const target = { x: Math.round(tile.x), y: Math.round(tile.y) };
      const startMapCoords = this.player.getTilePosition();
      const path = findPath(
        startMapCoords.x, startMapCoords.y, target.x, target.y,
        (x, y) => !this.chunkManager.isTileWalkable(x, y)
      );

      if (path.length > 0) {
        this.player.walkPath(path, () => {
          this.chunkManager.update(this.player.cartX, this.player.cartY);
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
      this.player.walkPath(directPath, () => {
        this.chunkManager.update(this.player.cartX, this.player.cartY);
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
      getPlayerTile: () => this.player.getTilePosition(),
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

    // Automapa (Tab): overlay no interactivo → el clic-a-mover sigue activo.
    this.autoMap = new AutoMapSystem(this, {
      getPlayerTile: () => this.player.getTilePosition(),
    });

    this.scale.on('resize', () => {
      this.minimap?.handleResize();
      this.autoMap?.handleResize();
      this.macroOverlay?.setSize(this.scale.width, this.scale.height);
      this.atmosphere?.setDisplaySize(this.scale.width, this.scale.height);
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
    const start = this.player.getTilePosition();
    const spawn = this.chunkManager.findNearestWalkableTile(start);
    if (!spawn || (spawn.x === start.x && spawn.y === start.y)) return;

    this.player.setCartPosition(spawn.x, spawn.y);
    this.chunkManager.update(this.player.cartX, this.player.cartY);
    console.info('[movement] spawn reubicado a tile transitable', { from: start, to: spawn });
  }

  /** React → Phaser: apariencia y equipo se reflejan en vivo, sin recargar escena. */
  private bindPlayerState(): void {
    const unsubscribe = usePlayerStore.subscribe((state, prev) => {
      if (state.appearance && state.appearance !== prev.appearance) {
        this.player.setAppearance(state.appearance);
      }

      if (state.equipment.weapon !== prev.equipment.weapon) {
        this.player.equipItem('weapon', { weapon: state.equipment.weapon });
      }
      if (state.equipment.armor !== prev.equipment.armor) {
        this.player.equipItem('chest', { armor: state.equipment.armor });
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => unsubscribe());
  }

  /**
   * Viñeta fija sobre el mundo: oscurece los bordes y deja el foco en el
   * personaje (atmósfera Diablo II). Va bajo el minimapa y el automapa para
   * no apagar la interfaz.
   */
  private createAtmosphere(): void {
    const key = 'atmosphere_vignette';
    if (!this.textures.exists(key)) {
      const size = 512;
      const texture = this.textures.createCanvas(key, size, size);
      if (!texture) return;
      const ctx = texture.context;
      const grad = ctx.createRadialGradient(
        size / 2, size / 2, size * 0.16,
        size / 2, size / 2, size * 0.72,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.45, 'rgba(4,6,8,0.08)');
      grad.addColorStop(0.75, 'rgba(2,4,6,0.34)');
      grad.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      texture.refresh();
    }
    this.atmosphere = this.add.image(0, 0, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(45000)
      .setDisplaySize(this.scale.width, this.scale.height);
  }

  /**
   * Capa macro de variación: ruido grande en multiply al 14 % sobre el suelo.
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

  update(time: number, delta: number): void {
    stepGeoBudget();
    if (this.minimap) this.minimap.update();
    if (this.autoMap) this.autoMap.update();
    if (this.macroOverlay) {
      this.macroOverlay.tilePositionX = this.cameras.main.scrollX;
      this.macroOverlay.tilePositionY = this.cameras.main.scrollY;
    }

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.player.attack();
    }

    this.player.update(time, delta);
    this.chunkManager.update(this.player.cartX, this.player.cartY);
    this.chunkManager.animateWater(time);
  }
}