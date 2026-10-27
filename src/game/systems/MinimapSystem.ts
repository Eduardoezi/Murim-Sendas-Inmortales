// src/game/systems/MinimapSystem.ts
// ─────────────────────────────────────────────────────────────────────────────
// Minimapa 2D modular para WorldScene (Phaser).
//
// Arquitectura (3 capas desacopladas):
//   1) RadarTimer  — escaneo de fauna cada `scanIntervalMs` (NO cada frame).
//   2) TerrainLayer— canvas de terreno re-cortado por tile cuando el jugador
//                    cruza una celda; O(1) por frame en movimiento normal.
//   3) IconsLayer  — Graphics barato por frame: jugador, enemigos, POIs y
//                    waypoint, con máscara circular/cuadrada y "pinning" al
//                    borde para objetivos fuera de rango.
//
// Click sobre el minimapa → callback onMapClick(tileX, tileY) para que la
// escena haga su click-to-move habitual (findPath + walkPath).
// ─────────────────────────────────────────────────────────────────────────────

import Phaser from 'phaser';
import { MinimapConfig, MINIMAP_DEFAULTS } from '../config/minimapConfig';
import { isImpassableGeo } from '../../core/data/world/generators/geoSampler';
import { getBiomeCached, preloadGeoRowsAsync, preloadGeoWindow, sampleGeoCached } from '../../core/data/world/generators/geoTileCache';
import { GeoPoi, getWorldPois } from '../../core/data/world/geoPois';
import { WORLD_SEED } from '../../core/data/world/seeds/worldSeed';

export interface MinimapOptions {
  config?: Partial<MinimapConfig>;
  /** Jugador en COORDENADAS DE MAPA (tile), no de pantalla. */
  getPlayerTile: () => { x: number; y: number };
  /** Enemigos visibles (fauna cargada) en coords de mapa. Llamado por el radar. */
  getEnemies: () => Array<{ x: number; y: number }>;
  /** Destino activo del click-to-move (coords de mapa) o null. */
  getWaypoint?: () => { x: number; y: number } | null;
  /** Se invoca al hacer click dentro del minimapa (para mover al jugador). */
  onMapClick?: (tileX: number, tileY: number) => void;
  poiFilter?: (poi: GeoPoi) => boolean;
}

interface EnemyBlip { x: number; y: number }

const GRID = WORLD_SEED.gridSize; // { width: 1000, height: 1000 }

export class MinimapSystem {
  private scene: Phaser.Scene;
  private cfg: MinimapConfig;
  private opts: MinimapOptions;

  // Contenedor UI (fixed: vive en pantalla, no en el mundo)
  private container!: Phaser.GameObjects.Container;
  private terrainCanvas!: Phaser.GameObjects.Image;
  private icons!: Phaser.GameObjects.Graphics;
  private frameGfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private maskGfx!: Phaser.GameObjects.Graphics; // máscara compartida, se repinta al hacer zoom

  // Terreno cacheado en canvas 2D (mundo completo, 1 px por tile)
  private worldCanvas: HTMLCanvasElement | null = null;
  private worldCtx: CanvasRenderingContext2D | null = null;
  private terrainDirty = true;       // primera pasada completa
  private terrainLoadStarted = false;
  private lastPlayerTile = { x: NaN, y: NaN };
  private dirtyRects: Array<{ x: number; y: number }> = []; // tiles pendientes

  // Estado del radar
  private enemies: EnemyBlip[] = [];
  private pois: GeoPoi[] = [];

  // Geometría derivada (recalculada si cambia zoom/tamaño)
  private cx = 0; private cy = 0;      // centro del minimapa en pantalla
  private radiusPx = 0;                 // radio/medio lado en px
  private scale = 1;                    // px por tile

  private scanTimer?: Phaser.Time.TimerEvent;
  private wheelHandler?: (p: Phaser.Input.Pointer, go: any, dx: number, dy: number, dz: number) => void;
  private destroyed = false;

