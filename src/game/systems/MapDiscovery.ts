// src/game/systems/MapDiscovery.ts
// ─────────────────────────────────────────────────────────────────────────────
// Único dueño de lo que el jugador ha visto del mundo. Pinta de a un píxel por
// tesela en un lienzo de GRID (transparente = niebla) y revela un anillo al
// cruzar de tile. Lo consumen el minimapa y el automapa: ambos leen el MISMO
// lienzo, así que el radar y la pantalla de Tab no pueden contradecirse, y
// nadie tiene que pregenerar el mundo entero para dibujar el mapa.
// ─────────────────────────────────────────────────────────────────────────────
import { getTileTypeAt, TileType } from '../../core/data/world/generators/terrainGenerator';
import { sampleGeoCached } from '../../core/data/world/generators/geoTileCache';
import {
  getInstanceInChunk,
  InstancePoi,
} from '../../core/data/world/generators/instanceGenerator';
import { WORLD_SEED } from '../../core/data/world/seeds/worldSeed';
import { MINIMAP_DEFAULTS } from '../config/minimapConfig';

const GRID = WORLD_SEED.gridSize;

/** 0 = sin explorar. El resto es explorado: el propio array dice la verdad,
 *  no hace falta un Set paralelo de índices. */
export const TILE_UNEXPLORED = 0;
export const TILE_NORMAL = 1;
export const TILE_MOUNTAIN = 2;
export const TILE_WATER = 3;

const TILE_COLOR: Record<TileType, string> = {
  hierba: '#3c3b2e',
  agua: '#21343d',
  arena: '#57492f',
  nieve: '#7d8387',
  montana: '#36363a',
  pantano: '#2b3223',
};

export class MapDiscovery {
  /** Lienzo en espacio de grid: 1 px = 1 tesela, alfa 0 = nunca visitada. */
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  private readonly types = new Uint8Array(GRID.width * GRID.height);
  private readonly instances = new Map<string, InstancePoi>();
  private lastReveal = { x: NaN, y: NaN };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = GRID.width;
    this.canvas.height = GRID.height;
    this.ctx = this.canvas.getContext('2d');
  }

  /** Llamado cada frame: solo trabaja al cruzar de tesela. */
  public update(playerTile: { x: number; y: number }): void {
    const px = Math.floor(playerTile.x);
    const py = Math.floor(playerTile.y);
    if (px === this.lastReveal.x && py === this.lastReveal.y) return;
    this.lastReveal = { x: px, y: py };
    this.revealAround(px, py);
  }

  public isExplored(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= GRID.width || y >= GRID.height) return false;
    return this.types[y * GRID.width + x] !== TILE_UNEXPLORED;
  }

  /** Estado de la tesela: ver TILE_* . 0 si no está explorada o fuera del mundo. */
  public typeAt(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= GRID.width || y >= GRID.height) return TILE_UNEXPLORED;
    return this.types[y * GRID.width + x];
  }

  public discoveredInstances(): InstancePoi[] {
    return Array.from(this.instances.values());
  }

  /** Re-oculta todo: se usa si el mundo se regenera (nueva partida/seed). */
  public reset(): void {
    this.ctx?.clearRect(0, 0, GRID.width, GRID.height);
    this.types.fill(0);
    this.instances.clear();
    this.lastReveal = { x: NaN, y: NaN };
  }

  private revealAround(cx: number, cy: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const r = MINIMAP_DEFAULTS.revealRadiusTiles;
    const r2 = r * r;
    const touchedChunks = new Set<string>();

    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= GRID.height) continue;
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        if (x < 0 || x >= GRID.width) continue;
        if (dx * dx + dy * dy > r2) continue;

        const idx = y * GRID.width + x;
        if (this.types[idx] !== TILE_UNEXPLORED) continue;

        touchedChunks.add(`${Math.floor(x / 16)},${Math.floor(y / 16)}`);

        const type = getTileTypeAt(x, y);
        this.types[idx] = type === 'montana' ? TILE_MOUNTAIN : type === 'agua' ? TILE_WATER : TILE_NORMAL;
        ctx.fillStyle = this.tileColor(type, x, y);
        ctx.fillRect(x, y, 1, 1);
      }
    }

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
    let base = TILE_COLOR[type] ?? TILE_COLOR.hierba;
    // El agua distingue canal / mar / lago: sin ese detalle el Gran Canal
    // desaparecía del mapa y el lector perdía la referencia de orientación.
    if (type === 'agua') {
      const kind = sampleGeoCached(x, y).kind;
      if (kind === 'canal') base = '#2c5260';
      else if (kind === 'mar') base = '#102536';
    }
    // Ruido determinista por tesela: evita manchas planas de 1 px al ampliar.
    const h = ((x * 374761393) ^ (y * 668265263)) >>> 0;
    return shadeHex(base, (h % 15) - 7);
  }
}

function shadeHex(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 0xff) + delta));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + delta));
  const b = Math.min(255, Math.max(0, (n & 0xff) + delta));
  return `rgb(${r},${g},${b})`;
}
