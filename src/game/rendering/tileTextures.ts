// src/game/rendering/tileTextures.ts
// Fábrica procedural de texturas de terreno. El suelo caminable es un rombo
// plano de 64x32 (una sola cara); únicamente el agua y la montaña conservan
// volumen. Las transiciones se generan bajo demanda por par + máscara (16).
import type Phaser from 'phaser';
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { IsoSide, sidesInMask } from './autotile';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const CUBE_HEIGHT = 16;
export const MACRO_OVERLAY_ALPHA = 0.12;
export const MACRO_OVERLAY_DEPTH = 40000;

export const FLAT_TYPES = ['hierba', 'arena', 'nieve', 'pantano'] as const;
export type FlatTileType = (typeof FLAT_TYPES)[number];
export type TransitionTarget = FlatTileType | 'agua' | 'montana';

interface GroundPalette {
  base: number;
  specks: number[];
  rim: number;
}

const GROUND: Record<FlatTileType, GroundPalette> = {
  hierba: { base: 0x4ade80, specks: [0x22c55e, 0x86efac, 0x16a34a, 0x6ee7a0], rim: 0x3fbf6d },
  arena: { base: 0xfcd34d, specks: [0xeab308, 0xfde68a, 0xd97706, 0xf5c945], rim: 0xe0b53a },
  nieve: { base: 0xf8fafc, specks: [0xe2e8f0, 0xffffff, 0xcbd5e1, 0xf1f5f9], rim: 0xdbe4ee },
  pantano: { base: 0x365314, specks: [0x1a2e05, 0x4d7c0f, 0x84cc16, 0x2f4710], rim: 0x2a3f0e },
};

const GROUND_TINTS: Record<FlatTileType, number[]> = {
  hierba: [0xffffff, 0xf6fff4, 0xeffaea, 0xfafff6],
  arena: [0xffffff, 0xfffaf0, 0xfbf3e2, 0xfff7e6],
  nieve: [0xffffff, 0xfafcff, 0xf4f8fd],
  pantano: [0xffffff, 0xf7fbf0, 0xf0f6e6],
};

type Point = readonly [number, number];

interface MountainVariant {
  topY: number;
  leftX: number;
  rightX: number;
  base: number;
  snow: ReadonlyArray<Point> | null;
}

const MOUNTAIN_KEYS = [
  'tile_montana',
  'tile_montana_b',
  'tile_montana_c',
  'tile_montana_d',
] as const;

const MOUNTAIN_VARIANTS: ReadonlyArray<MountainVariant> = [
  { topY: 4, leftX: 4, rightX: 60, base: 0x6b7280, snow: [[32, 4], [41, 15], [32, 21], [23, 15]] },
  { topY: 6, leftX: 3, rightX: 61, base: 0x707783, snow: null },
  { topY: 3, leftX: 6, rightX: 58, base: 0x66707d, snow: [[30, 6], [37, 14], [30, 19], [24, 13]] },
  { topY: 8, leftX: 5, rightX: 59, base: 0x747f8b, snow: [[32, 8], [36, 13], [32, 17], [28, 13]] },
];

const MOUNTAIN_TINTS = [0xffffff, 0xf2f4f7, 0xe8ecf1, 0xf8fafc];

export function pickGroundTint(type: FlatTileType, rng: () => number): number {
  const tints = GROUND_TINTS[type] ?? GROUND_TINTS.hierba;
  return tints[Math.floor(rng() * tints.length)] ?? 0xffffff;
}

export function isFlatTileType(type: string): type is FlatTileType {
  return (FLAT_TYPES as readonly string[]).includes(type);
}

// El rombo se dibuja 1px más grande y se recorta en el borde de la textura.
// Sin este sangrado, la anti-alias de cada rombo deja una costura oscura
// entre tiles que se lee como una cuadrícula perfecta.
const DIAMOND_BLEED: ReadonlyArray<readonly [number, number]> = [
  [32, -1], [65, 16], [32, 33], [-1, 16],
];

function fillPolygon(
  g: Phaser.GameObjects.Graphics,
  points: ReadonlyArray<readonly [number, number]>,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.closePath();
  g.fillPath();
}