  constructor(scene: Phaser.Scene, opts: MinimapOptions) {
    this.scene = scene;
    this.opts = opts;
    this.cfg = { ...MINIMAP_DEFAULTS, ...(opts.config ?? {}), colors: { ...MINIMAP_DEFAULTS.colors, ...(opts.config?.colors ?? {}) } };
    this.pois = getWorldPois().filter(opts.poiFilter ?? (() => true));
    
    this.buildUI();
    this.startRadar();
    this.bindInput();
    this.relayout();
    
    // FIX: Forzar un re-layout un segundo después por si el canvas no tenía tamaño al inicio
    this.scene.time.delayedCall(100, () => this.relayout());
  }

  // ── API pública ────────────────────────────────────────────────────────────

  public update(): void {
    if (this.destroyed) return;
    const p = this.opts.getPlayerTile();
    this.refreshTerrainAround(p);
    this.renderIcons(p);
  }

  public setViewRadius(tiles: number): void {
    const v = Phaser.Math.Clamp(Math.round(tiles), this.cfg.viewRadiusMinTiles, this.cfg.viewRadiusMaxTiles);
    if (v === this.cfg.viewRadiusTiles) return;
    this.cfg.viewRadiusTiles = v;
    this.relayout();
    this.blitCrop();
  }

  public getViewRadius(): number { return this.cfg.viewRadiusTiles; }
  public setVisible(v: boolean): void { this.container.setVisible(v); }

  public isPointerOver(px: number, py: number): boolean {
    return this.container.getBounds().contains(px, py);
  }

  public destroy(): void {
    this.destroyed = true;
    this.scanTimer?.remove();
    if (this.wheelHandler) this.scene.input.off('wheel', this.wheelHandler);
    this.container.destroy();
  }

  // ── Construcción de la UI ──────────────────────────────────────────────────

