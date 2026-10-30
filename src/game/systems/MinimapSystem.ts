// src/game/systems/MinimapSystem.ts
// ─────────────────────────────────────────────────────────────────────────────
// Radar isométrico. Su espacio es la pantalla del mundo dividida por Z (píxeles
// de mundo por píxel de radar), así que terreno, blips y rectángulo de cámara
// se ven orientados EXACTAMENTE igual que en pantalla. Vive en HudScene, con
// cámara propia sin follow ni zoom: por eso el zoom del mundo ya no lo mueve.
//
// El terreno viene de MapDiscovery (solo lo explorado). El clic se invierte por
// la misma proyección iso: px de radar → px de mundo → tesela real del mundo.
// ─────────────────────────────────────────────────────────────────────────────
import Phaser from 'phaser';
import { MINIMAP_DEFAULTS, MinimapConfig } from '../config/minimapConfig';
import { GeoPoi, getWorldPois } from '../../core/data/world/geoPois';
import { WORLD_SEED } from '../../core/data/world/seeds/worldSeed';
import {
  ISO_HALF_H,
  ISO_HALF_W,
  ISO_TILE_STEP_PX,
  isoPxToTile,
  isoTileToPx,
} from '../utils/isoProjection';
import { MapDiscovery } from './MapDiscovery';
import { HudDataSource } from './HudDataSource';

const GRID = WORLD_SEED.gridSize;
const VIEW_KEY = '__minimap_view';

export interface MinimapOptions {
  config?: Partial<MinimapConfig>;
  world: HudDataSource;
  discovery: MapDiscovery;
  /** Profundidad dentro de HudScene: el orden del HUD se decide en la escena. */
  depth?: number;
}

interface EnemyBlip { x: number; y: number }

export class MinimapSystem {
  private scene: Phaser.Scene;
  private cfg: MinimapConfig;
  private world: HudDataSource;
  private discovery: MapDiscovery;
  private depth?: number;

  private container!: Phaser.GameObjects.Container;
  private bgGfx!: Phaser.GameObjects.Graphics;
  private terrain!: Phaser.GameObjects.Image;
  private icons!: Phaser.GameObjects.Graphics;
  private frameGfx!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  private viewCanvas: HTMLCanvasElement | null = null;
  private viewCtx: CanvasRenderingContext2D | null = null;
  private viewTex: Phaser.Textures.CanvasTexture | null = null;
  private lodCanvas: HTMLCanvasElement | null = null;
  private lodCtx: CanvasRenderingContext2D | null = null;

  private enemies: EnemyBlip[] = [];
  private pois: GeoPoi[] = [];

  private cx = 0; private cy = 0;
  private radiusPx = 0;
  /** Píxeles de pantalla del mundo por cada píxel de radar. */
  private z = 1;
  /** Píxeles de radar que ocupa un paso de tesela a lo largo de un eje. */
  private stepPx = 1;

  private blittedCenter = { x: NaN, y: NaN };
  private lastViewRect = { left: NaN, top: NaN, right: NaN, bottom: NaN };

  private scanTimer?: Phaser.Time.TimerEvent;
  private wheelHandler?: (p: Phaser.Input.Pointer, go: any, dx: number, dy: number, dz: number) => void;
  private keyHandler?: (e: KeyboardEvent) => void;
  private destroyed = false;

