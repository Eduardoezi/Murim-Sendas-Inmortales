// src/game/rendering/treeTextures.ts
// ─────────────────────────────────────────────────────────────────────────────
// Flora procedural con volumen cel-shading. Seis especies dibujadas en tres
// capas de follaje (oscuro en la base, medio, claro arriba a la izquierda,
// luz fija del suroeste) + sombra de anclaje separada. Las palmeras usan
// curvas Bézier muestreadas para que las hojas caigan, nunca líneas rectas.
// ─────────────────────────────────────────────────────────────────────────────
import type Phaser from 'phaser';
import { mulberry32, stringToHash } from '../../core/utils/prng';

export const TREE_WIDTH = 96;
export const TREE_HEIGHT = 128;
export const TREE_BASE_Y = 118;
export const TREE_ORIGIN_Y = TREE_BASE_Y / TREE_HEIGHT;
export const TREE_SHADOW_KEY = 'tree_shadow';

type Point = { x: number; y: number };

interface Palette {
  dark: number;
  mid: number;
  light: number;
  hi: number;
}

const OAK: Palette = { dark: 0x1d2a1b, mid: 0x2f4026, light: 0x465a33, hi: 0x66784a };
const PINE: Palette = { dark: 0x121d15, mid: 0x1e2f21, light: 0x2d422d, hi: 0x4c6043 };
const PALM: Palette = { dark: 0x27331f, mid: 0x384828, light: 0x526238, hi: 0x748652 };
const WILLOW: Palette = { dark: 0x2b341c, mid: 0x3f4a26, light: 0x586534, hi: 0x7a874c };
const SAKURA: Palette = { dark: 0x4a2029, mid: 0x6e3440, light: 0x8f4a55, hi: 0xb06b72 };
const BARK: Palette = { dark: 0x231a12, mid: 0x39291c, light: 0x50402c, hi: 0x6d5840 };
const DEAD: Palette = { dark: 0x1b1917, mid: 0x34302b, light: 0x504a42, hi: 0x6a6256 };

function poly(g: Phaser.GameObjects.Graphics, pts: Point[], color: number, alpha = 1): void {
  if (pts.length < 3) return;
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();
}

function stroke(
  g: Phaser.GameObjects.Graphics,
  pts: Point[],
  color: number,
  width: number,
  alpha = 1,
): void {
  if (pts.length < 2) return;
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

function sampleQuad(p0: Point, control: Point, p1: Point, steps = 10): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    out.push({
      x: it * it * p0.x + 2 * it * t * control.x + t * t * p1.x,
      y: it * it * p0.y + 2 * it * t * control.y + t * t * p1.y,
    });
  }
  return out;
}

function sampleCubic(p0: Point, c1: Point, c2: Point, p1: Point, steps = 12): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    out.push({
      x: it * it * it * p0.x + 3 * it * it * t * c1.x + 3 * it * t * t * c2.x + t * t * t * p1.x,
      y: it * it * it * p0.y + 3 * it * it * t * c1.y + 3 * it * t * t * c2.y + t * t * t * p1.y,
    });
  }
  return out;
}

function trunkEdges(pts: Point[], widthBase: number, widthTop: number) {
  const plus: Point[] = [];
  const minus: Point[] = [];
  const n = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (widthBase + (widthTop - widthBase) * t) / 2;
    plus.push({ x: p.x + nx * w, y: p.y + ny * w });
    minus.push({ x: p.x - nx * w, y: p.y - ny * w });
  }
  return { plus, minus };
}

/** Tronco de tres tonos con refuerzo oscuro y filo iluminado a la izquierda. */
function drawTrunk(
  g: Phaser.GameObjects.Graphics,
  pts: Point[],
  widthBase: number,
  widthTop: number,
  pal: Palette,
  roots = true,
): void {
  const silhouette = trunkEdges(pts, widthBase + 2.4, widthTop + 2.4);
  poly(g, [...silhouette.plus, ...silhouette.minus.slice().reverse()], pal.dark);

  const body = trunkEdges(pts, widthBase, widthTop);
  poly(g, [...body.plus, ...body.minus.slice().reverse()], pal.mid);

  const inner = trunkEdges(pts, widthBase * 0.34, widthTop * 0.34);
  poly(g, [...body.minus, ...inner.minus.slice().reverse()], pal.light);

  // Vetas de corteza.
  g.lineStyle(1, pal.dark, 0.35);
  for (let k = 0; k < 3; k++) {
    const i = Math.min(pts.length - 2, 2 + k * 2);
    const a = pts[i];
    const b = pts[i + 1];
    g.lineBetween(a.x + 2.4, a.y, b.x + 2.1, b.y);
  }

  if (roots) {
    const base = pts[pts.length - 1];
    const half = widthBase / 2;
    poly(g, [
      { x: base.x - half - 1, y: base.y },
      { x: base.x - half - 6, y: base.y + 1 },
      { x: base.x - half + 2, y: base.y - 5 },
    ], pal.dark);
    poly(g, [
      { x: base.x + half + 1, y: base.y },
      { x: base.x + half + 6, y: base.y + 1 },
      { x: base.x + half - 2, y: base.y - 5 },
    ], pal.dark);
  }
}