function createFlatTileTexture(scene: Phaser.Scene, type: FlatTileType, variant: 0 | 1): void {
  const key = variant === 0 ? `tile_${type}` : `tile_${type}_b`;
  if (scene.textures.exists(key)) return;

  const palette = GROUND[type];
  const rng = mulberry32(stringToHash(`flat_${type}_${variant}`));
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  fillPolygon(g, DIAMOND_BLEED, palette.base);

  // Grano / motas asimétricas: al voltear el tile con flipX se obtienen dos
  // lecturas distintas sin rotar la iluminación.
  for (let i = 0; i < 86; i++) {
    const x = 2 + rng() * 60;
    const y = 2 + rng() * 28;
    if (Math.abs(x - 32) / 31 + Math.abs(y - 16) / 15 > 0.93) continue;
    const color = palette.specks[Math.floor(rng() * palette.specks.length)];
    g.fillStyle(color, 0.16 + rng() * 0.34);
    const size = rng() < 0.76 ? 1 : 2;
    g.fillRect(Math.round(x), Math.round(y), size, size);
  }

  if (type === 'hierba' || type === 'pantano') {
    g.lineStyle(1, type === 'hierba' ? 0x86efac : 0x84cc16, 0.32);
    for (let i = 0; i < 9; i++) {
      const x = 10 + rng() * 44;
      const y = 8 + rng() * 16;
      g.lineBetween(x, y, x + (rng() - 0.5) * 3, y - 2 - rng() * 3);
    }
  } else if (type === 'arena') {
    g.lineStyle(1, 0xd97706, 0.14);
    for (let i = 0; i < 4; i++) {
      const y = 9 + i * 5 + rng() * 2;
      g.lineBetween(12 + rng() * 8, y, 40 + rng() * 10, y + 2);
    }
  } else {
    g.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 10; i++) {
      const x = 14 + rng() * 36;
      const y = 8 + rng() * 16;
      if (Math.abs(x - 32) / 31 + Math.abs(y - 16) / 15 > 0.85) continue;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  g.generateTexture(key, TILE_WIDTH, TILE_HEIGHT);
  g.destroy();
}

function createWaterTexture(scene: Phaser.Scene): void {
  const key = 'tile_agua';
  if (scene.textures.exists(key)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  fillPolygon(g, DIAMOND_BLEED, 0x3b82f6);
  g.lineStyle(1, 0x93c5fd, 0.55);
  for (let i = 0; i < 3; i++) {
    const y = 9 + i * 6;
    g.beginPath();
    g.moveTo(12, y + 3);
    g.lineTo(22, y);
    g.lineTo(32, y + 3);
    g.lineTo(42, y);
    g.lineTo(52, y + 3);
    g.strokePath();
  }

  // Caras laterales: el agua conserva su cubo (volumen real).
  fillPolygon(g, [[0, 16], [32, 32], [32, 32 + CUBE_HEIGHT], [0, 16 + CUBE_HEIGHT]], 0x2563eb);
  fillPolygon(g, [[32, 32], [64, 16], [64, 16 + CUBE_HEIGHT], [32, 32 + CUBE_HEIGHT]], 0x1d4ed8);

  g.generateTexture(key, TILE_WIDTH, TILE_HEIGHT + CUBE_HEIGHT);
  g.destroy();
}

function createMountainTextures(scene: Phaser.Scene): void {
  MOUNTAIN_VARIANTS.forEach((variant, index) => {
    const key = MOUNTAIN_KEYS[index];
    if (scene.textures.exists(key)) return;

    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    fillPolygon(g, [
      [32, variant.topY], [variant.rightX, 26], [32, 44], [variant.leftX, 26],
    ], variant.base);

    // Caras laterales: la luz fija del suroeste deja la izquierda más clara.
    fillPolygon(g, [
      [variant.leftX, 26], [32, 44], [32, 44 + CUBE_HEIGHT], [variant.leftX, 26 + CUBE_HEIGHT],
    ], 0x4b5563);
    fillPolygon(g, [
      [variant.rightX, 26], [32, 44], [32, 44 + CUBE_HEIGHT], [variant.rightX, 26 + CUBE_HEIGHT],
    ], 0x374151);

    g.lineStyle(1, 0x9ca3af, 0.45);
    g.lineBetween(variant.leftX, 26, 32, variant.topY);

    const rng = mulberry32(stringToHash(`mountain_${index}`));
    g.lineStyle(1, 0x4b5563, 0.5);
    for (let i = 0; i < 3; i++) {
      const sx = 18 + rng() * 28;
      const sy = variant.topY + 5 + rng() * 8;
      g.lineBetween(sx, sy, 32 + (rng() - 0.5) * 12, 26 + rng() * 10);
    }

    for (let i = 0; i < 26; i++) {
      const x = 10 + rng() * 44;
      const y = variant.topY + 4 + rng() * 30;
      if (Math.abs(x - 32) / 28 + Math.abs(y - 24) / 20 > 0.95) continue;
      g.fillStyle(rng() > 0.5 ? 0x9ca3af : 0x4b5563, 0.22 + rng() * 0.22);
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }

    if (variant.snow) fillPolygon(g, variant.snow, 0xf1f5f9);

    g.generateTexture(key, TILE_WIDTH, 52 + CUBE_HEIGHT);
    g.destroy();
  });
}

export function pickMountainTexture(rng: () => number): string {
  return MOUNTAIN_KEYS[Math.floor(rng() * MOUNTAIN_KEYS.length)] ?? MOUNTAIN_KEYS[0];
}

export function pickMountainTint(rng: () => number): number {
  return MOUNTAIN_TINTS[Math.floor(rng() * MOUNTAIN_TINTS.length)] ?? 0xffffff;
}

function createDecalTexture(
  scene: Phaser.Scene,
  key: string,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, 32, 20);
  g.destroy();
}

function createDecalTextures(scene: Phaser.Scene): void {
  createDecalTexture(scene, 'decal_stone', (g) => {
    g.fillStyle(0x0f172a, 0.2);
    g.fillEllipse(16, 15, 18, 5);
    g.fillStyle(0x6b7280, 1);
    g.fillEllipse(16, 11, 14, 9);
    g.fillStyle(0x9ca3af, 1);
    g.fillEllipse(14, 9, 8, 4);
    g.fillStyle(0x4b5563, 0.75);
    g.fillEllipse(20, 12, 5, 3);
  });

  createDecalTexture(scene, 'decal_grass', (g) => {
    const blades: Array<[number, number, number]> = [
      [9, 5, 0x15803d], [13, 2, 0x22c55e], [16, 4, 0x166534],
      [19, 3, 0x4ade80], [23, 6, 0x15803d], [11, 9, 0x22c55e],
    ];
    for (const [x, y, color] of blades) {
      g.lineStyle(2, color, 0.9);
      g.lineBetween(16, 17, x, y);
    }
    g.lineStyle(1, 0x86efac, 0.75);
    g.lineBetween(16, 16, 14, 8);
    g.lineBetween(16, 16, 20, 9);
  });

  createDecalTexture(scene, 'decal_flower', (g) => {
    g.lineStyle(1.5, 0x15803d, 0.9);
    g.lineBetween(16, 17, 16, 8);
    g.fillStyle(0xfb7185, 1);
    g.fillCircle(13, 7, 2.2);
    g.fillCircle(19, 7, 2.2);
    g.fillCircle(16, 4.5, 2.2);
    g.fillCircle(16, 9.5, 2.2);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(16, 7, 1.8);
  });

  createDecalTexture(scene, 'decal_crack', (g) => {
    g.lineStyle(1.5, 0x1f2937, 0.45);
    g.beginPath();
    g.moveTo(4, 15);
    g.lineTo(11, 10);
    g.lineTo(15, 12);
    g.lineTo(22, 6);
    g.lineTo(28, 9);
    g.strokePath();
    g.lineStyle(1, 0x111827, 0.3);
    g.beginPath();
    g.moveTo(12, 16);
    g.lineTo(17, 13);
    g.lineTo(21, 15);
    g.strokePath();
  });
}

function createMacroNoiseTexture(scene: Phaser.Scene): void {
  const key = 'macro_noise';
  if (scene.textures.exists(key)) return;

  const size = 512;
  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return;

  const ctx = texture.context;
  const rng = mulberry32(stringToHash('macro_noise_v1'));
  const tones = ['#e8f5e9', '#e3f2fd', '#fff8e1', '#f3e5f5', '#e0f2f1', '#f1f8e9'];

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Manchas repetidas en los 9 offsets para que la textura sea seamless.
  for (let i = 0; i < 30; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const radius = 55 + rng() * 155;
    const tone = tones[Math.floor(rng() * tones.length)];

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const x = cx + ox * size;
        const y = cy + oy * size;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, tone);
        gradient.addColorStop(0.55, tone);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    }
  }

  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(110,130,110,0.16)';
    ctx.fillRect(rng() * size, rng() * size, 1, 1);
  }

  texture.refresh();
}

