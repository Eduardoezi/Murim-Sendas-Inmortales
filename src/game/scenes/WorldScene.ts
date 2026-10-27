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
  // ── Minimapa ──────────────────────────────────────────────────────────────
  private minimap!: MinimapSystem;
  private worldOrigin = { x: 0, y: 0 };       // origen del mapa (Chang'an)
  private currentWaypoint: { x: number; y: number } | null = null;
  // ── Puestos de interés (worldRegistry) en coords ABSOLUTAS del mapa ──────
  private outpostsLayer!: Phaser.GameObjects.Container;
  private renderedOutposts = new Map<string, Phaser.GameObjects.GameObject[]>();
  private lastPlayerTile = { x: 0, y: 0 };    // tile absoluto actual (para arrival)
  private lastPosSave = 0;                     // throttle de guardado de posicion
  private arrivedCooldowns = new Set<string>(); // no re-abrir el modal cada frame

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

  /** Roca de montaña: rombo escalonado (más alto que un tile normal). */
  private createMountainTexture() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // cuerpo rocoso
    g.fillStyle(0x6b7280, 1);
    g.beginPath(); g.moveTo(32, 4); g.lineTo(60, 26); g.lineTo(32, 44); g.lineTo(4, 26); g.closePath(); g.fillPath();
    g.fillStyle(0x4b5563, 1);
    g.beginPath(); g.moveTo(4, 26); g.lineTo(32, 44); g.lineTo(32, 52); g.lineTo(4, 34); g.closePath(); g.fillPath();
    g.fillStyle(0x374151, 1);
    g.beginPath(); g.moveTo(60, 26); g.lineTo(32, 44); g.lineTo(32, 52); g.lineTo(60, 34); g.closePath(); g.fillPath();
    // pico nevado
    g.fillStyle(0xf1f5f9, 1);
    g.beginPath(); g.moveTo(32, 4); g.lineTo(42, 16); g.lineTo(32, 22); g.lineTo(22, 16); g.closePath(); g.fillPath();
    g.generateTexture('tile_montana', 64, 52 + CUBE_HEIGHT);
    g.destroy();
  }

  /** Junco/pantano: base verde oscuro con cañas. */
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

  /** Postes de POI: banderín sobre base de madera, dibujado por bioma real. */
  private createPoiTextures() {
    const mk = (key: string, flag: number) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x5c4033, 1); g.fillRect(14, 8, 4, 40);            // poste
      g.fillStyle(flag, 1);                                             // banderín
      g.beginPath(); g.moveTo(18, 8); g.lineTo(44, 14); g.lineTo(18, 24); g.closePath(); g.fillPath();
      g.fillStyle(0xfbbf24, 1); g.fillCircle(16, 6, 3);                // perilla dorada
      g.generateTexture(key, 48, 52);
      g.destroy();
    };
    mk('poi_flag_capital', 0xd97706);   // ámbar: capitales/aldeas
    mk('poi_flag_sect', 0x0ea5e9);      // cian: sectas
    mk('poi_flag_landmark', 0xa855f7);  // violeta: hitos naturales
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
    this.createMountainTexture();
    this.createSwampTexture();
    
    this.createTrees();
    this.createBeastTextures();
    this.createPoiTextures();
  }

  create() {
    this.createVignette();
    this.cameras.main.setBackgroundColor('#0f172a'); // Fondo oscuro para la niebla

    // ── Origen del mundo: el jugador aparece en CHANG'AN (capital de Shaanxi),
    // ahora anclada a su posición geográfica real proyectada al mapa 1000x1000.
    const shaanxi = INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') as Province || INITIAL_PROVINCES[0];
    this.province = shaanxi;
    const changan = (shaanxi as any).coords ?? { x: 580, y: 334 };

    // Spawn REAL: si hay una posicion absoluta persistida (BD -> espejo local
    // que salva usePlayerStore.saveProgressToServer), el jugador reaparece
    // donde termino su ultima sesion; si no, junto a Chang'an.
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

    // Origen de chunks/minimapa derivado del spawn real (coords absolutas del mapa 1000x1000)
    this.worldOrigin = { x: absSpawn.x - 8, y: absSpawn.y - 8 };

    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group();

    // Posicion inicial RELATIVA al origen (chunk 0,0 alrededor del spawn)
    const startMapX = absSpawn.x - this.worldOrigin.x;
    const startMapY = absSpawn.y - this.worldOrigin.y;

    const worldX = this.worldOrigin.x + startMapX;
    const worldY = this.worldOrigin.y + startMapY;
    const startPos = mapToScreen(worldX, worldY);
    
    // Inicializar Entidades y Managers
    this.player = new PlayerEntity(this, startPos.x, startPos.y + CUBE_HEIGHT);
    this.chunkManager = new ChunkManager(this, this.province, this.treeGroup, this.faunaGroup);

    // ── Capa de puntos de interés (worldRegistry → render real en el mundo) ──
    this.outpostsLayer = this.add.container(0, 0);

    // Colisiones
    this.physics.add.collider(this.player.sprite, this.treeGroup);
    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    // Cámara
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);

    // ── Movimiento por destino: unificado para click-en-mundo y click-en-minimapa.
    // `tile` está en coordenadas ABSOLUTAS del mapa (el minimapa las usa porque
    // los POIs/capitales viven en el plano 1000x1000; el mundo render relativo al origen).
    const moveToTile = (tile: { x: number; y: number }) => {
      if (this.player.isMoving) return;

      const localTarget = { x: tile.x - this.worldOrigin.x, y: tile.y - this.worldOrigin.y };
      const tileKey = `${localTarget.x},${localTarget.y}`;

      // Bloquear clic en agua o árboles cargados (O(1)); fuera de chunk confiamos en geoSampler
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
          // Al terminar de caminar, comprobar llegada a un puesto real del registro
          this.checkArrival();
        });
      }
    };


    // Input: Click to Move sobre el mundo
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Si el click cae sobre el minimapa o sobre un banderín, no mover
      if (this.minimap && this.minimap.isPointerOver(pointer.x, pointer.y)) return;
      if (this.input.hitTestPointer(pointer).some((go: any) => go !== this.player.sprite && go instanceof Phaser.GameObjects.Image && String(go.texture.key).startsWith('poi_flag_'))) return;
      if (this.player.isMoving) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const local = screenToMap(worldPoint.x, worldPoint.y);
      moveToTile({ x: local.x + this.worldOrigin.x, y: local.y + this.worldOrigin.y });
    });

    // ── Minimapa: radar + click-to-move + zoom con rueda sobre el widget ──
    this.minimap = new MinimapSystem(this, {
      getPlayerTile: () => this.getPlayerAbsTile(),
      getEnemies: () => {
        const out: Array<{ x: number; y: number }> = [];
        this.faunaGroup.getChildren().forEach((child) => {
          const spr = child as Phaser.Physics.Arcade.Sprite;
          if (!spr.active) return;
          // Solo terrestres: los acuáticos (serpientes de río) no son amenaza radar
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

    // ── game:pause / game:resume desde React (AdminPage abre modales) ──
    const onPause = () => { this.physics.pause(); this.events.pause(); };
    const onResume = () => { this.physics.resume(); this.events.resume(); };
    EventBus.on('game:pause', onPause);
    EventBus.on('game:resume', onResume);

    // ── Señal de interrupcion/peligro desde la meditación (React) ──
    // Se materializa en el mundo REAL: un lobo surge a 6 tiles del jugador.
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

    // Input: Zoom con la Rueda
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number, deltaZ: number) => {
      const zoomSpeed = 0.001;
      let newZoom = this.cameras.main.zoom - (deltaY * zoomSpeed);
      
      newZoom = Phaser.Math.Clamp(newZoom, 0.8, 2.5);
      
      this.cameras.main.setZoom(newZoom);
      this.vignette.setScale(1 / newZoom); // La niebla cubre la pantalla
    });
  }

  update(time: number): void {
    // 0. Caché de terreno: resolver misses pendientes con presupuesto de 2.5 ms
    //    por frame (evita congelar el hilo principal).
    stepGeoBudget();

  // 0b. Minimapa (O(1): blit solo al cruzar tile + iconos baratos)
  if (this.minimap) this.minimap.update();

  // 1. Jugador
  this.player.update(time);

  // 2. Chunks (cargar/descargar)
  this.chunkManager.update(this.player.sprite.x, this.player.sprite.y);

  // 2b. Puestos de interés: render por proximidad + detección de llegada
  this.lastPlayerTile = this.getPlayerAbsTile();
  this.syncOutpostsView();

  // Persistencia periodica de la posicion del mundo en la BD (cada ~10s).
  // La pantalla del reino y el spawn leen x/y reales al volver a entrar.
  if (time - this.lastPosSave > 10_000) {
    this.lastPosSave = time;
    void usePlayerStore.getState().saveProgressToServer(this.lastPlayerTile);
  }

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

  // ── API interna del mundo (datos reales, no hardcodeados) ────────────────

  /** Tile ABSOLUTO actual del jugador en el plano 1000x1000. */
  private getPlayerAbsTile(): { x: number; y: number } {
    const m = screenToMap(this.player.sprite.x, this.player.sprite.y - CUBE_HEIGHT);
    return { x: m.x + this.worldOrigin.x, y: m.y + this.worldOrigin.y };
  }

  /** Clic sobre banderín o llegada → modal React con datos REALES del registry. */
  private openPoiModal(op: WorldOutpost): void {
    const playerTile = this.getPlayerAbsTile();
    // El modal de React consume el puesto REAL del registry: nombre, tipo,
    // provincia y lore provienen de geoChina/provinces, no de literales UI.
    EventBus.emit('ui:open-modal', {
      poi: op,
      playerPos: playerTile,
      distanceTiles: distanceToOutpost(playerTile, op.pos),
    });
    EventBus.emit('game:pause');
  }

  /**
   * Renderiza banderines SOLO para los puestos dentro de ~45 tiles del jugador
   * (los demás se descartan rápido con bbox cuadrado). Cada banderín es clickeable
   * y abre el modal con datos del registry. Se re-evalúa cada frame pero es O(n·k)
   * diminuto (n≈90 POIs, k comparaciones) y sin allocations salvo cambios.
   */
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

    // Llegada automática a un puesto (cooldown por id para no spam)
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

    // halo suave de "asentamiento" según bioma real del solar
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

  /** Si el jugador está dentro del radio de un puesto → abrir modal (con cooldown). */
  private checkArrival(): void {
    if (!this.player || !this.minimap) return; // aún no creado el mundo
    const arrived = nearestOutpost(this.lastPlayerTile.x, this.lastPlayerTile.y);
    if (!arrived) return;
    if (this.arrivedCooldowns.has(arrived.id)) return;
    this.arrivedCooldowns.add(arrived.id);
    // el cooldown se libera cuando el jugador se aleja el doble del radio
    this.time.delayedCall(100, () => {
      const far = nearestOutpost(this.lastPlayerTile.x, this.lastPlayerTile.y, ARRIVAL_RADIUS * 2);
      if (!far || far.id !== arrived.id) this.arrivedCooldowns.delete(arrived.id);
    });
    this.openPoiModal(arrived);
  }
}