/** Rama fina en tres tonos (silueta, cuerpo, filo iluminado). */
function drawBranch(
  g: Phaser.GameObjects.Graphics,
  pts: Point[],
  width: number,
  pal: Palette,
): void {
  stroke(g, pts, pal.dark, width + 2.6);
  stroke(g, pts, pal.mid, width);
  stroke(g, pts.map((p) => ({ x: p.x - 1.1, y: p.y - 1.4 })), pal.light, Math.max(1, width * 0.3), 0.9);
}

interface Blob {
  angle: number;
  dist: number;
  radius: number;
}

function makeBlobs(rng: () => number, count: number): Blob[] {
  return Array.from({ length: count }, () => ({
    angle: rng() * Math.PI * 2,
    dist: Math.sqrt(rng()) * 0.55,
    radius: 0.62 + rng() * 0.55,
  }));
}

/**
 * Copa en tres capas: silueta oscura (base/sureste), cuerpo medio y luz
 * arriba-izquierda, con motas de brillo. El desplazamiento de cada capa es
 * lo que crea la lectura de volumen sin degradados.
 */
function drawCrown(
  g: Phaser.GameObjects.Graphics,
  rng: () => number,
  blobs: Blob[],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  pal: Palette,
  betweenLayers?: () => void,
): void {
  const layers = [
    { color: pal.dark, dx: 0, dy: 0, k: 1 },
    { color: pal.mid, dx: -rx * 0.1, dy: -ry * 0.18, k: 0.88 },
    { color: pal.light, dx: -rx * 0.2, dy: -ry * 0.36, k: 0.72 },
  ];

  for (let i = 0; i < layers.length; i++) {
    if (i === 1) betweenLayers?.();
    const layer = layers[i];
    g.fillStyle(layer.color, 1);
    for (const b of blobs) {
      const bx = cx + layer.dx + Math.cos(b.angle) * rx * layer.k * b.dist;
      const by = cy + layer.dy + Math.sin(b.angle) * ry * layer.k * b.dist;
      g.fillEllipse(bx, by, rx * 0.62 * layer.k * b.radius, ry * 0.62 * layer.k * b.radius);
    }
  }

  // Brillos de la cara iluminada (arriba-izquierda).
  g.fillStyle(pal.hi, 0.55);
  for (let i = 0; i < 9; i++) {
    const angle = Math.PI + rng() * Math.PI * 0.55;
    const dist = (0.25 + rng() * 0.45) * 0.8;
    g.fillEllipse(
      cx - rx * 0.18 + Math.cos(angle) * rx * dist,
      cy - ry * 0.32 + Math.sin(angle) * ry * dist,
      2.5 + rng() * 5,
      1.6 + rng() * 3,
    );
  }
}

function drawOak(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  // Tronco ancho y alto: la copa lo penetra, no flota sobre él.
  drawTrunk(g, sampleQuad({ x: 48, y: 118 }, { x: 45, y: 90 }, { x: 47, y: 58 }, 7), 30, 14, BARK);

  drawBranch(g, sampleQuad({ x: 47, y: 88 }, { x: 35, y: 76 }, { x: 29, y: 60 }, 8), 7, BARK);
  drawBranch(g, sampleQuad({ x: 47, y: 82 }, { x: 59, y: 72 }, { x: 67, y: 56 }, 8), 6.5, BARK);
  drawBranch(g, sampleQuad({ x: 47, y: 72 }, { x: 52, y: 62 }, { x: 57, y: 50 }, 6), 5, BARK);

  drawCrown(g, rng, makeBlobs(rng, 14), 47, 45, 64, 36, OAK);
}

