// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { Province } from '../../core/data/world/types';
import { ChunkManager, screenToMap } from '../managers/ChunkManager';
import { PlayerEntity } from '../entities/PlayerEntity';
import { BeastEntity } from '../entities/BeastEntity';
import { MinimapSystem } from '../systems/MinimapSystem';
import { stepGeoBudget, getBiomeCached } from '../../core/data/world/generators/geoTileCache';
import { nearestOutpost, distanceToOutpost, WorldOutpost, getOutposts, ARRIVAL_RADIUS } from '../../core/data/world/worldRegistry';
import { EventBus } from '../events/EventBus';
import { usePlayerStore } from '../../core/store/usePlayerStore';

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
  
  // ── Capa UI (HUD del juego) ───────────────────────────────────────────────
  // En isométrico, depth = pos.y + N y crece sin límite. Solución:
  // una capa propia con Number.MAX_SAFE_INTEGER.
  public uiLayer!: Phaser.GameObjects.Layer;

  // ── Minimapa ──────────────────────────────────────────────────────────────
  private minimap!: MinimapSystem;
  private worldOrigin = { x: 0, y: 0 };
  private currentWaypoint: { x: number; y: number } | null = null;
  
  private outpostsLayer!: Phaser.GameObjects.Container;
  private renderedOutposts = new Map<string, Phaser.GameObjects.GameObject[]>();
  private lastPlayerTile = { x: 0, y: 0 };
  private lastPosSave = 0;
  private arrivedCooldowns = new Set<string>();

  constructor() {
    super({ key: 'WorldScene' });
  }

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

  private createMountainTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x6b7280, 1);
    g.beginPath(); g.moveTo(32, 4); g.lineTo(60, 26); g.lineTo(32, 44); g.lineTo(4, 26); g.closePath(); g.fillPath();
    g.fillStyle(0x4b5563, 1);
    g.beginPath(); g.moveTo(4, 26); g.lineTo(32, 44); g.lineTo(32, 52); g.lineTo(4, 34); g.closePath(); g.fillPath();
    g.fillStyle(0x374151, 1);
    g.beginPath(); g.moveTo(60, 26); g.lineTo(32, 44); g.lineTo(32, 52); g.lineTo(60, 34); g.closePath(); g.fillPath();
    g.fillStyle(0xf1f5f9, 1);
    g.beginPath(); g.moveTo(32, 4); g.lineTo(42, 16); g.lineTo(32, 22); g.lineTo(22, 16); g.closePath(); g.fillPath();
    g.generateTexture('tile_montana', 64, 52 + CUBE_HEIGHT);
    g.destroy();
  }

  private createSwampTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x365314, 1);
    g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath();
    g.fillStyle(0x1a2e05, 1);
    g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 32); g.lineTo(32, 32 + CUBE_HEIGHT); g.lineTo(0, 16 + CUBE_HEIGHT); g.closePath(); g.fillPath();
    g.lineStyle(2, 0x84cc16, 0.8);
    for (let i = 0; i < 5; i++) {
      const bx = 14 + i * 9;
      g.beginPath(); g.moveTo(bx, 18); g.lineTo(bx + 3, 6); g.strokePath();
    }
    g.generateTexture('tile_pantano', 64, 32 + CUBE_HEIGHT);
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

  private createPoiTextures() {
    const mk = (key: string, flag: number) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x5c4033, 1); g.fillRect(14, 8, 4, 40);
      g.fillStyle(flag, 1);
      g.beginPath(); g.moveTo(18, 8); g.lineTo(44, 14); g.lineTo(18, 24); g.closePath(); g.fillPath();
      g.fillStyle(0xfbbf24, 1); g.fillCircle(16, 6, 3);
      g.generateTexture(key, 48, 52);
      g.destroy();
    };
    mk('poi_flag_capital', 0xd97706);
    mk('poi_flag_sect', 0x0ea5e9);
    mk('poi_flag_landmark', 0xa855f7);
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
    // OJO: este valor por sí solo NO garantiza nada. La protección real es la uiLayer.
    this.vignette.setDepth(10000);
  }

  preload() {
    this.createTileTexture('tile_hierba', 0x4ade80, 0x22c55e);
    this.createTileTexture('tile_agua', 0x3b82f6, 0x2563eb);
    this.createTileTexture('tile_arena', 0xfcd34d, 0xd97706);
    this.createTileTexture('tile_nieve', 0xf8fafc, 0xcbd5e1);
    this.createMountainTexture();
    this.createSwampTexture();
    this.createTrees();
    this.createBeastTextures();
    this.createPoiTextures();
  }

  create() {
    // ── Capa UI dedicada (creada ANTES que cualquier objeto de HUD) ────────
    this.uiLayer = this.add.layer();
    this.uiLayer.setDepth(Number.MAX_SAFE_INTEGER);

    this.createVignette();
    this.uiLayer.add(this.vignette); // FIX: la niebla ahora es inmune al depth del mundo

    this.cameras.main.setBackgroundColor('#0f172a');

    const shaanxi = INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') as Province || INITIAL_PROVINCES[0];
    this.province = shaanxi;
    const changan = (shaanxi as any).coords ?? { x: 580, y: 334 };

    let absSpawn = { x: changan.x + 8, y: changan.y + 8 };
    try {
      const savedAbs = localStorage.getItem('murim_world_pos');
      if (savedAbs) {
        const parsed = JSON.parse(savedAbs);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          absSpawn = { x: Math.round(parsed.x), y: Math.round(parsed.y) };
        }
      }
    } catch (e) {}

    this.worldOrigin = { x: absSpawn.x - 8, y: absSpawn.y - 8 };

    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group();

    const startMapX = absSpawn.x - this.worldOrigin.x;
    const startMapY = absSpawn.y - this.worldOrigin.y;
    const worldX = this.worldOrigin.x + startMapX;
    const worldY = this.worldOrigin.y + startMapY;
    const startPos = mapToScreen(worldX, worldY);
    
    this.player = new PlayerEntity(this, startPos.x, startPos.y + CUBE_HEIGHT);
    this.chunkManager = new ChunkManager(this, this.province, this.treeGroup, this.faunaGroup);
    this.outpostsLayer = this.add.container(0, 0);

    this.physics.add.collider(this.player.sprite, this.treeGroup);
    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);

    const moveToTile = (tile: { x: number; y: number }) => {
      if (this.player.isMoving) return;
      const localTarget = { x: tile.x - this.worldOrigin.x, y: tile.y - this.worldOrigin.y };
      const tileKey = `${localTarget.x},${localTarget.y}`;

      if (this.chunkManager.waterTiles.has(tileKey) || this.chunkManager.obstacles.has(tileKey)) return;

      const startMapCoords = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
      const path = findPath(
        startMapCoords.x, startMapCoords.y, localTarget.x, localTarget.y,
        (x, y) => this.chunkManager.obstacles.has(`${x},${y}`)
      );

      if (path.length > 0) {
        this.currentWaypoint = { ...tile };
        this.player.walkPath(this, path, mapToScreen, () => {
          this.currentWaypoint = null;
          localStorage.setItem('murim_player_pos', JSON.stringify(localTarget));
          this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
          this.checkArrival();
        });
      }
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.minimap && this.minimap.isPointerOver(pointer.x, pointer.y)) return;
      if (this.input.hitTestPointer(pointer).some((go: any) => go !== this.player.sprite && go instanceof Phaser.GameObjects.Image && String(go.texture.key).startsWith('poi_flag_'))) return;
      if (this.player.isMoving) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const local = screenToMap(worldPoint.x, worldPoint.y);
      moveToTile({ x: local.x + this.worldOrigin.x, y: local.y + this.worldOrigin.y });
    });

    // Se pasa la escena (que ya tiene uiLayer) al MinimapSystem
    this.minimap = new MinimapSystem(this, {
      getPlayerTile: () => this.getPlayerAbsTile(),
      getEnemies: () => {
        const out: Array<{ x: number; y: number }> = [];
        this.faunaGroup.getChildren().forEach((child) => {
          const spr = child as Phaser.Physics.Arcade.Sprite;
          if (!spr.active) return;
          if (spr.getData('aquatic')) return;
          const m = screenToMap(spr.x, spr.y - CUBE_HEIGHT);
          out.push({ x: m.x + this.worldOrigin.x, y: m.y + this.worldOrigin.y });
        });
        return out;
      },
      getWaypoint: () => this.currentWaypoint,
      onMapClick: (tx, ty) => moveToTile({ x: tx, y: ty }),
    });
    this.scale.on('resize', () => this.minimap?.handleResize());

    const onPause = () => { 
      this.physics.pause(); 
      this.scene.pause(); 
    };
    const onResume = () => { 
      this.physics.resume(); 
      this.scene.resume(); 
    };

    const onDangerSignal = (pos: { x: number; y: number }) => {
      if (!this.player || !this.physics) return;
      const rel = { x: pos.x - this.worldOrigin.x, y: pos.y - this.worldOrigin.y };
      const angle = Math.random() * Math.PI * 2;
      const sx = rel.x + Math.cos(angle) * 6;
      const sy = rel.y + Math.sin(angle) * 6;
      const spr = this.faunaGroup.create(0, 0, 'tile_hierba') as Phaser.Physics.Arcade.Sprite;
      spr.setVisible(false);
      const entity = new BeastEntity(this, spr, `raid_${Date.now()}`, sx, sy);
      spr.setData('entity', entity);
    };
    EventBus.on('game:player-moved', onDangerSignal);

    this.events.once('shutdown', () => {
      EventBus.off('game:pause', onPause);
      EventBus.off('game:resume', onResume);
      EventBus.off('game:player-moved', onDangerSignal);
    });

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      const zoomSpeed = 0.001;
      let newZoom = this.cameras.main.zoom - (deltaY * zoomSpeed);
      newZoom = Phaser.Math.Clamp(newZoom, 0.8, 3.5);
      this.cameras.main.setZoom(newZoom);
      this.vignette.setScale(1 / newZoom);
    });
  }

  update(time: number): void {
    stepGeoBudget();
    if (this.minimap) this.minimap.update();
    this.player.update(time);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);
    this.lastPlayerTile = this.getPlayerAbsTile();
    this.syncOutpostsView();

    if (time - this.lastPosSave > 10_000) {
      this.lastPosSave = time;
      void usePlayerStore.getState().saveProgressToServer(this.lastPlayerTile);
    }

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

  private getPlayerAbsTile(): { x: number; y: number } {
    const m = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
    return { x: m.x + this.worldOrigin.x, y: m.y + this.worldOrigin.y };
  }

  private openPoiModal(op: WorldOutpost): void {
    const playerTile = this.getPlayerAbsTile();
    EventBus.emit('ui:open-modal', {
      poi: op,
      playerPos: playerTile,
      distanceTiles: distanceToOutpost(playerTile, op.pos),
    });
    EventBus.emit('game:pause');
  }

  private syncOutpostsView(): void {
    const R = 45;
    const px = this.lastPlayerTile.x;
    const py = this.lastPlayerTile.y;
    const outposts = getOutposts();

    for (const op of outposts) {
      const dx = op.pos.x - px;
      const dy = op.pos.y - py;
      const near = Math.abs(dx) <= R && Math.abs(dy) <= R;
      const rendered = this.renderedOutposts.has(op.id);

      if (near && !rendered) this.renderOutpost(op);
      else if (!near && rendered) this.removeOutpost(op.id);
    }

    this.checkArrival();
  }

  private renderOutpost(op: WorldOutpost): void {
    const rel = { x: op.pos.x - this.worldOrigin.x, y: op.pos.y - this.worldOrigin.y };
    const pos = mapToScreen(rel.x, rel.y);
    const flagKey =
      op.kind === 'sect' ? 'poi_flag_sect' :
      op.kind === 'landmark' ? 'poi_flag_landmark' : 'poi_flag_capital';

    const objs: Phaser.GameObjects.GameObject[] = [];

    const label = this.add.text(pos.x, pos.y - 44, op.name, {
      fontFamily: 'Cinzel, serif', fontSize: '11px', color: '#fde68a',
      backgroundColor: 'rgba(12,10,8,0.75)', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(pos.y + 40).setVisible(false);
    objs.push(label);

    const base = this.add.image(pos.x, pos.y + CUBE_HEIGHT, flagKey);
    base.setOrigin(0.35, 0.95);
    base.setDepth(pos.y + 2);
    base.setInteractive({ useHandCursor: true });
    base.on('pointerdown', () => this.openPoiModal(op));
    base.on('pointerover', () => label.setVisible(true));
    base.on('pointerout', () => label.setVisible(false));
    objs.push(base);

    const biome = getBiomeCached(op.pos.x, op.pos.y);
    const haloColor = biome === 'Desierto' ? 0xfcd34d : biome === 'Nieve' ? 0xe2e8f0 : 0xa3e635;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(haloColor, 0.22);
    g.fillCircle(16, 8, 16);
    g.generateTexture(`halo_${op.id}`, 32, 16);
    g.destroy();
    const halo = this.add.image(pos.x, pos.y + CUBE_HEIGHT, `halo_${op.id}`);
    halo.setDepth(pos.y + 1);
    objs.push(halo);

    this.outpostsLayer.add(objs);
    this.renderedOutposts.set(op.id, objs);
  }

  private removeOutpost(id: string): void {
    const objs = this.renderedOutposts.get(id);
    if (!objs) return;
    objs.forEach((o) => o.destroy());
    if (this.textures.exists(`halo_${id}`)) this.textures.remove(`halo_${id}`);
    this.renderedOutposts.delete(id);
  }

  private checkArrival(): void {
    if (!this.player || !this.minimap) return;
    const arrived = nearestOutpost(this.lastPlayerTile.x, this.lastPlayerTile.y);
    if (!arrived) return;
    if (this.arrivedCooldowns.has(arrived.id)) return;
    this.arrivedCooldowns.add(arrived.id);
    this.time.delayedCall(100, () => {
      const far = nearestOutpost(this.lastPlayerTile.x, this.lastPlayerTile.y, ARRIVAL_RADIUS * 2);
      if (!far || far.id !== arrived.id) this.arrivedCooldowns.delete(arrived.id);
    });
    this.openPoiModal(arrived);
  }
}