  constructor(scene: Phaser.Scene, opts: MinimapOptions) {
    this.scene = scene;
    this.world = opts.world;
    this.discovery = opts.discovery;
    this.depth = opts.depth;
    this.cfg = {
      ...MINIMAP_DEFAULTS,
      ...(opts.config ?? {}),
      colors: { ...MINIMAP_DEFAULTS.colors, ...(opts.config?.colors ?? {}) },
    };
    this.pois = getWorldPois();
    this.buildUI();
    this.applyGeometry();
    this.startRadar();
    this.bindInput();
    this.relayout();

    // El contenedor de React puede tardar en montarse: reubicar una vez montado.
    this.scene.time.delayedCall(100, () => this.relayout());
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  public update(): void {
    if (this.destroyed) return;
    const p = this.world.getPlayerTile();
    if (this.needsBlit(p)) this.blitTerrain(p);
    this.renderIcons(p);
  }

  public setViewRadius(tiles: number): void {
    const v = Phaser.Math.Clamp(Math.round(tiles), this.cfg.viewRadiusMinTiles, this.cfg.viewRadiusMaxTiles);
    if (v === this.cfg.viewRadiusTiles) return;
    this.cfg.viewRadiusTiles = v;
    this.applyGeometry();
    this.blitTerrain(this.world.getPlayerTile());
  }

  public getViewRadius(): number { return this.cfg.viewRadiusTiles; }
  public setVisible(v: boolean): void { this.container.setVisible(v); }
  public toggleVisible(): void { this.container.setVisible(!this.container.visible); }

  /** ¿El puntero (px de pantalla) está sobre el radar? Es el mismo test que la
   *  hit-area de Phaser: la cámara del HUD no tiene scroll ni zoom, así que no
   *  pueden desincronizarse como pasaba dentro de la cámara del mundo. */
  public isPointerOver(px: number, py: number): boolean {
    return this.insideShape(px - this.container.x, py - this.container.y);
  }

  public handleResize(): void { this.relayout(); }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.scanTimer?.remove();
    if (this.wheelHandler) this.scene.input.off('wheel', this.wheelHandler);
    if (this.keyHandler) this.scene.input.keyboard?.off('keydown', this.keyHandler);
    if (this.viewTex && this.scene.textures.exists(this.viewTex.key)) {
      this.scene.textures.remove(this.viewTex.key);
    }
    this.container.destroy();
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  private buildUI(): void {
    const { sizePx } = this.cfg;

    this.viewCanvas = document.createElement('canvas');
    this.viewCanvas.width = sizePx;
    this.viewCanvas.height = sizePx;
    this.viewCtx = this.viewCanvas.getContext('2d');

    if (this.scene.textures.exists(VIEW_KEY)) this.scene.textures.remove(VIEW_KEY);
    this.viewTex = this.scene.textures.addCanvas(VIEW_KEY, this.viewCanvas) as Phaser.Textures.CanvasTexture;

    this.terrain = this.scene.add.image(0, 0, VIEW_KEY).setOrigin(0, 0).setDisplaySize(sizePx, sizePx);
    this.bgGfx = this.scene.add.graphics();
    this.icons = this.scene.add.graphics();
    this.frameGfx = this.scene.add.graphics();
    this.label = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ddd8c8',
      backgroundColor: '#05070bcc', padding: { x: 4, y: 1 },
    }).setOrigin(0.5, 0).setVisible(false);

    this.container = this.scene.add.container(0, 0, [this.bgGfx, this.terrain, this.icons, this.frameGfx, this.label]);
    if (this.depth !== undefined) this.container.setDepth(this.depth);
    this.container.setSize(sizePx, sizePx);
    this.updateHitArea();

