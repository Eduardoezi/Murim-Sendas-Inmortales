// src/game/systems/AutoMapSystem.ts
// ─────────────────────────────────────────────────────────────────────────────
// Automapa estilo Diablo II (Tab). El mundo se pinta UNA vez por tile en un
// lienzo 1000×1000 (solo lo explorado; el resto queda transparente = niebla).
// Lo que se ve en pantalla es un recorte de 260×260 tiles centrado en el
// jugador, dibujado en un canvas 760×760 → CanvasTexture. Cero Graphics por
// tile: abrir/cerrar el mapa no cuesta nada y caminar solo repinta el anillo
// recién revelado. Todo el overlay es no interactivo para que el clic-a-mover
// siga funcionando con el mapa abierto.
// ─────────────────────────────────────────────────────────────────────────────
import Phaser from 'phaser';
import { getTileTypeAt } from '../../core/data/world/generators/terrainGenerator';
import type { TileType } from '../../core/data/world/generators/terrainGenerator';
import {
  getInstanceInChunk,
} from '../../core/data/world/generators/instanceGenerator';
import type { InstancePoi } from '../../core/data/world/generators/instanceGenerator';
import { INSTANCE_COLOR } from '../../core/data/world/generators/instanceGenerator';
import { GeoPoi, getWorldPois } from '../../core/data/world/geoPois';
import { WORLD_SEED } from '../../core/data/world/seeds/worldSeed';

const GRID = WORLD_SEED.gridSize;
const REVEAL_RADIUS = 13;
const VIEW_WORLD_TILES = 120;
const VIEW_PX = 900;
const DEPTH = 99999;

const POI_STYLE: Record<GeoPoi['kind'], { color: number; radius: number }> = {
  capital: { color: 0xfacc15, radius: 3.6 },
  sect: { color: 0x38bdf8, radius: 2.8 },
  landmark: { color: 0xe879f9, radius: 2.8 },
};

const TILE_COLOR: Record<TileType, string> = {
  hierba: '#3c3b2e',
  agua: '#21343d',
  arena: '#57492f',
  nieve: '#7d8387',
  montana: '#36363a',
  pantano: '#2b3223',
};

export interface AutoMapOptions {
  getPlayerTile: () => { x: number; y: number };
}

export class AutoMapSystem {
  private scene: Phaser.Scene;
  private opts: AutoMapOptions;

  private container!: Phaser.GameObjects.Container;
  private backdrop!: Phaser.GameObjects.Rectangle;
  private mapImage!: Phaser.GameObjects.Image;
  private frameGfx!: Phaser.GameObjects.Graphics;
  private markers!: Phaser.GameObjects.Graphics;
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private legend!: Phaser.GameObjects.Text;

  private worldCanvas: HTMLCanvasElement;
  private worldCtx: CanvasRenderingContext2D | null;
  private viewCanvas: HTMLCanvasElement;
  private viewCtx: CanvasRenderingContext2D | null;
  private viewTex: Phaser.Textures.CanvasTexture | null = null;

  private explored = new Set<number>();
  /** Estado por tile: 0 sin explorar, 1 normal, 2 montaña, 3 agua. */
  private exploredType = new Uint8Array(GRID.width * GRID.height);
  private instances = new Map<string, InstancePoi>();
  private pois: GeoPoi[];

  private isOpen = false;
  private lastReveal = { x: NaN, y: NaN };
  private lastBlit = { x: NaN, y: NaN };
  private blitCenter = { sx: 0, sy: 0 };
  private mapRect = { left: 0, top: 0, size: VIEW_PX };
  private destroyed = false;

  private keyHandler?: (event: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, opts: AutoMapOptions) {
    this.scene = scene;
    this.opts = opts;
    this.pois = getWorldPois();

    this.worldCanvas = document.createElement('canvas');
    this.worldCanvas.width = GRID.width;
    this.worldCanvas.height = GRID.height;
    this.worldCtx = this.worldCanvas.getContext('2d');

    this.viewCanvas = document.createElement('canvas');
    this.viewCanvas.width = VIEW_PX;
    this.viewCanvas.height = VIEW_PX;
    this.viewCtx = this.viewCanvas.getContext('2d');

    if (this.scene.textures.exists('__automap_view')) this.scene.textures.remove('__automap_view');
    this.viewTex = this.scene.textures.addCanvas('__automap_view', this.viewCanvas) as Phaser.Textures.CanvasTexture;

    this.buildUI();
    this.bindInput();
    this.relayout();
  }

