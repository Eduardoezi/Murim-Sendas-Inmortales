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
export const MACRO_OVERLAY_ALPHA = 0.14;
export const MACRO_OVERLAY_DEPTH = 40000;

/**
 * Altura visual de un nivel de elevación. Es 18 y no 16 a propósito: al subir
 * un nivel el personaje gana 18 de depth y pierde 16 de Y de pantalla, de modo
 * que un salto hacia el norte siempre termina en un depth estrictamente mayor.
 */
export const CLIFF_STEP = 18;
export const ELEVATION_DEPTH_STEP = CLIFF_STEP;

export const CLIFF_SHADOW_KEY = 'tile_cliff_shadow';
export const CLIFF_SHADOW_W_KEY = 'tile_cliff_shadow_w';
export const JUMP_NODE_KEY = 'jump_node_marker';

// El agua se pinta como una lámina continua por debajo de todo el terreno:
// el lienzo de cada chunk solo asoma por los rombos de agua (el suelo es
// opaco y tesela sin huecos). Un depth muy bajo evita conflictos entre chunks.
export const WATER_DEPTH = -1_000_000;

export const ENTRANCE_SIZE = 96;
export const ENTRANCE_BASE_Y = 88;
export const ENTRANCE_ORIGIN_Y = ENTRANCE_BASE_Y / ENTRANCE_SIZE;

export const FLAT_TYPES = ['hierba', 'arena', 'nieve', 'pantano'] as const;
export type FlatTileType = (typeof FLAT_TYPES)[number];
export type TransitionTarget = FlatTileType | 'agua' | 'montana';

interface GroundPalette {
  base: number;
  specks: number[];
}

const GROUND: Record<FlatTileType, GroundPalette> = {
  hierba: { base: 0x464f39, specks: [0x37402c, 0x566246, 0x2c3423, 0x5e674a, 0x4c4632] },
  arena: { base: 0x7f704f, specks: [0x695a3d, 0x94825c, 0x574a32, 0x8a7a54] },
  nieve: { base: 0xb7bcc0, specks: [0xa0a5aa, 0xcdd1d4, 0x8d9399, 0xb1b6ba] },
  pantano: { base: 0x373d27, specks: [0x272d1c, 0x474f33, 0x21271a, 0x525a3a] },
};

const GROUND_TINTS: Record<FlatTileType, number[]> = {
  hierba: [0xffffff, 0xf1eee4, 0xe7e4d8, 0xf6f3e9],
  arena: [0xffffff, 0xf6f0e2, 0xebe3d2, 0xfaf4e8],
  nieve: [0xffffff, 0xf4f6f8, 0xe9edf0],
  pantano: [0xffffff, 0xeff0e3, 0xe2e5d5],
};

type Point = readonly [number, number];

/** Paleta de la cara superior de una meseta (roca o nieve). */
const MOUNTAIN_TOP: Record<'montana' | 'nieve', { base: number; specks: number[]; rock?: number }> = {
  montana: {
    base: 0x413f37,
    specks: [0x4d4a40, 0x35332c, 0x575247, 0x2c2b25, 0x5f5a4d],
  },
  nieve: {
    base: 0x9aa0a4,
    specks: [0x8b9196, 0xb3b8bb, 0x7c848a, 0xa7adb1],
    rock: 0x47443c,
  },
};

const WALL_COLORS = {
  sw: { base: 0x3a3833, light: 0x5c574c, dark: 0x201f1c },
  se: { base: 0x262522, light: 0x3f3c34, dark: 0x14130f },
} as const;

/** Clave de la cara superior plana según superficie y variante. */
export function mountainTopTexture(type: 'montana' | 'nieve', variantB: boolean): string {
  return `tile_montana_top${type === 'nieve' ? '_snow' : ''}${variantB ? '_b' : ''}`;
}