function drawPineTier(
  g: Phaser.GameObjects.Graphics,
  rng: () => number,
  cx: number,
  baseY: number,
  halfWidth: number,
  height: number,
  pal: Palette,
): void {
  const apex = { x: cx, y: baseY - height };
  const left = { x: cx - halfWidth, y: baseY };
  const right = { x: cx + halfWidth, y: baseY };

  // Borde inferior con muescas (silueta irregular de ramas).
  const bottom: Point[] = [];
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    bottom.push({
      x: left.x + (right.x - left.x) * t,
      y: baseY - (i % 2 === 0 ? 0 : 1.5 + rng() * 2.5),
    });
  }

  poly(g, [apex, left, ...bottom, right], pal.dark);

  const mid = [
    { x: apex.x - 1.5, y: apex.y + 2 },
    { x: left.x + 3, y: baseY - 3 },
    ...bottom.map((p) => ({ x: p.x - 1, y: p.y - 4 })),
    { x: right.x - 3, y: baseY - 3 },
  ];
  poly(g, mid, pal.mid);

  // Cara iluminada de la rama (izquierda).
  poly(g, [
    { x: apex.x - 1.5, y: apex.y + 2 },
    { x: left.x + 3, y: baseY - 3 },
    { x: cx - halfWidth * 0.18, y: baseY - 5 },
    { x: cx - halfWidth * 0.1, y: apex.y + height * 0.38 },
  ], pal.light);

  g.lineStyle(1, pal.hi, 0.4);
  g.lineBetween(apex.x - 1, apex.y + 1, left.x + 3, baseY - 3);
}

function drawPine(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  drawTrunk(g, sampleQuad({ x: 48, y: 118 }, { x: 48, y: 104 }, { x: 48, y: 86 }, 4), 20, 9, BARK);

  const tiers = [
    { y: 97, hw: 33, h: 27 },
    { y: 83, hw: 28, h: 25 },
    { y: 69, hw: 23, h: 23 },
    { y: 55, hw: 18, h: 21 },
    { y: 41, hw: 13, h: 18 },
    { y: 27, hw: 8, h: 16 },
  ];
  for (const tier of tiers) {
    drawPineTier(g, rng, 48, tier.y, tier.hw, tier.h, PINE);
  }

  // Escarcha: pequeños copos en los bordes superiores.
  g.fillStyle(0xe2e8f0, 0.55);
  for (let i = 0; i < 8; i++) {
    const tier = tiers[1 + Math.floor(rng() * 5)];
    const t = rng() * 0.7;
    g.fillEllipse(48 - tier.hw * t, tier.y - tier.h * (1 - t) * 0.85, 2 + rng() * 3, 1.2 + rng() * 1.6);
  }
}

