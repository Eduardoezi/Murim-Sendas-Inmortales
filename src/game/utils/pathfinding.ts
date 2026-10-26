// src/game/utils/pathfinding.ts
export interface Point {
  x: number;
  y: number;
}

export function findPath(
  startX: number, 
  startY: number, 
  targetX: number, 
  targetY: number, 
  isBlocked: (x: number, y: number) => boolean
): Point[] {
  
  const startNode = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null as any };
  const openSet: typeof startNode[] = [startNode];
  
  // Usamos un Map para saber si un nodo ya está en la lista abierta o cerrada
  const openSetMap = new Map<string, typeof startNode>();
  const closedSet = new Set<string>();
  openSetMap.set(`${startX},${startY}`, startNode);

  const getHeuristic = (x: number, y: number) => Math.abs(x - targetX) + Math.abs(y - targetY);
  
  const directions = [
    {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1},
    {dx: 1, dy: 1}, {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}
  ];

  let iterations = 0;
  const MAX_ITERATIONS = 4000; // LÍMITE DE SEGURIDAD PARA NO COLGAR EL NAVEGADOR

  while (openSet.length > 0) {
    iterations++;
    if (iterations > MAX_ITERATIONS) {
      console.warn("Pathfinding abortado: destino inalcanzable o demasiado lejos.");
      return []; 
    }

    // Encontrar el nodo con el F más bajo
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) currentIndex = i;
    }
    const current = openSet[currentIndex];

    // Si llegamos al destino
    if (current.x === targetX && current.y === targetY) {
      const path = [];
      let temp = current;
      while (temp) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Mover de la lista abierta a la cerrada
    openSet.splice(currentIndex, 1);
    openSetMap.delete(`${current.x},${current.y}`);
    closedSet.add(`${current.x},${current.y}`);

    for (const dir of directions) {
      const neighborX = current.x + dir.dx;
      const neighborY = current.y + dir.dy;
      const neighborKey = `${neighborX},${neighborY}`;

      if (closedSet.has(neighborKey)) continue;
      if (isBlocked(neighborX, neighborY)) continue;

      const g = current.g + (dir.dx !== 0 && dir.dy !== 0 ? 1.4 : 1); // Coste diagonal
      const h = getHeuristic(neighborX, neighborY);
      const f = g + h;

      const existing = openSetMap.get(neighborKey);
      
      if (!existing) {
        const newNode = { x: neighborX, y: neighborY, g, h, f, parent: current };
        openSet.push(newNode);
        openSetMap.set(neighborKey, newNode);
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = f;
        existing.parent = current;
      }
    }
  }
  return [];
}