    this.container.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      const local = { x: ptr.x - this.container.x, y: ptr.y - this.container.y };
      const near = this.nearestPoiToLocal(local.x, local.y);
      if (near) this.label.setText(near.name).setPosition(local.x, local.y + 12).setVisible(true);
      else this.label.setVisible(false);
    });
    this.container.on('pointerout', () => this.label.setVisible(false));
  }

  private updateHitArea(): void {
    const s = this.cfg.sizePx;
    if (this.cfg.shape === 'circle') {
      this.container.setInteractive(new Phaser.Geom.Circle(s / 2, s / 2, s / 2), Phaser.Geom.Circle.Contains);
    } else if (this.cfg.shape === 'diamond') {
      this.container.setInteractive(
        new Phaser.Geom.Polygon([
          new Phaser.Geom.Point(s / 2, 0), new Phaser.Geom.Point(s, s / 2),
          new Phaser.Geom.Point(s / 2, s), new Phaser.Geom.Point(0, s / 2),
        ]),
        Phaser.Geom.Polygon.Contains,
      );
    } else {
      this.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, s, s), Phaser.Geom.Rectangle.Contains);
    }
  }

  private applyGeometry(): void {
    const half = this.cfg.sizePx / 2;
    this.cx = half;
    this.cy = half;
    this.radiusPx = this.cfg.shape === 'circle' ? half - 2 : half - 1;
    this.z = (this.cfg.viewRadiusTiles * ISO_TILE_STEP_PX) / this.radiusPx;
    this.stepPx = ISO_TILE_STEP_PX / this.z;
  }

  private relayout(): void {
    const { sizePx, marginPx } = this.cfg;
    this.applyGeometry();

    this.container.setPosition(
      this.scene.scale.width - sizePx - marginPx,
      this.scene.scale.height - sizePx - marginPx,
    );

    if (this.viewCanvas && this.viewCanvas.width !== sizePx) {
      this.viewCanvas.width = sizePx;
      this.viewCanvas.height = sizePx;
      this.viewCtx = this.viewCanvas.getContext('2d');
    }
    this.terrain.setDisplaySize(sizePx, sizePx);
    this.updateHitArea();
    this.drawFrame();
    this.blitTerrain(this.world.getPlayerTile());
  }

  private drawFrame(): void {
    const { sizePx, colors, shape } = this.cfg;
    const s = sizePx;
    const c = s / 2;
    this.bgGfx.clear();
    this.frameGfx.clear();

    if (shape === 'diamond') {
      this.bgGfx.fillStyle(colors.background, 1);
      this.bgGfx.fillPoints([{ x: c, y: 1 }, { x: s - 1, y: c }, { x: c, y: s - 1 }, { x: 1, y: c }], true);
      this.frameGfx.lineStyle(2, colors.border, 1);
      this.frameGfx.strokePoints([{ x: c, y: 2 }, { x: s - 2, y: c }, { x: c, y: s - 2 }, { x: 2, y: c }], true, true);
      this.frameGfx.lineStyle(1, 0x5c4a26, 0.9);
      this.frameGfx.strokePoints([{ x: c, y: 7 }, { x: s - 7, y: c }, { x: c, y: s - 7 }, { x: 7, y: c }], true, true);
    } else {
      this.bgGfx.fillStyle(colors.background, 1);
      if (shape === 'circle') this.bgGfx.fillCircle(c, c, c);
      else this.bgGfx.fillRect(0, 0, s, s);

      this.frameGfx.lineStyle(2, colors.border, 1);
      if (shape === 'circle') this.frameGfx.strokeCircle(c, c, c - 1);
      else this.frameGfx.strokeRect(1, 1, s - 2, s - 2);
    }

    // Brújula honesta: en iso el norte del mundo (-Y del grid) no apunta arriba,
    // apunta arriba-derecha. Dibujarla arriba mentiría sobre la orientación.
    const n = this.northUnit();
    this.drawCompass(this.frameGfx, c + n.x * (this.radiusPx - 9), c + n.y * (this.radiusPx - 9), n);
  }

  /** Norte del mundo = -Y del grid (mapLat crece al bajar y). Proyectado a px
   *  de pantalla iso eso es arriba-derecha, no arriba. */
  private northUnit(): { x: number; y: number } {
    const v = isoTileToPx(0, -1);
    const len = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / len, y: v.y / len };
  }

  private drawCompass(g: Phaser.GameObjects.Graphics, x: number, y: number, n: { x: number; y: number }): void {
    const px = -n.y, py = n.x;
    g.fillStyle(this.cfg.colors.border, 1);
    g.fillPoints([
      { x: x + n.x * 7, y: y + n.y * 7 },
      { x: x + px * 3.5, y: y + py * 3.5 },
      { x: x - n.x * 4, y: y - n.y * 4 },
      { x: x - px * 3.5, y: y - py * 3.5 },
    ], true);
  }

  private startRadar(): void {
    this.scanTimer = this.scene.time.addEvent({
      delay: this.cfg.scanIntervalMs,
      loop: true,
      callback: () => { this.enemies = this.world.getEnemies(); },
    });
    this.enemies = this.world.getEnemies();
  }

  // ── Terreno ────────────────────────────────────────────────────────────────

  private needsBlit(p: { x: number; y: number }): boolean {
    if (Math.abs(p.x - this.blittedCenter.x) > this.cfg.blitMoveThresholdTiles) return true;
    if (Math.abs(p.y - this.blittedCenter.y) > this.cfg.blitMoveThresholdTiles) return true;
    const r = this.world.getCameraWorldRect();
    const L = this.lastViewRect;
    return Math.abs(r.left - L.left) > 0.5 || Math.abs(r.top - L.top) > 0.5
      || Math.abs(r.right - L.right) > 0.5 || Math.abs(r.bottom - L.bottom) > 0.5;
  }

  /** Semilado, en teselas, del cuadro de espacio de teselas que cubre el marco. */
  private windowHalfTiles(): number {
    const pad = this.cfg.shape === 'square' ? Math.SQRT2 : 1;
    const reach = (this.radiusPx + 1) * pad * this.z;
    // |mx-my| ≤ reach/ISO_HALF_W, |mx+my| ≤ reach/ISO_HALF_H ⇒ |mx| ≤ (a+b)/2.
    return Math.ceil((reach / ISO_HALF_W + reach / ISO_HALF_H) / 2) + 1;
  }

  private blitTerrain(p: { x: number; y: number }): void {
    const ctx = this.viewCtx;
    const world = this.discovery.canvas;
    if (!ctx || !world) return;

    const { sizePx } = this.cfg;
    const half = this.windowHalfTiles();
    const rx = Math.floor(p.x - half);
    const ry = Math.floor(p.y - half);
    const w = half * 2;

    const sx0 = Math.max(0, rx), sy0 = Math.max(0, ry);
    const sx1 = Math.min(GRID.width, rx + w), sy1 = Math.min(GRID.height, ry + w);
    const sw = sx1 - sx0, sh = sy1 - sy0;

    // Por debajo de ~2 px por tesela el filtrado del navegador no es fiable:
    // se promedia 2×2 antes de proyectar para que el zoom-out no truene.
    const lod = this.stepPx >= this.cfg.lodMinStepPx ? 1 : 2;
    let ax = rx, ay = ry;
    let source: HTMLCanvasElement = world;
    if (lod > 1) {
      ax = Math.floor(rx / lod) * lod;
      ay = Math.floor(ry / lod) * lod;
      const built = this.buildLod(world, ax, ay, w, lod);
      if (built) source = built;
    }
    const isLod = source !== world;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, sizePx, sizePx);
    ctx.save();
    this.clipShape(ctx, sizePx);

    // El terreno se ancla a la posición continua del jugador, no a la rejilla:
    // anclarlo al tile entero haría saltar el mapa en cada cruce de tesela.
    const playerIso = isoTileToPx(p.x, p.y);
    const a = ISO_HALF_W / this.z;
    const b = ISO_HALF_H / this.z;
    ctx.transform(a, b, -a, b, this.cx - playerIso.x / this.z, this.cy - playerIso.y / this.z);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (sw > 0 && sh > 0) {
      if (isLod) {
        ctx.drawImage(
          source,
          (sx0 - ax) / lod, (sy0 - ay) / lod, sw / lod, sh / lod,
          sx0, sy0, sw, sh,
        );
      } else {
        ctx.drawImage(source, sx0, sy0, sw, sh, sx0, sy0, sw, sh);
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawViewportRect(ctx, playerIso);
    ctx.restore();

    this.viewTex?.refresh();
    this.blittedCenter = { x: p.x, y: p.y };
    this.lastViewRect = this.world.getCameraWorldRect();
  }

  private buildLod(src: HTMLCanvasElement, ax: number, ay: number, w: number, lod: number): HTMLCanvasElement | null {
    const side = Math.ceil(w / lod);
    if (!this.lodCanvas) {
      this.lodCanvas = document.createElement('canvas');
      this.lodCanvas.width = side;
      this.lodCanvas.height = side;
      this.lodCtx = this.lodCanvas.getContext('2d');
    } else if (this.lodCanvas.width !== side) {
      this.lodCanvas.width = side;
      this.lodCanvas.height = side;
      this.lodCtx = this.lodCanvas.getContext('2d');
    }
    const ctx = this.lodCtx;
    if (!ctx) return null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, side, side);

    const x0 = Math.max(0, ax), y0 = Math.max(0, ay);
    const x1 = Math.min(GRID.width, ax + w), y1 = Math.min(GRID.height, ay + w);
    if (x1 <= x0 || y1 <= y0) return this.lodCanvas;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      src, x0, y0, x1 - x0, y1 - y0,
      (x0 - ax) / lod, (y0 - ay) / lod, (x1 - x0) / lod, (y1 - y0) / lod,
    );
    return this.lodCanvas;
  }

  private clipShape(ctx: CanvasRenderingContext2D, s: number): void {
    ctx.beginPath();
    if (this.cfg.shape === 'circle') {
      ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
    } else if (this.cfg.shape === 'diamond') {
      ctx.moveTo(s / 2, 1);
      ctx.lineTo(s - 1, s / 2);
      ctx.lineTo(s / 2, s - 1);
      ctx.lineTo(1, s / 2);
      ctx.closePath();
    } else {
      ctx.rect(0, 0, s, s);
    }
    ctx.clip();
  }

  /** Lo que ve la cámara principal, dibujado dentro del recorte del radar. */
  private drawViewportRect(ctx: CanvasRenderingContext2D, playerIso: { x: number; y: number }): void {
    const r = this.world.getCameraWorldRect();
    const x0 = this.cx + (r.left - playerIso.x) / this.z;
    const y0 = this.cy + (r.top - playerIso.y) / this.z;
    const x1 = this.cx + (r.right - playerIso.x) / this.z;
    const y1 = this.cy + (r.bottom - playerIso.y) / this.z;
    ctx.strokeStyle = cssHex(this.cfg.colors.viewport, 0.9);
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x0) + 0.5, Math.round(y0) + 0.5, Math.round(x1 - x0), Math.round(y1 - y0));
  }

  // ── Iconos ─────────────────────────────────────────────────────────────────

  private renderIcons(player: { x: number; y: number }): void {
    const g = this.icons;
    const { colors } = this.cfg;
    g.clear();

    const pIso = isoTileToPx(player.x, player.y);
    const toRadar = (mx: number, my: number) => {
      const i = isoTileToPx(mx, my);
      return { lx: this.cx + (i.x - pIso.x) / this.z, ly: this.cy + (i.y - pIso.y) / this.z };
    };

    g.fillStyle(colors.player, 1).fillCircle(this.cx, this.cy, 3);
    g.lineStyle(1, colors.enemy, 0.8).strokeCircle(this.cx, this.cy, 5);

    const wp = this.world.getWaypoint();
    if (wp) this.drawPinnedBlip(g, toRadar(wp.x, wp.y), 3, colors.waypoint, true);

    for (const poi of this.pois) {
      const tx = Math.round(poi.pos.x), ty = Math.round(poi.pos.y);
      if (!this.discovery.isExplored(tx, ty)) continue;
      const size = poi.kind === 'capital' ? 3 : 2.4;
      this.drawPinnedBlip(g, toRadar(poi.pos.x, poi.pos.y), size, colors.objective, poi.kind === 'capital');
    }

    for (const e of this.enemies) {
      const { lx, ly } = toRadar(e.x, e.y);
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
      t = (this.radiusPx - size - 2) / (Math.hypot(dx, dy) || 1);
    } else if (this.cfg.shape === 'diamond') {
      t = (this.radiusPx - size - 2) / ((Math.abs(dx) + Math.abs(dy)) || 1e-6);
    } else {
      const m = this.radiusPx - size - 2;
      t = Math.min(m / (Math.abs(dx) || 1e-6), m / (Math.abs(dy) || 1e-6));
    }
    const bx = this.cx + dx * t, by = this.cy + dy * t;
    g.fillStyle(color, 0.9).fillTriangle(bx, by, bx - size, by - size * 1.6, bx + size, by - size * 1.6);
  }

  private insideShape(lx: number, ly: number): boolean {
    if (this.cfg.shape === 'circle') return Math.hypot(lx - this.cx, ly - this.cy) <= this.radiusPx;
    if (this.cfg.shape === 'diamond') return Math.abs(lx - this.cx) + Math.abs(ly - this.cy) <= this.radiusPx;
    return Math.abs(lx - this.cx) <= this.radiusPx && Math.abs(ly - this.cy) <= this.radiusPx;
  }

  private nearestPoiToLocal(lx: number, ly: number): GeoPoi | null {
    const p = this.world.getPlayerTile();
    const pIso = isoTileToPx(p.x, p.y);
    let best: GeoPoi | null = null;
    let bestD = this.cfg.hoverRadiusPx;
    for (const poi of this.pois) {
      if (!this.discovery.isExplored(Math.round(poi.pos.x), Math.round(poi.pos.y))) continue;
      const i = isoTileToPx(poi.pos.x, poi.pos.y);
      const dx = this.cx + (i.x - pIso.x) / this.z - lx;
      const dy = this.cy + (i.y - pIso.y) / this.z - ly;
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = poi; }
    }
    return best;
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  private bindInput(): void {
    this.container.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      const local = { x: ptr.x - this.container.x, y: ptr.y - this.container.y };
      if (!this.insideShape(local.x, local.y)) return;

      const p = this.world.getPlayerTile();
      const pIso = isoTileToPx(p.x, p.y);
      const tile = isoPxToTile(
        pIso.x + (local.x - this.cx) * this.z,
        pIso.y + (local.y - this.cy) * this.z,
      );
      const tx = Math.round(tile.x), ty = Math.round(tile.y);
      if (tx < 0 || ty < 0 || tx >= GRID.width || ty >= GRID.height) return;
      // No se da orden de andar hacia la niebla ni sobre teselas imposibles.
      if (!this.discovery.isExplored(tx, ty)) return;
      if (!this.world.isTileWalkable(tx, ty)) return;
      this.world.moveToTile(tx, ty);
    });

    this.wheelHandler = (ptr, _go, _dx, dy) => {
      if (!this.isPointerOver(ptr.x, ptr.y)) return;
      const dir = dy > 0 ? 1 : -1;
      this.setViewRadius(this.cfg.viewRadiusTiles + dir * this.cfg.wheelStepTiles);
    };
    this.scene.input.on('wheel', this.wheelHandler);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') this.setViewRadius(this.cfg.viewRadiusTiles - this.cfg.wheelStepTiles);
      else if (e.key === '-' || e.key === '_') this.setViewRadius(this.cfg.viewRadiusTiles + this.cfg.wheelStepTiles);
    };
    this.scene.input.keyboard?.on('keydown', this.keyHandler);
  }
}

function cssHex(value: number, alpha: number): string {
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