function drawFrond(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  angle: number,
  length: number,
  droop: number,
  bodyColor: number,
  leafColor: number,
  veinColor: number,
  rng: () => number,
): void {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const steps = 14;
  const spine: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Caída gravitatoria: la punta siempre cuelga más que el nacimiento.
    spine.push({
      x: ox + dirX * length * t + Math.sin(t * Math.PI) * rng() * 0.8,
      y: oy + dirY * length * t + droop * t * t,
    });
  }

  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = spine[i];
    const prev = spine[Math.max(0, i - 1)];
    const next = spine[Math.min(steps, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = Math.pow(Math.sin(Math.PI * t), 0.7) * 3.4;
    left.push({ x: p.x + nx * w, y: p.y + ny * w });
    right.push({ x: p.x - nx * w, y: p.y - ny * w });
  }

  poly(g, [...left, ...right.slice().reverse()], bodyColor);
  stroke(g, spine, veinColor, 0.8, 0.5);

  // Foliolos: plumas perpendiculares que caen ligeramente.
  g.lineStyle(1, leafColor, 0.75);
  for (let i = 2; i < steps - 1; i++) {
    const t = i / steps;
    const p = spine[i];
    const prev = spine[i - 1];
    const next = spine[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const leafLen = Math.sin(Math.PI * t) * 8;
    const fallX = (dx / len) * 1.6;
    const fallY = (dy / len) * 1.6 + 1.6;
    g.lineBetween(p.x, p.y, p.x + nx * leafLen + fallX, p.y + ny * leafLen + fallY);
    g.lineBetween(p.x, p.y, p.x - nx * leafLen + fallX, p.y - ny * leafLen + fallY);
  }
}

function drawPalm(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  const trunk = sampleQuad({ x: 45, y: 118 }, { x: 40, y: 88 }, { x: 59, y: 55 }, 10);
  drawTrunk(g, trunk, 18, 8, BARK);

  // Anillos del tronco de palmera.
  for (let i = 2; i < trunk.length - 1; i += 2) {
    const p = trunk[i];
    const next = trunk[i + 1];
    const angle = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
    const r = 5.2 - (i / trunk.length) * 1.8;
    g.lineStyle(1, BARK.dark, 0.5);
    g.lineBetween(
      p.x + Math.cos(angle) * r,
      p.y + Math.sin(angle) * r,
      p.x - Math.cos(angle) * r,
      p.y - Math.sin(angle) * r,
    );
  }

  const crown = { x: 59, y: 54 };
  const fronds = [
    { angle: -2.95, length: 35, droop: 20, layer: 0 },
    { angle: -2.52, length: 38, droop: 16, layer: 0 },
    { angle: -2.08, length: 40, droop: 13, layer: 1 },
    { angle: -1.6, length: 41, droop: 12, layer: 1 },
    { angle: -1.12, length: 40, droop: 14, layer: 1 },
    { angle: -0.62, length: 38, droop: 18, layer: 2 },
    { angle: -0.12, length: 35, droop: 22, layer: 2 },
    { angle: 0.36, length: 30, droop: 24, layer: 2 },
  ];
  for (const frond of fronds) {
    const colors = frond.layer === 0
      ? { body: PALM.dark, leaf: PALM.mid, vein: PALM.light }
      : frond.layer === 1
        ? { body: PALM.mid, leaf: PALM.light, vein: PALM.hi }
        : { body: PALM.light, leaf: PALM.hi, vein: PALM.hi };
    drawFrond(
      g, crown.x, crown.y, frond.angle, frond.length, frond.droop,
      colors.body, colors.leaf, colors.vein, rng,
    );
  }

  // Cocos bajo la corona.
  g.fillStyle(0x4a3227, 1);
  g.fillCircle(55, 58, 4);
  g.fillCircle(63, 61, 3.4);
  g.fillStyle(0x8b5a2b, 0.85);
  g.fillCircle(54, 57, 1.5);
  g.fillCircle(62, 60, 1.2);
}

function drawWillow(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  drawTrunk(g, sampleQuad({ x: 48, y: 118 }, { x: 44, y: 92 }, { x: 47, y: 55 }, 7), 31, 15, BARK);
  drawBranch(g, sampleQuad({ x: 47, y: 84 }, { x: 34, y: 70 }, { x: 28, y: 56 }, 7), 6.5, BARK);
  drawBranch(g, sampleQuad({ x: 47, y: 78 }, { x: 60, y: 68 }, { x: 67, y: 54 }, 7), 6.5, BARK);

  const drawStrand = (color: number, count: number, minLen: number, maxLen: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const startX = 17 + t * 62 + (rng() - 0.5) * 3;
      const startY = 30 + Math.sin(t * Math.PI) * 13;
      const len = minLen + rng() * (maxLen - minLen);
      const sway = (rng() - 0.5) * 10;
      const pts: Point[] = [];
      for (let k = 0; k <= 8; k++) {
        const s = k / 8;
        pts.push({
          x: startX + Math.sin(s * 2.4 + t * 5) * sway * s,
          y: startY + len * s,
        });
      }
      stroke(g, pts, color, 1.7, alpha);

      // Hojitas a lo largo de la hebra.
      g.lineStyle(1, color, alpha * 0.75);
      for (let k = 2; k < 8; k += 2) {
        const p = pts[k];
        const side = k % 4 === 0 ? 1 : -1;
        g.lineBetween(p.x, p.y, p.x + 2.6 * side, p.y + 1.4);
      }
    }
  };

  // Hebras traseras, copa; las delanteras cuelgan por dentro, entre la
  // primera capa de hojas y la segunda.
  drawStrand(WILLOW.dark, 8, 46, 62, 0.85);
  drawCrown(g, rng, makeBlobs(rng, 13), 47, 45, 64, 39, WILLOW, () => {
    drawStrand(WILLOW.mid, 9, 32, 50, 0.9);
    drawStrand(WILLOW.light, 7, 20, 36, 0.95);
  });
}

function drawSakura(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  const trunk = sampleQuad({ x: 48, y: 118 }, { x: 51, y: 94 }, { x: 46, y: 60 }, 7);
  drawTrunk(g, trunk, 25, 12, BARK);
  drawBranch(g, sampleQuad({ x: 46, y: 88 }, { x: 34, y: 76 }, { x: 29, y: 61 }, 8), 6, BARK);
  drawBranch(g, sampleQuad({ x: 46, y: 82 }, { x: 58, y: 74 }, { x: 66, y: 59 }, 8), 6, BARK);
  drawBranch(g, sampleQuad({ x: 46, y: 74 }, { x: 42, y: 62 }, { x: 39, y: 50 }, 7), 4.6, BARK);

  const blobs = makeBlobs(rng, 18);
  drawCrown(g, rng, blobs, 47, 45, 55, 35, SAKURA);

  // Racimos de flores sueltos sobre la copa.
  for (let i = 0; i < 34; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = Math.sqrt(rng()) * 0.85;
    const x = 47 + Math.cos(angle) * 32 * dist;
    const y = 45 + Math.sin(angle) * 22 * dist;
    const tone = rng();
    g.fillStyle(tone > 0.72 ? SAKURA.hi : tone > 0.35 ? SAKURA.light : SAKURA.mid, 0.95);
    g.fillCircle(x, y, 1.3 + rng() * 2);
  }

  // Pétalos al viento.
  g.fillStyle(SAKURA.light, 0.8);
  for (let i = 0; i < 7; i++) {
    g.fillEllipse(20 + rng() * 58, 72 + rng() * 30, 2.4 + rng() * 1.6, 1.4 + rng() * 1.2);
  }
}