/** Clave del muro vertical para un lado y un desnivel de 1..3 niveles. */
export function cliffWallTexture(side: 'sw' | 'se', levels: number, variantB: boolean): string {
  const step = Math.min(3, Math.max(1, Math.round(levels)));
  return `tile_cliff_wall_${side}_${step}${variantB ? '_b' : ''}`;
}

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
    g.lineStyle(1, type === 'hierba' ? 0x76815a : 0x687443, 0.3);
    for (let i = 0; i < 9; i++) {
      const x = 10 + rng() * 44;
      const y = 8 + rng() * 16;
      g.lineBetween(x, y, x + (rng() - 0.5) * 3, y - 2 - rng() * 3);
    }
  } else if (type === 'arena') {
    g.lineStyle(1, 0x8a7448, 0.16);
    for (let i = 0; i < 4; i++) {
      const y = 9 + i * 5 + rng() * 2;
      g.lineBetween(12 + rng() * 8, y, 40 + rng() * 10, y + 2);
    }
  } else {
    g.fillStyle(0xe9edef, 0.75);
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

/**
 * Patrón de agua seamless (128×64) generado pixel a pixel con ondas seno de
 * periodo entero. El TileSprite de cada chunk lo desplaza en X para simular
 * corriente; al ser periódico no aparece costura al repetir.
 */
function createWaterFlowTexture(scene: Phaser.Scene): void {
  const key = 'water_flow';
  if (scene.textures.exists(key)) return;

  const W = 128;
  const H = 64;
  const texture = scene.textures.createCanvas(key, W, H);
  if (!texture) return;

  const ctx = texture.context;
  const image = ctx.createImageData(W, H);
  const data = image.data;

  const deep = [8, 20, 32];
  const mid = [24, 58, 78];
  const foam = [104, 150, 170];

  for (let y = 0; y < H; y++) {
    const v = (y / H) * Math.PI * 2;
    for (let x = 0; x < W; x++) {
      const u = (x / W) * Math.PI * 2;
      // Crestas alargadas en X (corriente horizontal) en vez de manchas
      // isótropas: variación rápida en V, lenta en U.
      let n =
        Math.sin(v * 3 + Math.sin(u * 2) * 0.9) +
        0.6 * Math.sin(v * 6 - u * 3 + 1.7) +
        0.35 * Math.sin(u * 2 + v * 4 + 0.4) +
        0.25 * Math.cos(u * 4 - v * 2);
      n = Math.min(1, Math.max(0, (n + 2.2) / 4.4));
      const t = n * n * (3 - 2 * n);

      let r: number;
      let g: number;
      let b: number;
      if (t < 0.7) {
        const k = t / 0.7;
        r = deep[0] + (mid[0] - deep[0]) * k;
        g = deep[1] + (mid[1] - deep[1]) * k;
        b = deep[2] + (mid[2] - deep[2]) * k;
      } else {
        const k = (t - 0.7) / 0.3;
        r = mid[0] + (foam[0] - mid[0]) * k;
        g = mid[1] + (foam[1] - mid[1]) * k;
        b = mid[2] + (foam[2] - mid[2]) * k;
      }

      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  texture.refresh();
}

/** Sombras/tonos por tile que conservan la lectura de calado y canal. */
function createWaterShadeTextures(scene: Phaser.Scene): void {
  const make = (key: string, color: number, alpha: number) => {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    fillPolygon(g, DIAMOND_BLEED, color, alpha);
    g.generateTexture(key, TILE_WIDTH, TILE_HEIGHT);
    g.destroy();
  };

  make('water_shade_deep', 0x051622, 0.38);
  make('water_shade_canal', 0x6b93a3, 0.16);
}

function createEntranceTexture(
  scene: Phaser.Scene,
  key: string,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, ENTRANCE_SIZE, ENTRANCE_SIZE);
  g.destroy();
}

function canvasPoly(
  ctx: CanvasRenderingContext2D,
  pts: ReadonlyArray<readonly [number, number]>,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function canvasEllipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Entrada de cueva: arco de sillares sobre una plataforma isométrica. El vano
 * usa un gradiente radial (piedra oscura → negro) para simular profundidad,
 * con polvo en suspensión; el brillo exterior lo añade ChunkManager.
 */
function createCaveEntranceTexture(scene: Phaser.Scene): void {
  const key = 'entrance_cueva';
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, ENTRANCE_SIZE, ENTRANCE_SIZE);
  if (!texture) return;
  const ctx = texture.context;
  const rng = mulberry32(stringToHash('entrance_cueva_v2'));

  canvasEllipse(ctx, 48, 86, 41, 8, 'rgba(0,0,0,0.5)');
  canvasEllipse(ctx, 48, 86, 30, 5.5, 'rgba(0,0,0,0.35)');

  // Crestón rocoso: silueta, cara iluminada y grietas.
  canvasPoly(ctx, [
    [8, 84], [11, 66], [15, 52], [20, 58], [24, 40], [29, 48], [35, 26],
    [42, 42], [48, 22], [55, 40], [62, 30], [67, 46], [73, 38], [78, 54],
    [84, 62], [88, 84],
  ], '#1b1c19');
  canvasPoly(ctx, [
    [11, 66], [15, 52], [20, 58], [24, 40], [29, 48], [35, 26], [42, 42],
    [48, 22], [48, 84], [8, 84],
  ], '#282923');
  canvasPoly(ctx, [
    [15, 52], [20, 58], [24, 40], [29, 48], [35, 26], [42, 42], [48, 22],
    [48, 62],
  ], '#33342e');

  ctx.strokeStyle = 'rgba(96,92,78,0.5)';
  ctx.lineWidth = 1;
  for (const [x0, y0, x1, y1] of [
    [20, 58, 24, 42], [29, 48, 34, 30], [42, 42, 46, 26], [55, 40, 52, 24],
    [62, 30, 58, 22], [67, 46, 72, 40],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10,10,9,0.65)';
  for (let i = 0; i < 5; i++) {
    const x = 14 + rng() * 62;
    const y = 40 + rng() * 34;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 5, y + 3 + rng() * 6);
    ctx.stroke();
  }

  // Musgo apagado.
  canvasEllipse(ctx, 26, 45, 9, 4, 'rgba(56,64,40,0.55)');
  canvasEllipse(ctx, 77, 57, 8, 4, 'rgba(48,56,36,0.45)');
  canvasEllipse(ctx, 39, 29, 6, 3, 'rgba(60,68,44,0.4)');

  // Vano con profundidad: gris piedra en el fondo, negro en los bordes.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(36, 84);
  ctx.lineTo(36, 62);
  ctx.arc(48, 62, 12, Math.PI, Math.PI * 2, false);
  ctx.lineTo(60, 84);
  ctx.closePath();
  ctx.clip();

  const depth = ctx.createRadialGradient(48, 74, 2, 48, 72, 32);
  depth.addColorStop(0, '#3f3f3a');
  depth.addColorStop(0.45, '#1b1b19');
  depth.addColorStop(0.78, '#070706');
  depth.addColorStop(1, '#000000');
  ctx.fillStyle = depth;
  ctx.fillRect(30, 44, 36, 42);

  const haze = ctx.createRadialGradient(48, 83, 1, 48, 83, 15);
  haze.addColorStop(0, 'rgba(96,92,80,0.3)');
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(30, 64, 36, 22);

  for (const [x, y, r, a] of [
    [44, 70, 0.9, 0.35], [52, 76, 1.1, 0.28], [47, 63, 0.7, 0.22],
    [56, 68, 0.8, 0.18], [41, 80, 1.0, 0.3], [50, 58, 0.6, 0.2],
    [54, 82, 0.8, 0.24],
  ]) {
    canvasEllipse(ctx, x, y, r, r, `rgba(198,188,158,${a})`);
  }
  ctx.restore();

  // Arco de dovelas (anillo entre radio interior y exterior).
  const springY = 62;
  const innerR = 12;
  const outerR = 21;
  ctx.beginPath();
  ctx.arc(48, springY, outerR, Math.PI, Math.PI * 2, false);
  ctx.lineTo(48 + innerR, springY);
  ctx.arc(48, springY, innerR, Math.PI * 2, Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = '#3b3a34';
  ctx.fill();
  ctx.strokeStyle = 'rgba(10,10,9,0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 1; i < 7; i++) {
    const a = Math.PI + (i / 7) * Math.PI;
    ctx.strokeStyle = 'rgba(14,14,12,0.75)';
    ctx.beginPath();
    ctx.moveTo(48 + Math.cos(a) * innerR, springY + Math.sin(a) * innerR);
    ctx.lineTo(48 + Math.cos(a) * outerR, springY + Math.sin(a) * outerR);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(146,138,118,0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(48, springY, outerR + 0.4, Math.PI, Math.PI * 1.42);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(126,120,102,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(48, springY, innerR - 0.6, Math.PI * 1.02, Math.PI * 1.4);
  ctx.stroke();

  // Jambas de sillares.
  for (const side of [-1, 1] as const) {
    const x0 = side < 0 ? 48 - outerR : 48 + innerR;
    const w = outerR - innerR;
    for (let k = 0; k < 3; k++) {
      const y = springY + k * 7.4;
      ctx.fillStyle = k % 2 === 0 ? '#41403a' : '#36352f';
      ctx.fillRect(x0, y, w, 7);
      ctx.strokeStyle = 'rgba(12,12,10,0.75)';
      ctx.strokeRect(x0 + 0.5, y + 0.5, w - 1, 6);
    }
    const litX = side < 0 ? x0 + 0.5 : x0 + w - 0.5;
    ctx.strokeStyle = side < 0 ? 'rgba(150,142,122,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(litX, springY);
    ctx.lineTo(litX, 84);
    ctx.stroke();
  }

  // Umbral isométrico al pie del arco.
  canvasPoly(ctx, [[48, 84], [82, 88], [48, 94], [14, 88]], '#1e1f1b');
  canvasPoly(ctx, [[48, 85], [76, 88], [48, 92], [20, 88]], '#2c2d27');
  ctx.strokeStyle = 'rgba(120,114,96,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 88);
  ctx.lineTo(48, 85);
  ctx.lineTo(76, 88);
  ctx.stroke();

  // Piedras sueltas.
  canvasEllipse(ctx, 26, 84, 5, 2.4, '#35342e');
  canvasEllipse(ctx, 70, 85, 4.5, 2, '#302f2a');
  canvasEllipse(ctx, 63, 90, 3.2, 1.6, '#2a2925');

  texture.refresh();
}

function createInstanceTextures(scene: Phaser.Scene): void {
  createCaveEntranceTexture(scene);

  createEntranceTexture(scene, 'entrance_mina', (g) => {
    g.fillStyle(0x1a1510, 0.5);
    g.fillEllipse(48, 84, 88, 18);

    // Talud de escombro.
    g.fillStyle(0x3f3f46, 1);
    g.fillEllipse(48, 58, 84, 46);
    g.fillStyle(0x52525b, 1);
    g.fillEllipse(42, 52, 62, 34);
    g.fillStyle(0x71717a, 0.95);
    g.fillEllipse(34, 46, 22, 10);

    // Galería.
    g.fillStyle(0x070708, 1);
    g.fillEllipse(48, 50, 32, 18);
    g.fillRect(32, 50, 32, 34);
    g.lineStyle(1.5, 0x2b2b31, 0.9);
    g.strokeRect(32, 50, 32, 34);

    // Marco de madera con refuerzos.
    g.fillStyle(0x4a3227, 1);
    g.fillRect(22, 38, 54, 9);
    g.fillStyle(0x5c4033, 1);
    g.fillRect(23, 44, 9, 42);
    g.fillRect(64, 44, 9, 42);
    g.fillStyle(0x7c5a41, 1);
    g.fillRect(23, 44, 3, 42);
    g.fillRect(64, 44, 3, 42);
    g.fillRect(22, 38, 54, 3);
    g.lineStyle(4, 0x4a3227, 1);
    g.lineBetween(29, 60, 39, 84);
    g.lineBetween(67, 60, 57, 84);

    // Farolillo.
    g.fillStyle(0x1f2937, 1);
    g.fillRect(77, 50, 3, 12);
    g.fillStyle(0xf59e0b, 0.35);
    g.fillCircle(78.5, 64, 9);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(78.5, 64, 4);
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(77.5, 63, 1.6);

    // Vagoneta y raíl.
    g.fillStyle(0x27272a, 1);
    g.fillRect(14, 82, 20, 3);
    g.fillStyle(0x57534e, 1);
    g.fillRect(17, 74, 13, 8);
    g.fillStyle(0x78716c, 1);
    g.fillRect(17, 74, 13, 2);
    g.fillStyle(0x1f2937, 1);
    g.fillCircle(19, 83, 2.2);
    g.fillCircle(28, 83, 2.2);
  });

  createEntranceTexture(scene, 'entrance_ruinas', (g) => {
    g.fillStyle(0x1a1510, 0.5);
    g.fillEllipse(48, 84, 90, 18);

    // Escalinata.
    g.fillStyle(0x44403c, 1);
    g.fillRect(22, 78, 52, 10);
    g.fillStyle(0x57534e, 1);
    g.fillRect(24, 74, 48, 6);
    g.fillStyle(0x78716c, 1);
    g.fillRect(26, 74, 44, 2);

    // Columnas y capiteles.
    g.fillStyle(0x57534e, 1);
    g.fillRect(20, 34, 13, 42);
    g.fillRect(63, 42, 13, 34);
    g.fillStyle(0x78716c, 1);
    g.fillRect(20, 34, 4, 42);
    g.fillRect(63, 42, 4, 34);
    g.fillStyle(0x3f3f46, 1);
    g.fillRect(30, 34, 3, 42);
    g.fillRect(73, 42, 3, 34);
    g.fillStyle(0x6b7280, 1);
    g.fillRect(17, 29, 19, 6);
    g.fillRect(60, 37, 19, 6);
    g.fillStyle(0x9ca3af, 1);
    g.fillRect(17, 29, 19, 2);
    g.fillRect(60, 37, 19, 2);

    // Dintel roto.
    g.fillStyle(0x57534e, 1);
    g.fillRect(20, 22, 36, 8);
    g.fillStyle(0x78716c, 1);
    g.fillRect(20, 22, 36, 3);
    g.fillStyle(0x3f3f46, 1);
    g.fillRect(52, 22, 4, 8);

    // Vano en sombra.
    g.fillStyle(0x080c10, 1);
    g.fillEllipse(48, 48, 26, 14);
    g.fillRect(35, 48, 26, 30);
    g.fillStyle(0x60a5fa, 0.08);
    g.fillEllipse(48, 58, 16, 24);

    // Sillares insinuados.
    g.lineStyle(1, 0x292524, 0.5);
    g.lineBetween(33, 60, 63, 60);
    g.lineBetween(33, 68, 63, 68);
    g.lineBetween(46, 52, 46, 78);

    // Hiedra y musgo.
    g.lineStyle(2, 0x3c4a2a, 0.9);
    g.beginPath();
    g.moveTo(20, 30);
    g.lineTo(22, 40);
    g.lineTo(19, 50);
    g.lineTo(22, 60);
    g.strokePath();
    g.lineStyle(1.5, 0x4c5a32, 0.8);
    g.beginPath();
    g.moveTo(74, 46);
    g.lineTo(71, 56);
    g.lineTo(74, 66);
    g.strokePath();
    g.fillStyle(0x3a4527, 0.85);
    g.fillEllipse(39, 27, 12, 5);
    g.fillEllipse(31, 24, 8, 4);

    // Piedras caídas.
    g.fillStyle(0x57534e, 1);
    g.fillEllipse(16, 86, 10, 5);
    g.fillEllipse(80, 87, 8, 4);
  });
}

/** Anillo de salpicadura (fauna acuática al emerger/saltar). */
function createSplashTexture(scene: Phaser.Scene): void {
  const key = 'splash_ring';
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.lineStyle(2, 0xaec2c6, 0.7);
  g.strokeEllipse(24, 12, 32, 10);
  g.lineStyle(1, 0x7d979e, 0.45);
  g.strokeEllipse(24, 12, 44, 14);
  g.fillStyle(0xc2d2d4, 0.4);
  g.fillEllipse(24, 12, 8, 3);
  g.generateTexture(key, 48, 24);
  g.destroy();
}

/** Halo neutro (se tiñe por tipo de instancia al colocarlo). */
function createGlowTexture(scene: Phaser.Scene): void {
  const key = 'poi_glow';
  if (scene.textures.exists(key)) return;

  const size = 128;
  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return;

  const ctx = texture.context;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.refresh();
}

const ROCK_LINE_DARK = 0x1c1b18;

/**
 * Cara superior de una meseta: rombo plano con la superficie del bioma. La
 * nieve solo cubre los picos (elevación 3); el resto de mesetas es roca.
 */
function createMountainTopTexture(
  scene: Phaser.Scene,
  type: 'montana' | 'nieve',
  variant: 0 | 1,
): void {
  const key = mountainTopTexture(type, variant === 1);
  if (scene.textures.exists(key)) return;

  const palette = MOUNTAIN_TOP[type];
  const snowy = type === 'nieve';
  const rng = mulberry32(stringToHash(`mtop_${type}_${variant}`));
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  fillPolygon(g, DIAMOND_BLEED, palette.base);

  for (let i = 0; i < 100; i++) {
    const x = 2 + rng() * 60;
    const y = 2 + rng() * 28;
    if (Math.abs(x - 32) / 31 + Math.abs(y - 16) / 15 > 0.93) continue;
    g.fillStyle(palette.specks[Math.floor(rng() * palette.specks.length)], 0.12 + rng() * 0.3);
    g.fillRect(Math.round(x), Math.round(y), rng() < 0.8 ? 1 : 2, 1);
  }

  if (snowy) {
    // Roca expuesta en los bordes: la nieve no cubre toda la meseta.
    for (let i = 0; i < 7; i++) {
      const x = 6 + rng() * 52;
      const y = 4 + rng() * 24;
      if (Math.abs(x - 32) / 31 + Math.abs(y - 16) / 15 < 0.55) continue;
      g.fillStyle(palette.rock ?? 0x47443c, 0.35 + rng() * 0.3);
      g.fillEllipse(x, y, 4 + rng() * 6, 2 + rng() * 2.4);
    }
  }

  g.lineStyle(1, snowy ? 0x6f777d : ROCK_LINE_DARK, snowy ? 0.4 : 0.5);
  for (let i = 0; i < 4; i++) {
    const sx = 12 + rng() * 40;
    const sy = 6 + rng() * 18;
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + 3 + rng() * 5, sy + 2 + rng() * 2);
    g.lineTo(sx + 7 + rng() * 6, sy + 1 + rng() * 3);
    g.strokePath();
  }

  // Canto de meseta: luz noroeste, sombra sureste. Alpha bajo para que un
  // macizo contiguo no se lea como una rejilla de losas.
  g.lineStyle(1, 0x6a6458, 0.22);
  g.lineBetween(32, 1, 1, 16);
  g.lineBetween(1, 16, 32, 31);
  g.lineStyle(1, 0x14130f, 0.28);
  g.lineBetween(32, 31, 63, 16);
  g.lineBetween(63, 16, 32, 1);

  g.generateTexture(key, TILE_WIDTH, TILE_HEIGHT);
  g.destroy();
}

function createMountainTopTextures(scene: Phaser.Scene): void {
  createMountainTopTexture(scene, 'montana', 0);
  createMountainTopTexture(scene, 'montana', 1);
  createMountainTopTexture(scene, 'nieve', 0);
  createMountainTopTexture(scene, 'nieve', 1);
}

/**
 * Muros verticales de acantilado. Cada variante cubre un desnivel de 1..3
 * niveles y se dibuja como un paralelogramo de 32 px de ancho: la cara SW
 * (iluminada) mira al vecino sur y la SE (en sombra) al vecino este.
 */
function createCliffWallTextures(scene: Phaser.Scene): void {
  (['sw', 'se'] as const).forEach((side) => {
    for (let levels = 1; levels <= 3; levels++) {
      for (let variant = 0; variant < 2; variant++) {
        const key = cliffWallTexture(side, levels, variant === 1);
        if (scene.textures.exists(key)) continue;

        const wallH = levels * CLIFF_STEP;
        const colors = WALL_COLORS[side];
        const rng = mulberry32(stringToHash(`wall_${side}_${levels}_${variant}`));
        const g = scene.make.graphics({ x: 0, y: 0 }, false);
        const topY = (x: number): number => (side === 'sw' ? x / 2 : 16 - x / 2);
        const shape: ReadonlyArray<Point> = side === 'sw'
          ? [[0, 0], [32, 16], [32, 16 + wallH], [0, wallH]]
          : [[0, 16], [32, 0], [32, wallH], [0, 16 + wallH]];

        fillPolygon(g, shape, colors.base);

        // Estrías verticales: lectura de roca sedimentaria del briefing.
        for (let i = 0; i < 11; i++) {
          const x = 1.5 + i * 2.9 + (rng() - 0.5) * 1.6;
          const y0 = topY(x) + 2 + rng() * 3;
          const y1 = topY(x) + wallH - 2 - rng() * 3;
          if (y1 <= y0) continue;
          g.lineStyle(1, rng() > 0.42 ? colors.light : colors.dark, 0.16 + rng() * 0.26);
          g.lineBetween(x, y0, x, y1);
        }

        for (let i = 0; i < 4; i++) {
          const x = 4 + rng() * 22;
          const y = topY(x) + 5 + rng() * Math.max(2, wallH - 8);
          g.lineStyle(1, colors.dark, 0.4);
          g.lineBetween(x - 2, y, x + 3 + rng() * 4, y + (rng() - 0.5) * 2);
        }

        g.lineStyle(1.5, colors.light, side === 'sw' ? 0.45 : 0.22);
        g.lineBetween(shape[0][0], shape[0][1], shape[1][0], shape[1][1]);

        // AO del pie: el muro se funde con el piso inferior, no corta en seco.
        for (let band = 0; band < 3; band++) {
          const inset = band * 2;
          const bottom: ReadonlyArray<Point> = side === 'sw'
            ? [[0, wallH - 7 + inset], [32, 16 + wallH - 7 + inset], [32, 16 + wallH], [0, wallH]]
            : [[0, 16 + wallH - 7 + inset], [32, wallH - 7 + inset], [32, wallH], [0, 16 + wallH]];
          fillPolygon(g, bottom, 0x000000, 0.1 + band * 0.09);
        }

        g.generateTexture(key, 32, 16 + wallH);
        g.destroy();
      }
    }
  });
}

/**
 * Sombra AO que el acantilado proyecta sobre el piso inferior. Se recorta al
 * rombo del tile y se concentra en la arista compartida con el muro: N para
 * un vecino norte más alto y W para un vecino oeste más alto.
 */
function createCliffShadowTextures(scene: Phaser.Scene): void {
  const make = (key: string, cx: number, cy: number, north: boolean): void => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, TILE_WIDTH, TILE_HEIGHT);
    if (!texture) return;
    const ctx = texture.context;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.clip();

    const gradient = ctx.createRadialGradient(cx, cy, 1, cx, cy, 38);
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(0.35, 'rgba(0,0,0,0.34)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.16)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TILE_WIDTH, TILE_HEIGHT);

    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (north) {
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 0);
      ctx.lineTo(64, 16);
    } else {
      ctx.moveTo(32, 0);
      ctx.lineTo(0, 16);
      ctx.lineTo(32, 32);
    }
    ctx.stroke();
    ctx.restore();
    texture.refresh();
  };

  make(CLIFF_SHADOW_KEY, 32, 0, true);
  make(CLIFF_SHADOW_W_KEY, 0, 16, false);
}

/** Runa de borde de salto: doble chevrón de qi, simétrico hacia arriba. */
function createJumpNodeTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(JUMP_NODE_KEY)) return;
  const texture = scene.textures.createCanvas(JUMP_NODE_KEY, 48, 30);
  if (!texture) return;
  const ctx = texture.context;

  const glow = ctx.createRadialGradient(24, 17, 1, 24, 17, 20);
  glow.addColorStop(0, 'rgba(126,178,150,0.32)');
  glow.addColorStop(0.6, 'rgba(96,140,118,0.14)');
  glow.addColorStop(1, 'rgba(96,140,118,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 48, 30);

  ctx.strokeStyle = 'rgba(190,222,200,0.9)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(13, 21);
  ctx.lineTo(24, 9);
  ctx.lineTo(35, 21);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(150,196,170,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(16, 25);
  ctx.lineTo(24, 16);
  ctx.lineTo(32, 25);
  ctx.stroke();

  for (const [x, y, r] of [[10, 12, 1.2], [38, 12, 1.0], [24, 5, 1.4], [17, 8, 0.8], [31, 8, 0.9]]) {
    ctx.fillStyle = 'rgba(214,236,222,0.55)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  texture.refresh();
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
    g.fillStyle(0x000000, 0.28);
    g.fillEllipse(16, 15, 18, 5);
    g.fillStyle(0x4a4840, 1);
    g.fillEllipse(16, 11, 14, 9);
    g.fillStyle(0x68655a, 1);
    g.fillEllipse(14, 9, 8, 4);
    g.fillStyle(0x32312b, 0.8);
    g.fillEllipse(20, 12, 5, 3);
  });

  createDecalTexture(scene, 'decal_grass', (g) => {
    const blades: Array<[number, number, number]> = [
      [9, 5, 0x39452a], [13, 2, 0x55613a], [16, 4, 0x2f3a24],
      [19, 3, 0x6b7748], [23, 6, 0x39452a], [11, 9, 0x4b5731],
    ];
    for (const [x, y, color] of blades) {
      g.lineStyle(2, color, 0.9);
      g.lineBetween(16, 17, x, y);
    }
    g.lineStyle(1, 0x7a855a, 0.65);
    g.lineBetween(16, 16, 14, 8);
    g.lineBetween(16, 16, 20, 9);
  });

  createDecalTexture(scene, 'decal_flower', (g) => {
    g.lineStyle(1.5, 0x3a452a, 0.9);
    g.lineBetween(16, 17, 16, 8);
    g.fillStyle(0x8f4a5a, 1);
    g.fillCircle(13, 7, 2.2);
    g.fillCircle(19, 7, 2.2);
    g.fillCircle(16, 4.5, 2.2);
    g.fillCircle(16, 9.5, 2.2);
    g.fillStyle(0xb8a06a, 1);
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
  const rng = mulberry32(stringToHash('macro_noise_v2'));
  const tones = ['#cfc6b2', '#c3c8bd', '#d2c9b4', '#b8beb2', '#cac2ac', '#bfc1b1'];

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
    ctx.fillStyle = rng() < 0.45 ? 'rgba(255,255,255,0.4)' : 'rgba(72,78,62,0.24)';
    ctx.fillRect(rng() * size, rng() * size, 1, 1);
  }

  texture.refresh();
}

function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

function groundColor(type: string): number {
  if (type === 'montana') return 0x3a3833;
  if (type === 'agua') return 0x1f3a45;
  const palette = GROUND[type as FlatTileType] ?? GROUND.hierba;
  return palette.base;
}

/**
 * Color del ecotono: ambos lados de una frontera pintan el MISMO tono mezclado.
 * Si cada lado pintara el color del vecino, el borde seguiría siendo un corte
 * de color (intercambiado); con una mezcla común, la línea desaparece.
 */
function transitionColor(base: string, target: string): number {
  if (base === 'agua') return 0x9fb4b8; // espuma de orilla
  if (target === 'agua') return mixColor(groundColor(base), 0x24414c, 0.5);
  return mixColor(groundColor(base), groundColor(target), 0.55);
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

/**
 * Blend orgánico hacia el tile vecino: varias capas del color vecino con
 * borde irregular y alfa acumulada (~0.5 junto a la frontera) que se difumina
 * hacia el centro. Sin línea de borde recta: la transición se lee como pintura.
 */
function drawEdgeWedge(
  g: Phaser.GameObjects.Graphics,
  side: IsoSide,
  color: number,
  rng: () => number,
): void {
  const [a, b] = EDGES[side];
  const steps = 8;
  const bands = 6;

  for (let band = bands - 1; band >= 0; band--) {
    const reach = 0.12 + (band / (bands - 1)) * 0.62;
    const inner: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      const depth = Math.min(0.82, Math.max(0.04, reach + (rng() - 0.5) * 0.2));
      inner.push({
        x: px + (CENTER.x - px) * depth,
        y: py + (CENTER.y - py) * depth,
      });
    }

    g.fillStyle(color, 0.15);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    for (let i = inner.length - 1; i >= 0; i--) g.lineTo(inner[i].x, inner[i].y);
    g.closePath();
    g.fillPath();
  }

  // Manchas centradas en la arista: cada tile pinta su mitad y ambas mitades
  // se empalman en el mismo color, borrando la costura recta.
  for (let i = 0; i < 3; i++) {
    const t = 0.15 + rng() * 0.7;
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    g.fillStyle(color, 0.12 + rng() * 0.08);
    g.fillEllipse(px, py, 4 + rng() * 5, 2 + rng() * 2.5);
  }

  // Motas del vecino que "invaden" el tile: rompen cualquier resto de línea.
  for (let i = 0; i < 20; i++) {
    const t = rng();
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    const depth = 0.08 + rng() * 0.82;
    g.fillStyle(color, 0.14 + rng() * 0.3);
    g.fillCircle(
      px + (CENTER.x - px) * depth,
      py + (CENTER.y - py) * depth,
      0.7 + rng() * 2.2,
    );
  }

  // Hebras alargadas hacia el interior (briznas/arena llevadas por el viento).
  for (let i = 0; i < 5; i++) {
    const t = rng();
    const px = a.x + (b.x - a.x) * t;
    const py = a.y + (b.y - a.y) * t;
    const depth = 0.15 + rng() * 0.4;
    const ix = px + (CENTER.x - px) * depth;
    const iy = py + (CENTER.y - py) * depth;
    const jx = (CENTER.x - ix) * (0.12 + rng() * 0.26);
    const jy = (CENTER.y - iy) * (0.12 + rng() * 0.26);
    g.lineStyle(1, color, 0.22);
    g.lineBetween(ix, iy, ix + jx + (rng() - 0.5) * 3, iy + jy);
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
  const color = transitionColor(base, target);
  for (const side of sidesInMask(mask)) {
    const rng = mulberry32(stringToHash(`edge_${base}_${target}_${side}`));
    drawEdgeWedge(g, side, color, rng);
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
  createWaterFlowTexture(scene);
  createWaterShadeTextures(scene);
  createMountainTopTextures(scene);
  createCliffWallTextures(scene);
  createCliffShadowTextures(scene);
  createJumpNodeTexture(scene);
  createDecalTextures(scene);
  createMacroNoiseTexture(scene);
  createInstanceTextures(scene);
  createGlowTexture(scene);
  createSplashTexture(scene);
}
