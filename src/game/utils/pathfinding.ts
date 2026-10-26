import { Point } from '../../core/data/world/types';

class MinHeap<T> {
  private data: T[] = [];
  constructor(private compare: (a: T, b: T) => number) {}

  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();
    const min = this.data[0];
    this.data[0] = this.data.pop()!;
    this.sinkDown(0);
    return min;
  }

  get length(): number {
    return this.data.length;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(this.data[index], this.data[parent]) >= 0) break;
      [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
      index = parent;
    }
  }

  private sinkDown(index: number): void {
    const length = this.data.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.data[left], this.data[smallest]) < 0) smallest = left;
      if (right < length && this.compare(this.data[right], this.data[smallest]) < 0) smallest = right;
      if (smallest === index) break;

      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }
}

interface PathNode extends Point {
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

const SQRT2 = Math.SQRT2;
const MAX_ITERATIONS = 6000; // Guarda contra búsquedas infinitas

/**
 * A* de 8 direcciones con heurística Octile (admisible para diagonales)
 * y prevención de "corner-cutting" entre celdas ortogonales bloqueadas.
 */
export function findPath(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  isBlocked: (x: number, y: number) => boolean
): Point[] {
  if (startX === targetX && startY === targetY) return [{ x: startX, y: startY }];

  const startNode: PathNode = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null };
  const openSet = new MinHeap<PathNode>((a, b) => a.f - b.f);
  const closedSet = new Set<string>();
  const openSetMap = new Map<string, PathNode>();

  const getHeuristic = (x: number, y: number): number => {
    const dx = Math.abs(x - targetX);
    const dy = Math.abs(y - targetY);
    // Octile: D*(dx+dy) + (D2 - 2D)*min(dx,dy), con D=1, D2=SQRT2
    return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
  };

  const directions: ReadonlyArray<{ dx: number; dy: number }> = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 },
  ];

  openSet.push(startNode);
  openSetMap.set(`${startX},${startY}`, startNode);

  let iterations = 0;

  while (openSet.length > 0 && iterations++ < MAX_ITERATIONS) {
    const current = openSet.pop()!;
    const currentKey = `${current.x},${current.y}`;
    if (closedSet.has(currentKey)) continue;

    openSetMap.delete(currentKey);

    if (current.x === targetX && current.y === targetY) {
      const path: Point[] = [];
      let temp: PathNode | null = current;
      while (temp) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    closedSet.add(currentKey);

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const nKey = `${nx},${ny}`;

      if (closedSet.has(nKey)) continue;
      if (isBlocked(nx, ny)) continue;

      // Anti corner-cutting: no permitir diagonal si alguna ortogonal vecina está bloqueada
      const isDiagonal = dir.dx !== 0 && dir.dy !== 0;
      if (isDiagonal) {
        if (isBlocked(current.x + dir.dx, current.y) || isBlocked(current.x, current.y + dir.dy)) {
          continue;
        }
      }

      const stepCost = isDiagonal ? SQRT2 : 1;
      const g = current.g + stepCost;
      const h = getHeuristic(nx, ny);
      const f = g + h;

      const existing = openSetMap.get(nKey);
      if (!existing) {
        const newNode: PathNode = { x: nx, y: ny, g, h, f, parent: current };
        openSet.push(newNode);
        openSetMap.set(nKey, newNode);
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = f;
        existing.parent = current;
        openSet.push(existing);
      }
    }
  }

  return [];
}