function drawDead(g: Phaser.GameObjects.Graphics, rng: () => number): void {
  const trunk = sampleQuad({ x: 48, y: 118 }, { x: 44, y: 92 }, { x: 47, y: 62 }, 7);
  drawTrunk(g, trunk, 18, 7, DEAD);

  // Ramas retorcidas, de más gruesa a más fina.
  drawBranch(g, sampleQuad({ x: 47, y: 92 }, { x: 33, y: 82 }, { x: 25, y: 62 }, 8), 4.8, DEAD);
  drawBranch(g, sampleQuad({ x: 25, y: 62 }, { x: 20, y: 54 }, { x: 22, y: 44 }, 5), 2.4, DEAD);
  drawBranch(g, sampleQuad({ x: 47, y: 84 }, { x: 63, y: 76 }, { x: 71, y: 58 }, 8), 4, DEAD);
  drawBranch(g, sampleQuad({ x: 71, y: 58 }, { x: 74, y: 48 }, { x: 70, y: 40 }, 5), 2.2, DEAD);
  drawBranch(g, sampleQuad({ x: 47, y: 74 }, { x: 38, y: 66 }, { x: 37, y: 49 }, 7), 3.2, DEAD);
  drawBranch(g, sampleQuad({ x: 47, y: 62 }, { x: 52, y: 52 }, { x: 57, y: 38 }, 7), 3, DEAD);
  drawBranch(g, sampleQuad({ x: 47, y: 62 }, { x: 46, y: 52 }, { x: 41, y: 42 }, 6), 2.4, DEAD);

  // Nudos y grietas.
  g.fillStyle(DEAD.dark, 0.9);
  g.fillEllipse(45, 88, 7, 9);
  g.fillEllipse(48, 72, 5, 7);
  g.lineStyle(1, DEAD.light, 0.5);
  g.lineBetween(44, 84, 45, 91);
  g.lineBetween(47, 69, 48, 75);

  // Pequeños hongos en la base.
  g.fillStyle(0x7f1d1d, 0.9);
  g.fillEllipse(37, 115, 6, 3);
  g.fillStyle(0xef4444, 0.9);
  g.fillEllipse(37, 114, 5, 2.2);
  g.fillStyle(0xf8fafc, 0.8);
  g.fillCircle(36, 114, 0.8);
  g.fillStyle(0x7f1d1d, 0.9);
  g.fillEllipse(60, 116, 4, 2);
  g.fillStyle(0xef4444, 0.9);
  g.fillEllipse(60, 115, 3.4, 1.6);

  // Polvo/veta.
  g.fillStyle(DEAD.mid, 0.4);
  for (let i = 0; i < 8; i++) {
    g.fillRect(38 + rng() * 16, 78 + rng() * 38, 1, 1.6);
  }
}

function createTreeShadow(scene: Phaser.Scene): void {
  if (scene.textures.exists(TREE_SHADOW_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(28, 11, 54, 18);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(28, 11, 42, 14);
  g.fillStyle(0x000000, 0.27);
  g.fillEllipse(28, 11, 28, 9);
  g.generateTexture(TREE_SHADOW_KEY, 56, 22);
  g.destroy();
}

type TreeDrawer = (g: Phaser.GameObjects.Graphics, rng: () => number) => void;

const TREES: Array<[string, TreeDrawer]> = [
  ['tree_round', drawOak],
  ['tree_pine', drawPine],
  ['tree_palm', drawPalm],
  ['tree_willow', drawWillow],
  ['tree_sakura', drawSakura],
  ['tree_dead', drawDead],
];

export function ensureTreeTextures(scene: Phaser.Scene): void {
  for (const [key, draw] of TREES) {
    if (scene.textures.exists(key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const rng = mulberry32(stringToHash(`flora_v2_${key}`));
    draw(g, rng);
    g.generateTexture(key, TREE_WIDTH, TREE_HEIGHT);
    g.destroy();
  }
  createTreeShadow(scene);
}