function transitionColors(base: string, target: string): { edge: number; rim: number } {
  if (target === 'agua') return { edge: 0x7dd3fc, rim: 0xe0f2fe };
  if (base === 'agua') return { edge: 0xe0f2fe, rim: 0x93c5fd };
  if (target === 'montana') return { edge: 0x6b7280, rim: 0x4b5563 };
  const palette = GROUND[target as FlatTileType] ?? GROUND.hierba;
  return { edge: palette.base, rim: palette.rim };
}

const CORNERS = {
  n: { x: 32, y: 0 },
  e: { x: 64, y: 16 },
  s: { x: 32, y: 32 },
  w: { x: 0, y: 16 },
} as const;

const EDGES: Record<IsoSide, readonly [{ x: number; y: number }, { x: number; y: number }]> = {
  n: [CORNERS.n, CORNERS.e],
  e: [CORNERS.e, CORNERS.s],
  s: [CORNERS.s, CORNERS.w],
  w: [CORNERS.w, CORNERS.n],
};

const CENTER = { x: 32, y: 16 };

function drawEdgeWedge(
  g: Phaser.GameObjects.Graphics,
  side: IsoSide,
  colors: { edge: number; rim: number },
  rng: () => number,
): void {
  const [a, b] = EDGES[side];
  const steps = 7;
  const inner: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    const depth = 0.32 + rng() * 0.16;
    inner.push({
      x: px + (CENTER.x - px) * depth,
      y: py + (CENTER.y - py) * depth,
    });
  }

  g.fillStyle(colors.edge, 0.95);
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  for (let i = inner.length - 1; i >= 0; i--) g.lineTo(inner[i].x, inner[i].y);
  g.closePath();
  g.fillPath();

  g.lineStyle(1.5, colors.rim, 0.75);
  g.beginPath();
  g.moveTo(a.x, a.y);
  g.lineTo(b.x, b.y);
  g.strokePath();

  // Motas del vecino que "invaden" el tile: rompe el corte recto.
  g.fillStyle(colors.edge, 0.4);
  for (let i = 0; i < 6; i++) {
    const t = rng();
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    const depth = 0.5 + rng() * 0.3;
    g.fillCircle(px + (CENTER.x - px) * depth, py + (CENTER.y - py) * depth, 0.7 + rng() * 1.3);
  }
}

/** Genera (y cachea) la pieza de transición de 16 para un par y máscara. */
export function ensureTransitionTexture(
  scene: Phaser.Scene,
  base: string,
  target: string,
  mask: number,
): string {
  const key = `tr_${base}_${target}_${mask}`;
  if (scene.textures.exists(key)) return key;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const colors = transitionColors(base, target);
  for (const side of sidesInMask(mask)) {
    const rng = mulberry32(stringToHash(`edge_${base}_${target}_${side}`));
    drawEdgeWedge(g, side, colors, rng);
  }
  g.generateTexture(key, TILE_WIDTH, TILE_HEIGHT);
  g.destroy();
  return key;
}

export function ensureTerrainTextures(scene: Phaser.Scene): void {
  for (const type of FLAT_TYPES) {
    createFlatTileTexture(scene, type, 0);
    createFlatTileTexture(scene, type, 1);
  }
  createWaterTexture(scene);
  createMountainTextures(scene);
  createDecalTextures(scene);
  createMacroNoiseTexture(scene);
}
