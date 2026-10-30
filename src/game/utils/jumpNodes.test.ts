import '../../core/data/world/generators/geoSampler';
import { describe, expect, it } from 'vitest';
import {
  JUMP_NODE_CHANCE,
  JumpNode,
  jumpNodeForLowTile,
  jumpNodeNear,
  jumpNodesInChunk,
} from './jumpNodes';
import { getElevationAt, getTileTypeAt } from '../../core/data/world/generators/terrainGenerator';

const REGION = { x0: 540, y0: 560, w: 100, h: 80 };

function collectNodes(): JumpNode[] {
  const out: JumpNode[] = [];
  for (let y = REGION.y0; y < REGION.y0 + REGION.h; y++) {
    for (let x = REGION.x0; x < REGION.x0 + REGION.w; x++) {
      const node = jumpNodeForLowTile(x, y);
      if (node) out.push(node);
    }
  }
  return out;
}

function countEligibleEdges(): number {
  let eligible = 0;
  for (let y = REGION.y0; y < REGION.y0 + REGION.h; y++) {
    for (let x = REGION.x0; x < REGION.x0 + REGION.w; x++) {
      const elevation = getElevationAt(x, y);
      if (getElevationAt(x, y - 1) === elevation + 1) eligible++;
      if (getElevationAt(x - 1, y) === elevation + 1) eligible++;
    }
  }
  return eligible;
}

describe('jumpNodes', () => {
  const nodes = collectNodes();

  it('genera runas en bordes reales, sin saturar los acantilados', () => {
    const eligible = countEligibleEdges();
    expect(eligible).toBeGreaterThan(0);
    expect(nodes.length).toBeGreaterThan(0);
    // "No son comunes": la tasa observada ronda JUMP_NODE_CHANCE.
    expect(nodes.length / eligible).toBeLessThan(JUMP_NODE_CHANCE * 2);
  });

  it('siempre sube exactamente un nivel y solo por caras visibles (norte/oeste)', () => {
    for (const node of nodes) {
      expect(getElevationAt(node.to.x, node.to.y)).toBe(
        getElevationAt(node.from.x, node.from.y) + 1,
      );
      const north = node.to.y === node.from.y - 1 && node.to.x === node.from.x;
      const west = node.to.x === node.from.x - 1 && node.to.y === node.from.y;
      expect(north || west).toBe(true);
      expect(getElevationAt(node.from.x, node.from.y)).toBeLessThan(3);
      expect(getTileTypeAt(node.from.x, node.from.y)).not.toBe('agua');
    }
  });

  it('es determinista entre llamadas', () => {
    for (const node of nodes.slice(0, 10)) {
      expect(jumpNodeForLowTile(node.from.x, node.from.y)).toEqual(node);
    }
  });

  it('nunca coloca una runa sobre agua, aunque haya montaña al lado', () => {
    // (725,506) es agua con lindero de elevación 1: la guarda debe descartarla.
    expect(getTileTypeAt(725, 506)).toBe('agua');
    expect(getElevationAt(725, 506)).toBe(0);
    expect(jumpNodeForLowTile(725, 506)).toBeNull();

    for (let y = 500; y <= 515; y++) {
      for (let x = 715; x <= 740; x++) {
        if (getTileTypeAt(x, y) !== 'agua') continue;
        expect(jumpNodeForLowTile(x, y)).toBeNull();
      }
    }
  });

  it('el clic encuentra el nodo desde cualquiera de sus dos extremos', () => {
    const node = jumpNodeForLowTile(581, 571);
    expect(node).toEqual({ from: { x: 581, y: 571 }, to: { x: 581, y: 570 } });

    expect(jumpNodeNear(581, 571, 1)).toEqual(node);
    expect(jumpNodeNear(581, 570, 1)).toEqual(node);
    expect(jumpNodeNear(581, 571, 0)).toEqual(node);
  });

  it('no inventa nodos lejos de los bordes', () => {
    expect(jumpNodeNear(583, 581, 1)).toBeNull();
  });

  it('jumpNodesInChunk coincide con el escaneo por tile', () => {
    const chunkX = Math.floor(581 / 16);
    const chunkY = Math.floor(571 / 16);
    const inChunk = jumpNodesInChunk(chunkX, chunkY, 16);
    expect(inChunk.some((n) => n.from.x === 581 && n.from.y === 571)).toBe(true);
    for (const node of inChunk) {
      expect(Math.floor(node.from.x / 16)).toBe(chunkX);
      expect(Math.floor(node.from.y / 16)).toBe(chunkY);
      expect(jumpNodeForLowTile(node.from.x, node.from.y)).toEqual(node);
    }
  });
});