  private buildUI(): void {
    const { sizePx, colors } = this.cfg;

    this.worldCanvas = document.createElement('canvas');
    this.worldCanvas.width = GRID.width;
    this.worldCanvas.height = GRID.height;
    this.worldCtx = this.worldCanvas.getContext('2d');

    if (!this.scene.textures.exists('__minimap_px')) {
      const pg = this.scene.make.graphics({ x: 0, y: 0 }, false);
      pg.fillStyle(0xffffff, 1).fillRect(0, 0, 1, 1);
      pg.generateTexture('__minimap_px', 1, 1);
      pg.destroy();
    }

    this.terrainCanvas = this.scene.add.image(0, 0, '__minimap_px')
      .setOrigin(0, 0)
      .setDisplaySize(sizePx, sizePx);

    this.icons = this.scene.add.graphics();
    this.frameGfx = this.scene.add.graphics();
    this.label = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#e2e8f0', backgroundColor: '#0b1120cc', padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 0).setVisible(false);

    // FIX DE LA MÁSCARA: Usar this.scene.add.graphics() y setVisible(false) 
    // para asegurar que Phaser actualice sus transformaciones.
    this.maskGfx = this.scene.add.graphics().setVisible(false);
    this.redrawMask();
    this.terrainCanvas.setMask(this.maskGfx.createGeometryMask());
    this.icons.setMask(this.maskGfx.createGeometryMask());

    this.container = this.scene.add.container(0, 0, [this.terrainCanvas, this.icons, this.frameGfx, this.label]);
    this.container.setScrollFactor(0).setDepth(10001); // Por encima de la niebla
    this.container.setSize(sizePx, sizePx);
    this.updateHitArea();

    this.container.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      const local = new Phaser.Geom.Point(ptr.x - this.container.x, ptr.y - this.container.y);
      const near = this.nearestPoiToLocal(local.x, local.y, 10);
      if (near) {
        this.label.setText(near.name).setPosition(local.x, local.y + 12).setVisible(true);
      } else this.label.setVisible(false);
    });
    this.container.on('pointerout', () => this.label.setVisible(false));
  }

  private redrawMask(): void {
    const s = this.cfg.sizePx;
    this.maskGfx.clear();
    this.maskGfx.fillStyle(0xffffff, 1);
    if (this.cfg.shape === 'circle') this.maskGfx.fillCircle(s / 2, s / 2, s / 2 - 1);
    else this.maskGfx.fillRect(0, 0, s - 2, s - 2);
  }

  private updateHitArea(): void {
    const s = this.cfg.sizePx;
    if (this.cfg.shape === 'circle') {
      this.container.setInteractive(new Phaser.Geom.Circle(s / 2, s / 2, s / 2), Phaser.Geom.Circle.Contains);
    } else {
      this.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, s, s), Phaser.Geom.Rectangle.Contains);
    }
  }

  private drawFrame(): void {
    const { sizePx, colors, shape } = this.cfg;
    const g = this.frameGfx;
    g.clear();
    
    // Fondo oscuro para que no sea transparente
    g.fillStyle(colors.background, 0.9);
    g.fillCircle(sizePx / 2, sizePx / 2, sizePx / 2);

    g.lineStyle(2, colors.border, 1);
    if (shape === 'circle') g.strokeCircle(sizePx / 2, sizePx / 2, sizePx / 2 - 1);
    else g.strokeRect(1, 1, sizePx - 2, sizePx - 2);
    
    g.fillStyle(colors.border, 1);
    g.fillTriangle(sizePx / 2, 6, sizePx / 2 - 4, 14, sizePx / 2 + 4, 14);
  }

  private relayout(): void {
    const { sizePx, marginPx } = this.cfg;
    const cam = this.scene.cameras.main;
    
    // Usar el tamaño de la cámara o el canvas (el que sea mayor que 0)
    const w = cam.width > 0 ? cam.width : this.scene.scale.width;
    const h = cam.height > 0 ? cam.height : this.scene.scale.height;

    const half = sizePx / 2; 
    this.cx = half; 
    this.cy = half;
    this.radiusPx = this.cfg.shape === 'circle' ? half - 2 : half - 1;
    this.scale = this.radiusPx / this.cfg.viewRadiusTiles;

    // Posicionar en la esquina inferior derecha
    this.container.setPosition(w - sizePx - marginPx, h - sizePx - marginPx);
    
    // Mover la máscara junto con el contenedor
    this.maskGfx.setPosition(this.container.x, this.container.y);

    if (!this.terrainDirty && this.cropTex) this.blitCrop();
    this.drawFrame();
  }

  public handleResize(): void { this.relayout(); }

  // ── Capa 1: Radar ──────────────────────────────────────────────────────────

  private startRadar(): void {
    this.scanTimer = this.scene.time.addEvent({
      delay: this.cfg.scanIntervalMs,
      loop: true,
      callback: () => { this.enemies = this.opts.getEnemies(); },
    });
    this.enemies = this.opts.getEnemies();
  }

  // ── Capa 2: Terreno ────────────────────────────────────────────────────────

  private refreshTerrainAround(p: { x: number; y: number }): void {
    if (!this.worldCtx || !this.worldCanvas) return;

    if (this.terrainDirty) {
      if (!this.terrainLoadStarted) {
        this.terrainLoadStarted = true;
        this.redrawFullTerrainCache();
      }
      return;
    }

    const px = Math.floor(p.x), py = Math.floor(p.y);
    if (px !== this.lastPlayerTile.x || py !== this.lastPlayerTile.y) {
      this.lastPlayerTile = { x: px, y: py };
      this.blitCrop();
    } else {
      const dx = p.x - this.blittedCenter.x, dy = p.y - this.blittedCenter.y;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) this.blitCrop();
    }
  }

  private cropCanvas: HTMLCanvasElement | null = null;
  private cropTex: Phaser.Textures.CanvasTexture | null = null;
  private blittedCenter = { x: NaN, y: NaN };

  private blitCrop(): void {
    if (!this.worldCanvas) return;
    const p = this.opts.getPlayerTile();
    const w = this.viewW();
    const rx = Phaser.Math.Clamp(p.x - w / 2, 0, Math.max(0, GRID.width - w));
    const ry = Phaser.Math.Clamp(p.y - w / 2, 0, Math.max(0, GRID.height - w));

    if (!this.cropCanvas) {
      this.cropCanvas = document.createElement('canvas');
      this.cropCanvas.width = this.cfg.sizePx;
      this.cropCanvas.height = this.cfg.sizePx;
    }
    const ctx = this.cropCanvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.cfg.sizePx, this.cfg.sizePx);
    ctx.drawImage(this.worldCanvas, rx, ry, w, w, 0, 0, this.cfg.sizePx, this.cfg.sizePx);

    if (!this.cropTex) {
      const key = '__minimap_view';
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.cropTex = this.scene.textures.addCanvas(key, this.cropCanvas) as Phaser.Textures.CanvasTexture;
      this.terrainCanvas.setTexture(this.cropTex.key).setDisplaySize(this.cfg.sizePx, this.cfg.sizePx);
    } else {
      this.cropTex.refresh();
    }
    this.blittedCenter = { x: p.x, y: p.y };
  }

  private redrawFullTerrainCache(): void {
    if (!this.worldCtx) return;
    this.terrainDirty = true;
    this.worldCtx.fillStyle = '#0b1120';
    this.worldCtx.fillRect(0, 0, GRID.width, GRID.height);

    const playerRow = Math.floor(this.opts.getPlayerTile().y);
    const pp = this.opts.getPlayerTile();
    preloadGeoWindow(pp.x, pp.y, 96);
    const ROWS_PER_SLICE = 40;
    preloadGeoRowsAsync(
      ROWS_PER_SLICE,
      (_y0, _y1) => {
        if (this.destroyed) return;
        this.paintRegion(0, GRID.width - 1, _y0, _y1);
        if (!this.cropTex && _y0 <= playerRow && playerRow <= _y1) {
          this.blitCrop();
        } else if (this.cropTex) {
          this.cropTex.refresh();
        }
      },
      () => {
        if (this.destroyed) return;
        this.terrainDirty = false;
        const p = this.opts.getPlayerTile();
        this.lastPlayerTile = { x: Math.floor(p.x), y: Math.floor(p.y) };
        this.blitCrop();
      },
    );
  }

  private viewW(): number {
    return Math.min(GRID.width, this.cfg.sizePx / this.scale);
  }

  private paintRegion(x0: number, x1: number, y0: number, y1: number): void {
    const ctx = this.worldCtx;
    if (!ctx) return;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const biome = getBiomeCached(tx, ty);
        let c: string;
        if (biome === 'Agua') {
          c = this.waterShadeCached(tx, ty);
        } else {
          c = this.biomeShade(biome);
        }
        ctx.fillStyle = c;
        ctx.fillRect(tx, ty, 1, 1);
      }
    }
  }

  private waterShadeCached(tx: number, ty: number): string {
    const g = sampleGeoCached(tx, ty).kind;
    if (g === 'canal') return '#38bdf8';
    if (g === 'mar') return '#1e40af';
    return '#2563eb';
  }

  private biomeShade(b: string): string {
    switch (b) {
      case 'Bosque': return '#14532d';
      case 'Montaña': return '#44403c';
      case 'Desierto': return '#a16207';
      case 'Pantano': return '#3f6212';
      case 'Nieve': return '#e2e8f0';
      case 'Costa': return '#0e7490';
      default: return '#3f5f3a';
    }
  }

  // ── Capa 3: Iconos ─────────────────────────────────────────────────────────

  private renderIcons(player: { x: number; y: number }): void {
    const g = this.icons;
    const { colors } = this.cfg;
    g.clear();

    const toLocal = (wx: number, wy: number) => ({
      lx: this.cx + (wx - player.x) * this.scale,
      ly: this.cy + (wy - player.y) * this.scale,
    });

    g.fillStyle(colors.player, 1).fillCircle(this.cx, this.cy, 3);
    g.lineStyle(1, colors.enemy, 0.8).strokeCircle(this.cx, this.cy, 5);

    const wp = this.opts.getWaypoint?.();
    if (wp) this.drawPinnedBlip(g, toLocal(wp.x, wp.y), 3, colors.waypoint, true);

    for (const poi of this.pois) {
      this.drawPinnedBlip(g, toLocal(poi.pos.x, poi.pos.y), poi.kind === 'capital' ? 3 : 2.4, colors.objective, poi.kind === 'capital');
    }

    for (const e of this.enemies) {
      const { lx, ly } = toLocal(e.x, e.y);
      if (this.insideShape(lx, ly)) g.fillStyle(colors.enemy, 1).fillCircle(lx, ly, 2);
    }
  }

  private drawPinnedBlip(
    g: Phaser.GameObjects.Graphics,
    pt: { lx: number; ly: number },
    size: number,
    color: number,
    ring: boolean,
  ): void {
    const { lx, ly } = pt;
    if (this.insideShape(lx, ly)) {
      g.fillStyle(color, 1).fillCircle(lx, ly, size);
      if (ring) g.lineStyle(1, 0xffffff, 0.5).strokeCircle(lx, ly, size + 2);
      return;
    }
    const dx = lx - this.cx, dy = ly - this.cy;
    let t: number;
    if (this.cfg.shape === 'circle') {
      const len = Math.hypot(dx, dy) || 1;
      t = (this.radiusPx - size - 2) / len;
    } else {
      const m = this.radiusPx - size - 2;
      t = Math.min(m / (Math.abs(dx) || 1e-6), m / (Math.abs(dy) || 1e-6));
    }
    const bx = this.cx + dx * t, by = this.cy + dy * t;
    g.fillStyle(color, 0.9).fillTriangle(
      bx, by,
      bx - size, by - size * 1.6,
      bx + size, by - size * 1.6,
    );
  }

  private insideShape(lx: number, ly: number): boolean {
    if (this.cfg.shape === 'circle') return Math.hypot(lx - this.cx, ly - this.cy) <= this.radiusPx;
    return Math.abs(lx - this.cx) <= this.radiusPx && Math.abs(ly - this.cy) <= this.radiusPx;
  }

  private nearestPoiToLocal(lx: number, ly: number, maxDist: number): GeoPoi | null {
    const p = this.opts.getPlayerTile();
    let best: GeoPoi | null = null; let bestD = maxDist;
    for (const poi of this.pois) {
      const wx = this.cx + (poi.pos.x - p.x) * this.scale;
      const wy = this.cy + (poi.pos.y - p.y) * this.scale;
      const d = Math.hypot(wx - lx, wy - ly);
      if (d < bestD) { bestD = d; best = poi; }
    }
    return best;
  }

  private bindInput(): void {
    this.container.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!this.opts.onMapClick) return;
      const p = this.opts.getPlayerTile();
      const tileX = Math.round(p.x + (ptr.x - this.container.x - this.cx) / this.scale);
      const tileY = Math.round(p.y + (ptr.y - this.container.y - this.cy) / this.scale);
      if (tileX < 0 || tileY < 0 || tileX >= GRID.width || tileY >= GRID.height) return;
      if (isImpassableGeo(sampleGeoCached(tileX, tileY))) return;
      this.opts.onMapClick(tileX, tileY);
    });

    this.wheelHandler = (ptr, _go, _dx, dy) => {
      if (!this.container.getBounds().contains(ptr.x, ptr.y)) return;
      const dir = dy > 0 ? 1 : -1;
      this.setViewRadius(this.cfg.viewRadiusTiles + dir * 8);
    };
    this.scene.input.on('wheel', this.wheelHandler);
  }
}