  public get isVisible(): boolean { return this.isOpen; }

  public toggle(): void { this.isOpen ? this.hide() : this.show(); }

  public show(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.lastBlit = { x: NaN, y: NaN };
    this.container.setVisible(true);
    this.update();
  }

  public hide(): void {
    this.isOpen = false;
    this.container.setVisible(false);
  }

  public handleResize(): void { this.relayout(); }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.keyHandler) this.scene.input.keyboard?.off('keydown', this.keyHandler);
    this.scene.input.keyboard?.removeCapture('TAB');
    if (this.viewTex && this.scene.textures.exists(this.viewTex.key)) {
      this.scene.textures.remove(this.viewTex.key);
    }
    this.container.destroy();
  }

  /// Llamado por frame: revela niebla (barato si no cambias de tile) y, con
  /// el mapa abierto, re-recorta la vista y redibuja marcadores.
  public update(): void {
    const p = this.opts.getPlayerTile();
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    if (px !== this.lastReveal.x || py !== this.lastReveal.y) {
      this.lastReveal = { x: px, y: py };
      this.revealAround(px, py);
      if (this.isOpen) this.lastBlit = { x: NaN, y: NaN };
    }
    if (!this.isOpen) return;
    if (px !== this.lastBlit.x || py !== this.lastBlit.y) {
      this.blitView(p);
      this.lastBlit = { x: px, y: py };
    }
    this.drawMarkers(p);
  }

  // ── Niebla de guerra ───────────────────────────────────────────────────────

  private revealAround(cx: number, cy: number): void {
    const ctx = this.worldCtx;
    if (!ctx) return;

    const r = REVEAL_RADIUS;
    const r2 = r * r;
    const touchedChunks = new Set<string>();

    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= GRID.height) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= GRID.width) continue;
        if (dx * dx + dy * dy > r2) continue;

        touchedChunks.add(`${Math.floor(x / 16)},${Math.floor(y / 16)}`);

        const idx = y * GRID.width + x;
        if (this.explored.has(idx)) continue;
        this.explored.add(idx);

        const type = getTileTypeAt(x, y);
        this.exploredType[idx] = type === 'montana' ? 2 : type === 'agua' ? 3 : 1;
        ctx.fillStyle = this.tileColor(type, x, y);
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Descubrimiento de entradas de instancia dentro del anillo revelado.
    for (const key of touchedChunks) {
      const [chx, chy] = key.split(',').map(Number);
      const inst = getInstanceInChunk(chx, chy);
      if (!inst) continue;
      const ddx = inst.x - cx;
      const ddy = inst.y - cy;
      if (ddx * ddx + ddy * ddy <= r2) this.instances.set(inst.id, inst);
    }
  }

  private tileColor(type: TileType, x: number, y: number): string {
    const base = TILE_COLOR[type] ?? TILE_COLOR.hierba;
    // Ruido determinista por tile: evita manchas planas de 1 px.
    const h = ((x * 374761393) ^ (y * 668265263)) >>> 0;
    return shadeHex(base, (h % 15) - 7);
  }

  // ── Recorte de la vista ────────────────────────────────────────────────────

  private blitView(player: { x: number; y: number }): void {
    const ctx = this.viewCtx;
    if (!ctx) return;

    const half = VIEW_WORLD_TILES / 2;
    const sx = Phaser.Math.Clamp(player.x - half, 0, Math.max(0, GRID.width - VIEW_WORLD_TILES));
    const sy = Phaser.Math.Clamp(player.y - half, 0, Math.max(0, GRID.height - VIEW_WORLD_TILES));
    this.blitCenter = { sx, sy };

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_PX, VIEW_PX);
    ctx.drawImage(
      this.worldCanvas,
      sx, sy, VIEW_WORLD_TILES, VIEW_WORLD_TILES,
      0, 0, VIEW_PX, VIEW_PX,
    );

    this.drawHazardLines(sx, sy, VIEW_WORLD_TILES);

    // Viñeta: la vista se hunde en la niebla en los bordes del recorte.
    const grad = ctx.createRadialGradient(
      VIEW_PX / 2, VIEW_PX / 2, VIEW_PX * 0.34,
      VIEW_PX / 2, VIEW_PX / 2, VIEW_PX * 0.56,
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(2,6,14,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_PX, VIEW_PX);

    if (!this.viewTex || !this.scene.textures.exists(this.viewTex.key)) {
      const key = '__automap_view';
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
      this.viewTex = this.scene.textures.addCanvas(key, this.viewCanvas) as Phaser.Textures.CanvasTexture;
      this.mapImage.setTexture(key);
    } else {
      this.viewTex.refresh();
    }  }

  // Líneas de colisión sutiles (rojo oscuro) en los bordes de montaña/agua.
  private drawHazardLines(sx: number, sy: number, w: number): void {
    const ctx = this.viewCtx;
    if (!ctx) return;
    const px = VIEW_PX / w;
    ctx.strokeStyle = 'rgba(116, 38, 56, 0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y < w; y++) {
      const wy = sy + y;
      if (wy >= GRID.height) break;
      for (let x = 0; x < w; x++) {
        const wx = sx + x;
        if (wx >= GRID.width) break;
        const idx = wy * GRID.width + wx;
        const t = this.exploredType[idx];
        if (t < 2) continue;
        const left = x > 0 ? this.exploredType[idx - 1] : 0;
        const up = y > 0 ? this.exploredType[idx - GRID.width] : 0;
        if (left !== 0 && left !== t) {
          ctx.moveTo(x * px, y * px);
          ctx.lineTo(x * px, (y + 1) * px);
        }
        if (up !== 0 && up !== t) {
          ctx.moveTo(x * px, y * px);
          ctx.lineTo((x + 1) * px, y * px);
        }
      }
    }
    ctx.stroke();
  }

  // ── Marcadores (pantalla) ──────────────────────────────────────────────────

  private drawMarkers(player: { x: number; y: number }): void {
    const g = this.markers;
    g.clear();

    const k = this.mapRect.size / VIEW_WORLD_TILES;
    const toScreen = (wx: number, wy: number) => ({
      x: this.mapRect.left + (wx - this.blitCenter.sx) * k,
      y: this.mapRect.top + (wy - this.blitCenter.sy) * k,
    });

    for (const poi of this.pois) {
      if (!this.explored.has(Math.round(poi.pos.y) * GRID.width + Math.round(poi.pos.x))) continue;
      const pt = toScreen(poi.pos.x, poi.pos.y);
      if (!this.insideMap(pt.x, pt.y)) continue;
      const style = POI_STYLE[poi.kind];
      g.fillStyle(style.color, 1).fillCircle(pt.x, pt.y, style.radius);
      g.lineStyle(1, 0xffffff, 0.35).strokeCircle(pt.x, pt.y, style.radius + 1.5);
    }

    for (const inst of this.instances.values()) {
      const pt = toScreen(inst.x, inst.y);
      if (!this.insideMap(pt.x, pt.y)) continue;
      const color = INSTANCE_COLOR[inst.kind];
      g.fillStyle(color, 1);
      g.fillPoints(diamondPoints(pt.x, pt.y, 4), true);
      g.lineStyle(1, 0x0b1120, 0.9);
      g.strokePoints(diamondPoints(pt.x, pt.y, 5.4), true);
    }

    const me = toScreen(player.x, player.y);
    g.fillStyle(0x0b1120, 0.85).fillCircle(me.x, me.y, 7.5);
    g.fillStyle(0xfacc15, 1).fillPoints(diamondPoints(me.x, me.y, 5.5), true);
    g.lineStyle(1.5, 0xfff7d6, 1);
    g.strokePoints(diamondPoints(me.x, me.y, 5.5), true);
  }

  private insideMap(x: number, y: number): boolean {
    return x >= this.mapRect.left && y >= this.mapRect.top &&
      x <= this.mapRect.left + this.mapRect.size && y <= this.mapRect.top + this.mapRect.size;
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  private buildUI(): void {
    this.backdrop = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0.7)
      .setOrigin(0, 0);
    this.mapImage = this.scene.add.image(0, 0, '__automap_view')
      .setOrigin(0, 0)
      .setDisplaySize(VIEW_PX, VIEW_PX);
    this.frameGfx = this.scene.add.graphics();
    this.markers = this.scene.add.graphics();

    this.title = this.scene.add.text(0, 0, 'AUTOMAPA DEL JIANGHU', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#d4a94e',
    }).setOrigin(0.5, 0);

    this.hint = this.scene.add.text(0, 0, 'Tab para cerrar  ·  los clics siguen moviendo al personaje', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#94a3b8',
    }).setOrigin(0.5, 1);

    this.legend = this.scene.add.text(0, 0, '◆ tú      ◆ entrada de instancia      ● capital / secta / hito', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#cbd5e1',
    }).setOrigin(0.5, 0);

    this.container = this.scene.add.container(0, 0, [
      this.backdrop,
      this.frameGfx,
      this.mapImage,
      this.markers,
      this.title,
      this.legend,
      this.hint,
    ]);
    this.container.setScrollFactor(0).setDepth(DEPTH).setVisible(false);
  }

  private relayout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;

    this.backdrop.setSize(w, h);

    const size = Math.max(240, Math.min(w - 200, h - 210, VIEW_PX));
    this.mapRect = {
      left: Math.round((w - size) / 2),
      top: Math.round((h - size) / 2) + 8,
      size,
    };

    this.mapImage
      .setPosition(this.mapRect.left, this.mapRect.top)
      .setDisplaySize(size, size);

    this.title.setPosition(w / 2, this.mapRect.top - 40);
    this.legend.setPosition(w / 2, this.mapRect.top + size + 14);
    this.hint.setPosition(w / 2, this.mapRect.top + size + 38);

    this.drawFrame();

    if (this.isOpen) {
      this.lastBlit = { x: NaN, y: NaN };
      this.update();
    }
  }

  private drawFrame(): void {
    const g = this.frameGfx;
    const { left, top, size } = this.mapRect;
    g.clear();

    // Panel de pergamino oscuro bajo el recorte (la niebla es transparente).
    g.fillStyle(0x0a0f1a, 0.96);
    g.fillRect(left - 8, top - 8, size + 16, size + 16);

    g.fillStyle(0x05080f, 1);
    g.fillRect(left, top, size, size);

    // Marco doble con esquinas reforzadas.
    g.lineStyle(2, 0xd4a94e, 0.95);
    g.strokeRect(left - 8, top - 8, size + 16, size + 16);
    g.lineStyle(1, 0x8a6d2f, 0.9);
    g.strokeRect(left - 3, top - 3, size + 6, size + 6);

    g.lineStyle(3, 0xd4a94e, 1);
    const corner = 16;
    g.lineBetween(left - 8, top - 8, left - 8 + corner, top - 8);
    g.lineBetween(left - 8, top - 8, left - 8, top - 8 + corner);
    g.lineBetween(left + size + 8, top - 8, left + size + 8 - corner, top - 8);
    g.lineBetween(left + size + 8, top - 8, left + size + 8, top - 8 + corner);
    g.lineBetween(left - 8, top + size + 8, left - 8 + corner, top + size + 8);
    g.lineBetween(left - 8, top + size + 8, left - 8, top + size + 8 - corner);
    g.lineBetween(left + size + 8, top + size + 8, left + size + 8 - corner, top + size + 8);
    g.lineBetween(left + size + 8, top + size + 8, left + size + 8, top + size + 8 - corner);

    // Rosa de los vientos: N arriba.
    const nx = left + size - 26;
    const ny = top + 26;
    g.fillStyle(0xd4a94e, 0.85);
    g.fillPoints([
      { x: nx, y: ny - 8 },
      { x: nx + 4, y: ny },
      { x: nx, y: ny + 8 },
      { x: nx - 4, y: ny },
    ], true);
    g.lineStyle(1, 0xd4a94e, 0.6);
    g.lineBetween(nx - 9, ny, nx + 9, ny);
  }

  private bindInput(): void {
    this.scene.input.keyboard?.addCapture('TAB');
    this.keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.toggle();
      } else if (event.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    };
    this.scene.input.keyboard?.on('keydown', this.keyHandler);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function diamondPoints(cx: number, cy: number, r: number): Phaser.Geom.Point[] {
  return [
    new Phaser.Geom.Point(cx, cy - r),
    new Phaser.Geom.Point(cx + r * 0.72, cy),
    new Phaser.Geom.Point(cx, cy + r),
    new Phaser.Geom.Point(cx - r * 0.72, cy),
  ];
}

function shadeHex(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + delta));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + delta));
  const b = Math.min(255, Math.max(0, (n & 0xff) + delta));
  return `rgb(${r},${g},${b})`;
}
