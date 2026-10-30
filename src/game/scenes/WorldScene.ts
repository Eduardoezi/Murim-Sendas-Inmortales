// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { evaluateUnstick } from '../utils/movement';
import { ProvinceSeedData } from '../../core/data/world/types';
import { ChunkManager, screenToMap } from '../managers/ChunkManager';
import { ProceduralCharacter } from '../entities/ProceduralCharacter';
import { JumpNode, jumpNodeNear } from '../utils/jumpNodes';
import { loadPlayerPosition, savePlayerPosition, TilePosition } from '../utils/playerPositionStorage';
import { HudScene, HUD_SCENE_KEY } from './HudScene';
import { HudDataSource } from '../systems/HudDataSource';
import { stepGeoBudget } from '../../core/data/world/generators/geoTileCache';
import { ensureTreeTextures } from '../rendering/treeTextures';
import {
  CUBE_HEIGHT,
  ensureTerrainTextures,
} from '../rendering/tileTextures';
import { DEFAULT_APPEARANCE, DEFAULT_EQUIPMENT, usePlayerStore } from '../../core/store/usePlayerStore';

export class WorldScene extends Phaser.Scene implements HudDataSource {
  private player!: ProceduralCharacter;
  private chunkManager!: ChunkManager;
  private treeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private faunaGroup!: Phaser.Physics.Arcade.Group;
  private province!: ProvinceSeedData;
  private attackKey?: Phaser.Input.Keyboard.Key;
  private lastPersistedTile: TilePosition | null = null;
  /** Destino del click-to-move activo; lo consume el radar de HudScene. */
  private waypoint: TilePosition | null = null;

  constructor() {
    super({ key: 'WorldScene' });
  }

  /** Capa de interfaz (minimapa, automapa, viñeta, avisos). */
  private get hud(): HudScene | undefined {
    return this.scene.get(HUD_SCENE_KEY) as HudScene | undefined;
  }

  preload() {
    ensureTerrainTextures(this);
    ensureTreeTextures(this);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');

    const shaanxi = (INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') ?? INITIAL_PROVINCES[0]) as ProvinceSeedData;
    this.province = shaanxi;
    const changan = shaanxi.coords ?? { x: 580, y: 578 };

    const defaultSpawn = { x: changan.x + 8, y: changan.y + 8 };
    const savedSpawn = loadPlayerPosition();
    const absSpawn = savedSpawn ?? defaultSpawn;

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
      getElevation: (x, y) => this.chunkManager.elevationAt(x, y),
    });

    this.refreshChunks();
    if (!savedSpawn || !this.canResumeAt(savedSpawn)) {
      this.ensureWalkableSpawn();
    }
    this.persistPlayerPosition(true);

    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.bindPlayerState();

    this.attackKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard?.addCapture(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // El radar vive en otra escena: su hit-area y este test son ahora el mismo
      // espacio de pantalla, así que el clic ya no se pierde entre las dos capas.
      if (this.hud?.isPointerBlocked(pointer.x, pointer.y)) return;
      if (this.player.isMoving || this.player.isJumping) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const local = screenToMap(worldPoint.x, worldPoint.y);
      this.orderMoveTo({ x: local.x, y: local.y });
    });

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gos: any, _dx: number, deltaY: number) => {
      if (this.hud?.isPointerBlocked(pointer.x, pointer.y)) return; // rueda sobre el radar = radio del radar
      const zoomSpeed = 0.001;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - (deltaY * zoomSpeed), 0.8, 3.5);
      this.cameras.main.setZoom(newZoom);
    });

    // El HUD se lanza al final: necesita al personaje y al ChunkManager vivos.
    this.scene.launch(HUD_SCENE_KEY);
  }

  /**
   * Orden de movimiento (clic en el mundo o en el radar): A* normal, con la
   * runa de salto y el unstick como salidas del camino directo.
   */
  private orderMoveTo(tile: { x: number; y: number }): void {
    if (!this.player || this.player.isMoving || this.player.isJumping) return;

    const target = { x: Math.round(tile.x), y: Math.round(tile.y) };
    const startMapCoords = this.player.getTilePosition();

    // Un clic sobre una runa de borde es una orden de salto, no de A*.
    const jumpNode = jumpNodeNear(target.x, target.y, 1);
    if (jumpNode && this.handleJumpNode(jumpNode, startMapCoords)) return;

    const path = findPath(
      startMapCoords.x, startMapCoords.y, target.x, target.y,
      (x, y) => !this.chunkManager.isTileWalkable(x, y),
      (fx, fy, tx, ty) => this.chunkManager.canStep(fx, fy, tx, ty),
    );

    if (path.length > 0) {
      this.waypoint = target;
      this.player.walkPath(path, this.refreshChunks);
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
    this.waypoint = target;
    this.player.walkPath([{ x: startMapCoords.x, y: startMapCoords.y }, target], this.refreshChunks);
  }

  // ── Contrato del HUD (HudDataSource) ───────────────────────────────────────

  public getPlayerTile(): { x: number; y: number } {
    return this.player ? this.player.getTilePosition() : { x: 0, y: 0 };
  }

  public getWaypoint(): { x: number; y: number } | null {
    return this.waypoint;
  }

  /** Fauna hostil en coordenadas de grid, sin los acuáticos (no son amenaza visible). */
  public getEnemies(): Array<{ x: number; y: number }> {
    const out: Array<{ x: number; y: number }> = [];
    if (!this.faunaGroup) return out;
    this.faunaGroup.getChildren().forEach((child) => {
      const spr = child as Phaser.Physics.Arcade.Sprite;
      if (!spr.active) return;
      if (spr.getData('aquatic')) return;
      out.push(screenToMap(spr.x, spr.y - CUBE_HEIGHT));
    });
    return out;
  }

  /** Lo que abarca la cámara principal, en píxeles de pantalla del mundo. */
  public getCameraWorldRect() {
    const cam = this.cameras.main;
    const tl = cam.getWorldPoint(0, 0);
    const br = cam.getWorldPoint(cam.width, cam.height);
    return {
      left: Math.min(tl.x, br.x),
      top: Math.min(tl.y, br.y),
      right: Math.max(tl.x, br.x),
      bottom: Math.max(tl.y, br.y),
    };
  }

  public isTileWalkable(x: number, y: number): boolean {
    return !!this.chunkManager && this.chunkManager.isTileWalkable(x, y);
  }

  public moveToTile(x: number, y: number): void {
    this.orderMoveTo({ x, y });
  }

  /** Carga/descarga chunks alrededor de la posición actual del jugador. */
  private readonly refreshChunks = (): void => {
    this.chunkManager.update(this.player.cartX, this.player.cartY);
  };

  /** Evita nacer dentro de una cordillera: mueve al jugador al tile caminable más cercano. */
  private ensureWalkableSpawn(): void {
    const start = this.player.getTilePosition();
    const spawn = this.chunkManager.findNearestWalkableTile(start);
    if (!spawn || (spawn.x === start.x && spawn.y === start.y)) return;

    this.player.setCartPosition(spawn.x, spawn.y);
    this.refreshChunks();
    console.info('[movement] spawn reubicado a tile transitable', { from: start, to: spawn });
  }

  /**
   * Una posición guardada se respeta si sigue siendo pisable y seca. No se
   * exige elevación 0: el jugador puede haber guardado sobre una meseta.
   */
  private canResumeAt(tile: TilePosition): boolean {
    return this.chunkManager.isTileWalkable(tile.x, tile.y)
      && !this.chunkManager.waterTiles.has(`${tile.x},${tile.y}`);
  }

  /**
   * Espeja la tesela actual en localStorage cuando cambia. Se ejecuta en cada
   * frame, pero solo escribe al cruzar de tile, no por píxel recorrido.
   */
  private persistPlayerPosition(force = false): void {
    if (!this.player) return;
    const tile = this.player.getTilePosition();
    if (!force && tile.x === this.lastPersistedTile?.x && tile.y === this.lastPersistedTile?.y) {
      return;
    }
    this.lastPersistedTile = tile;
    savePlayerPosition(tile);
  }

  /**
   * Ejecuta (o rechaza) una orden de salto sobre una runa de borde.
   * Requiere qigong: el salto de acantilado no es una habilidad básica.
   * Devuelve true si el clic se consumió como salto.
   */
  private handleJumpNode(node: JumpNode, start: { x: number; y: number }): boolean {
    if (!usePlayerStore.getState().hasSkill('qigong')) {
      this.showToast('Salto de acantilado: requiere haber aprendido qigong');
      return true;
    }

    const playerElev = this.chunkManager.elevationAt(start.x, start.y);
    const lowElev = this.chunkManager.elevationAt(node.from.x, node.from.y);
    const highElev = this.chunkManager.elevationAt(node.to.x, node.to.y);

    let takeoff: { x: number; y: number };
    let landing: { x: number; y: number };
    if (playerElev === lowElev) {
      takeoff = node.from;
      landing = node.to;
    } else if (playerElev === highElev) {
      takeoff = node.to;
      landing = node.from;
    } else {
      this.showToast('No puedes saltar desde esta altura');
      return true;
    }

    const afterLanding = this.refreshChunks;

    if (start.x === takeoff.x && start.y === takeoff.y) {
      this.player.jumpTo(landing.x, landing.y, afterLanding);
      return true;
    }

    const path = findPath(
      start.x, start.y, takeoff.x, takeoff.y,
      (x, y) => !this.chunkManager.isTileWalkable(x, y),
      (fx, fy, tx, ty) => this.chunkManager.canStep(fx, fy, tx, ty),
    );
    if (path.length < 2) {
      this.showToast('No hay camino hasta el borde del salto');
      return true;
    }

    // Caminar hasta el borde y saltar al llegar: un solo clic, dos tiempos.
    this.player.walkPath(path, () => {
      afterLanding();
      this.player.jumpTo(landing.x, landing.y, afterLanding);
    });
    return true;
  }

  /** Aviso efímero: lo dibuja HudScene, sobre una cámara que no escala. */
  private showToast(message: string): void {
    const hud = this.hud;
    if (hud) hud.showToast(message);
    else console.info('[aviso]', message);
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

  update(time: number, delta: number): void {
    stepGeoBudget();
    if (!this.player || !this.chunkManager) return;

    // El destino del radar se apaga solo: en cuanto el personaje deja de andar
    // (o el camino se corta) el pin del waypoint pierde su sentido.
    if (this.waypoint && !this.player.isMoving && !this.player.isJumping) {
      this.waypoint = null;
    }

    if (this.attackKey && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.player.attack();
    }

    this.player.update(time, delta);
    this.refreshChunks();
    this.chunkManager.animateWater(time);
    this.persistPlayerPosition();
  }
}