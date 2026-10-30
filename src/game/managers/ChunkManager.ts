import Phaser from 'phaser';
import {
  generateChunkTerrain,
  getElevationAt,
  getTileTypeAt,
  Tile,
  TileType,
} from '../../core/data/world/generators/terrainGenerator';
import { generateChunkFauna } from '../../core/data/world/generators/faunaGenerator';
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { Province } from '../../core/data/world/types';
import { sampleGeoCached } from '../../core/data/world/generators/geoTileCache';
import { getInstanceInChunk, INSTANCE_COLOR } from '../../core/data/world/generators/instanceGenerator';
import type { InstancePoi } from '../../core/data/world/generators/instanceGenerator';
import { BeastEntity } from '../entities/BeastEntity';
import { masksByNeighborType } from '../rendering/autotile';
import {
  CLIFF_SHADOW_KEY,
  CLIFF_SHADOW_W_KEY,
  CLIFF_STEP,
  CUBE_HEIGHT,
  ELEVATION_DEPTH_STEP,
  ENTRANCE_ORIGIN_Y,
  JUMP_NODE_KEY,
  TILE_HEIGHT,
  TILE_WIDTH,
  WATER_DEPTH,
  cliffWallTexture,
  ensureTransitionTexture,
  isFlatTileType,
  mountainTopTexture,
  pickGroundTint,
} from '../rendering/tileTextures';
import { TREE_ORIGIN_Y, TREE_SHADOW_KEY } from '../rendering/treeTextures';
import { JumpNode, jumpNodesInChunk } from '../utils/jumpNodes';
import { isoPxToTile, isoTileToPx } from '../utils/isoProjection';

const CHUNK_SIZE = 16;
const LOAD_RADIUS = 2;

// Anclaje de los árboles: la base se apoya dentro de la tesela (centro + 8px),
// no en su vértice frontal, que es el que producía la lectura de "cubo
// invisible". El vector de sombra (+X/+Y) cae al sureste y es coherente con la
// luz fija noroeste del resto del arte (acantilados, copas y troncos).
const TREE_BASE_OFFSET_Y = CUBE_HEIGHT / 2;
const TREE_SHADOW_OFFSET_X = 4;
const TREE_SHADOW_OFFSET_Y = 4;

const mapToScreen = isoTileToPx;

export const screenToMap = (screenX: number, screenY: number) => {
  const t = isoPxToTile(screenX, screenY);
  return { x: Math.round(t.x), y: Math.round(t.y) };
};

interface WaterLayer {
  sprite: Phaser.GameObjects.TileSprite;
  baseX: number;
  baseY: number;
}

interface ChunkData {
  objects: Phaser.GameObjects.GameObject[];
  obstacles: string[];
  waterTiles: string[];
  waterLayers: WaterLayer[];
  timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[];
}

export class ChunkManager {
  private loadedChunks = new Map<string, ChunkData>();

  public obstacles = new Set<string>();
  public waterTiles = new Set<string>();

  constructor(
    private scene: Phaser.Scene,
    private province: Province,
    private treeGroup: Phaser.Physics.Arcade.StaticGroup,
    private faunaGroup: Phaser.Physics.Arcade.Group
  ) {}

  /** Obstáculo físico cargado (árbol o entrada de instancia). */
  public isBlockedTile(x: number, y: number): boolean {
    return this.obstacles.has(`${Math.round(x)},${Math.round(y)}`);
  }

  /** Geometría montañosa real, aunque el chunk aún no esté cargado. */
  public isMountainTile(x: number, y: number): boolean {
    const kind = sampleGeoCached(Math.round(x), Math.round(y)).kind;
    return kind === 'montania_alta' || kind === 'montania_media' || kind === 'estribacion';
  }

  /** Elevación 0..3 de cualquier tile (no requiere tener el chunk cargado). */
  public elevationAt(x: number, y: number): number {
    return getElevationAt(x, y);
  }

  /** Tile sin obstáculos físicos. La altura la resuelve `canStep`. */
  public isTileWalkable(x: number, y: number): boolean {
    return !this.isBlockedTile(x, y);
  }

  /**
   * Un paso caminando solo es legal entre tiles de la MISMA elevación: cada
   * desnivel es un acantilado vertical (no hay rampas). Ascender requiere un
   * nodo de salto.
   */
  public canStep(fromX: number, fromY: number, toX: number, toY: number): boolean {
    const tx = Math.round(toX);
    const ty = Math.round(toY);
    if (!this.isTileWalkable(tx, ty)) return false;
    return this.elevationAt(tx, ty) === this.elevationAt(Math.round(fromX), Math.round(fromY));
  }

  /** Tile caminable de elevación 0 más cercano por anillos (spawn seguro). */
  public findNearestWalkableTile(origin: { x: number; y: number }, maxRadius = 24): { x: number; y: number } | null {
    const ox = Math.round(origin.x);
    const oy = Math.round(origin.y);
    const isSafe = (x: number, y: number) =>
      this.isTileWalkable(x, y) && this.elevationAt(x, y) === 0 && getTileTypeAt(x, y) !== 'agua';
    if (isSafe(ox, oy)) return { x: ox, y: oy };

    for (let ring = 1; ring <= maxRadius; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = ox + dx;
          const y = oy + dy;
          if (isSafe(x, y)) return { x, y };
        }
      }
    }
    return null;
  }

  /** El jugador entrega su posición cartesiana (tiles), no píxeles de pantalla. */
  public update(playerMapX: number, playerMapY: number): void {
    const currentChunkX = Math.floor(playerMapX / CHUNK_SIZE);
    const currentChunkY = Math.floor(playerMapY / CHUNK_SIZE);

    const required = new Set<string>();
    for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
      for (let dy = -LOAD_RADIUS; dy <= LOAD_RADIUS; dy++) {
        required.add(`${currentChunkX + dx},${currentChunkY + dy}`);
      }
    }

    for (const [key, chunk] of this.loadedChunks.entries()) {
      if (!required.has(key)) this.unloadChunk(key, chunk);
    }

    for (const key of required) {
      if (!this.loadedChunks.has(key)) {
        const [cx, cy] = key.split(',').map(Number);
        this.loadChunk(cx, cy);
      }
    }
  }

  private loadChunk(chunkX: number, chunkY: number): void {
    const key = `${chunkX},${chunkY}`;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const chunkObstacles: string[] = [];
    const chunkWaterTiles: string[] = [];
    const waterRects: Array<{ x: number; y: number }> = [];
    const waterLayers: WaterLayer[] = [];
    const timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[] = [];
    const instancePoi = getInstanceInChunk(chunkX, chunkY);

    // ---- 1. Terreno ----
    const tiles = generateChunkTerrain(this.province.id, this.province.biome, chunkX, chunkY, CHUNK_SIZE);
    const tileTypeByKey = new Map<string, TileType>();
    for (const tile of tiles) tileTypeByKey.set(`${tile.x},${tile.y}`, tile.type);

    const neighborTypeAt = (x: number, y: number): TileType => {
      const cached = tileTypeByKey.get(`${x},${y}`);
      return cached ?? getTileTypeAt(x, y);
    };

    // Set local para comprobaciones O(1) durante este chunk
    const localObstacles = new Set<string>();

    tiles.forEach((tile) => {
      const pos = mapToScreen(tile.x, tile.y);
      const elev = tile.elevation;
      const surfaceY = pos.y + CUBE_HEIGHT - elev * CLIFF_STEP;
      const tileDepth = pos.y + elev * ELEVATION_DEPTH_STEP;

      // AO del acantilado sobre este piso (vecino norte/oeste más alto).
      this.spawnCliffShadows(tile, pos, surfaceY, tileDepth, objects);

      // Solo se mezclan tipos a la MISMA altura: hacia abajo hay muro vertical.
      const sameLevelType = (x: number, y: number): TileType | undefined =>
        this.elevationAt(x, y) === elev ? neighborTypeAt(x, y) : undefined;
      const transitionMasks = masksByNeighborType(tile.type, {
        n: sameLevelType(tile.x, tile.y - 1),
        e: sameLevelType(tile.x + 1, tile.y),
        s: sameLevelType(tile.x, tile.y + 1),
        w: sameLevelType(tile.x - 1, tile.y),
      });

      if (tile.type === 'agua') {
        // La lámina de agua es un TileSprite por chunk (ver más abajo): aquí
        // solo se registra el hueco del rombo y su matiz de calado.
        const waterSurfaceY = pos.y + CUBE_HEIGHT;
        waterRects.push({ x: pos.x, y: waterSurfaceY });

        const tileKey = `${tile.x},${tile.y}`;
        this.waterTiles.add(tileKey);
        chunkWaterTiles.push(tileKey);

        const shadeKey = tile.waterDepth === 1
          ? 'water_shade_deep'
          : tile.navigable && tile.geoId === 'grand_canal' ? 'water_shade_canal' : null;
        if (shadeKey) {
          const shade = this.scene.add.image(pos.x, waterSurfaceY, shadeKey);
          shade.setOrigin(0.5, 0);
          shade.setDepth(pos.y);
          objects.push(shade);
        }

        // Espuma en las orillas: todos los tipos de tierra comparten el mismo
        // color de espuma, así que se agrupan en una sola máscara.
        let landMask = 0;
        for (const mask of transitionMasks.values()) landMask |= mask;
        if (landMask !== 0) {
          const key = ensureTransitionTexture(this.scene, tile.type, 'tierra', landMask);
          const foam = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, key);
          foam.setOrigin(0.5, 0);
          foam.setDepth(pos.y + 0.1);
          objects.push(foam);
        }
        return;
      }

      const detailRng = mulberry32(stringToHash(`ground_${chunkX}_${chunkY}_${tile.x}_${tile.y}`));
      const variantB = detailRng() > 0.5;

      // Meseta: cara superior plana + muros en las caras SW/SE visibles.
      if (tile.type === 'montana' || (tile.type === 'nieve' && elev > 0)) {
        const top = this.scene.add.image(
          pos.x,
          surfaceY,
          mountainTopTexture(tile.type === 'nieve' ? 'nieve' : 'montana', variantB),
        );
        top.setOrigin(0.5, 0);
        top.setDepth(tileDepth);
        if (detailRng() > 0.5) top.setFlipX(true);
        objects.push(top);

        for (const [target, mask] of transitionMasks) {
          const key = ensureTransitionTexture(this.scene, tile.type, target, mask);
          const edge = this.scene.add.image(pos.x, surfaceY, key);
          edge.setOrigin(0.5, 0);
          edge.setDepth(tileDepth + 0.1);
          objects.push(edge);
        }

        this.spawnCliffWalls(tile, pos, elev, variantB, objects);
        return;
      }

      // Suelo plano: rombo de una sola cara, con variante + espejo determinista.
      const img = this.scene.add.image(pos.x, surfaceY, `tile_${tile.type}${variantB ? '_b' : ''}`);
      img.setOrigin(0.5, 0);
      img.setDepth(tileDepth);
      if (isFlatTileType(tile.type)) {
        // El tinte varía por parches de 4×4 tiles, no por tile: así no aparece
        // un damero de rombos de colores ligeramente distintos.
        const tintRng = mulberry32(stringToHash(
          `tint_${Math.floor(tile.x / 4)}_${Math.floor(tile.y / 4)}_${tile.type}`,
        ));
        img.setTint(pickGroundTint(tile.type, tintRng));
      }
      if (tile.type === 'hierba' || tile.type === 'arena' || detailRng() > 0.65) {
        img.setFlipX(detailRng() > 0.5);
      }
      objects.push(img);

      // Bordes de transición (16 piezas por par, una máscara por tipo vecino).
      for (const [target, mask] of transitionMasks) {
        const key = ensureTransitionTexture(this.scene, tile.type, target, mask);
        const edge = this.scene.add.image(pos.x, surfaceY, key);
        edge.setOrigin(0.5, 0);
        edge.setDepth(tileDepth + 0.1);
        objects.push(edge);
      }

      // Entrada de instancia: portal visual elevado sobre el tile. Se salta
      // árboles y decals para que la boca quede siempre legible.
      if (instancePoi && instancePoi.x === tile.x && instancePoi.y === tile.y) {
        this.spawnInstanceEntrance(instancePoi, pos, surfaceY, tileDepth, objects, timers);
        const tileKey = `${tile.x},${tile.y}`;
        chunkObstacles.push(tileKey);
        localObstacles.add(tileKey);
        return;
      }

      this.maybePlaceDecal(tile.type, pos, surfaceY, tileDepth, detailRng, objects);

      if (tile.type === 'pantano') {
        // juncos dispersos sin colisión (caminables, estética húmeda)
        const rng = mulberry32(stringToHash(`sw_${chunkX}_${chunkY}_${tile.x}_${tile.y}`));
        if (rng() < 0.25) {
          const reed = this.scene.add.image(pos.x, surfaceY, 'tree_dead');
          reed.setOrigin(0.5, TREE_ORIGIN_Y);
          reed.setScale(0.35);
          reed.setAlpha(0.6);
          reed.setDepth(tileDepth + 1);
          objects.push(reed);
        }
        return;
      }

      if (tile.type === 'hierba' || tile.type === 'arena' || tile.type === 'nieve') {
        const rng = mulberry32(stringToHash(`${chunkX}_${chunkY}_${tile.x}_${tile.y}`));

        // Al pie de un acantilado la copa quedaría tapada por la meseta, que
        // se dibuja por delante en depth: se omiten los árboles en esa fila.
        const cliffFoot = this.elevationAt(tile.x, tile.y - 1) > elev
          || this.elevationAt(tile.x - 1, tile.y) > elev;

        // Menos árboles que antes: el suelo y los decals deben leerse.
        if (!cliffFoot && rng() < tile.density * 0.7) {
          const treeKey = this.pickTreeKey(tile, rng);
          // Altura y copa variables por árbol: rompe la retícula de la rejilla.
          const scaleX = 1.2 + rng() * 0.6;
          const scaleY = 1.2 + rng() * 0.6;

          const treeBaseY = pos.y + TREE_BASE_OFFSET_Y - elev * CLIFF_STEP;

          // Sombra proyectada sobre el suelo: mismo vector para todos los
          // árboles y siempre por debajo del tronco (depth de la base).
          const shadow = this.scene.add.image(
            pos.x + TREE_SHADOW_OFFSET_X * scaleX,
            treeBaseY + TREE_SHADOW_OFFSET_Y * scaleY,
            TREE_SHADOW_KEY,
          );
          shadow.setScale(scaleX, scaleY * 0.9);
          shadow.setDepth(tileDepth + 0.4);
          objects.push(shadow);

          const tree = this.treeGroup.create(pos.x, treeBaseY, treeKey) as Phaser.Physics.Arcade.Sprite;
          tree.setOrigin(0.5, TREE_ORIGIN_Y);
          tree.setScale(scaleX, scaleY);
          tree.setFlipX(rng() > 0.5);
          tree.setDepth(tileDepth + 1);

          const body = tree.body as Phaser.Physics.Arcade.StaticBody | null;
          if (body) {
            // El offset del StaticBody va en píxeles de mundo: tras escalar,
            // se ancla la huella de colisión a la base del tronco.
            body.updateFromGameObject();
            body.setSize(28, 16, false);
            body.setOffset(48 * scaleX - 14, 118 * scaleY - 16);
          }

          objects.push(tree);
          const tileKey = `${tile.x},${tile.y}`;
          chunkObstacles.push(tileKey);
          localObstacles.add(tileKey);
        }
      }
    });

    // ---- 1a. Runas de salto en los bordes de acantilado del chunk ----
    for (const node of jumpNodesInChunk(chunkX, chunkY, CHUNK_SIZE)) {
      this.spawnJumpNodeMarkers(node, objects, timers);
    }

    // ---- 1b. Lámina de agua continua del chunk ----
    // Un único TileSprite bajo todo el terreno: el suelo es opaco y tesela sin
    // costuras, así que el agua solo asoma por los rombos de agua. El patrón
    // se ancla a coordenadas de mundo para que los chunks vecinos encajen.
    if (waterRects.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const r of waterRects) {
        if (r.x < minX) minX = r.x;
        if (r.x > maxX) maxX = r.x;
        if (r.y < minY) minY = r.y;
        if (r.y > maxY) maxY = r.y;
      }
      const left = Math.floor(minX - TILE_WIDTH / 2 - 4);
      const top = Math.floor(minY - 4);
      const width = Math.ceil(maxX + TILE_WIDTH / 2 + 4) - left;
      const height = Math.ceil(maxY + TILE_HEIGHT + 4) - top;
      const layer = this.scene.add.tileSprite(left, top, width, height, 'water_flow');
      layer.setOrigin(0, 0);
      layer.setDepth(WATER_DEPTH);
      layer.setTilePosition(left, top);
      objects.push(layer);
      waterLayers.push({ sprite: layer, baseX: left, baseY: top });
    }

    // ---- 2. Fauna ----
    const chunkFauna = generateChunkFauna(this.province.id, chunkX, chunkY, CHUNK_SIZE);
    chunkFauna.forEach((beast) => {
      const tileKey = `${beast.x},${beast.y}`;
      const isWaterHere = this.waterTiles.has(tileKey);
      const isBlockedHere = this.obstacles.has(tileKey) || localObstacles.has(tileKey);

      if (beast.isAquatic && !isWaterHere) return;
      if (!beast.isAquatic && (isWaterHere || isBlockedHere)) return;
      // Las bestias no escalan: en una meseta se dibujarían al pie del muro.
      if (this.elevationAt(beast.x, beast.y) > 0) return;

      const pos = mapToScreen(beast.x, beast.y);

      const physicsSprite = this.faunaGroup.create(
        pos.x, pos.y + CUBE_HEIGHT, 'tile_hierba'
      ) as Phaser.Physics.Arcade.Sprite;
      physicsSprite.setVisible(false);

      if (physicsSprite.body) {
        physicsSprite.body.setSize(20, 12);
        physicsSprite.body.setOffset(22, 18);
      }

      if (!beast.isAquatic) {
        // El sprite físico se pasa al entity: UNA sola fuente de verdad
        const entity = new BeastEntity(
          this.scene, physicsSprite, beast.id, pos.x, pos.y + CUBE_HEIGHT
        );
        physicsSprite.setData('entity', entity);

        objects.push(entity.graphics);
        objects.push(physicsSprite); // ← CRÍTICO: destruirlo al descargar
      } else {
        physicsSprite.setData('aquatic', true); // radar del minimapa: ignorar acuáticos
        physicsSprite.setVisible(true);
        physicsSprite.setTexture('beast_snake');
        physicsSprite.setScale(0.8);
        physicsSprite.setDepth(pos.y - 1);
        physicsSprite.setAlpha(0.5);

        const rng = mulberry32(stringToHash(`beast_${beast.id}`));
        const timer = this.scene.time.addEvent({
          delay: 2000 + rng() * 3000,
          loop: true,
          callback: () => {
            if (!physicsSprite.active) return;
            physicsSprite.setDepth(pos.y + 2);
            physicsSprite.setAlpha(1);
            this.createSplash(pos.x, pos.y + CUBE_HEIGHT, pos.y);

            this.scene.tweens.add({
              targets: physicsSprite,
              y: physicsSprite.y - 15,
              duration: 300,
              yoyo: true,
              ease: 'Quad.easeOut',
              onComplete: () => {
                if (!physicsSprite.active) return;
                this.createSplash(physicsSprite.x, physicsSprite.y, pos.y);
                physicsSprite.setDepth(pos.y - 1);
                physicsSprite.setAlpha(0.5);
              },
            });
          },
        });
        timers.push(timer);
        objects.push(physicsSprite);
      }
    });

    chunkObstacles.forEach((o) => this.obstacles.add(o));
    this.loadedChunks.set(key, {
      objects,
      obstacles: chunkObstacles,
      waterTiles: chunkWaterTiles,
      waterLayers,
      timers,
    });
  }

  /** Especie de árbol según bioma y humedad. Consume el rng del tile para
   *  mantener la elección determinista respecto a la escala y el volteo. */
  private pickTreeKey(tile: { type: TileType; isNearWater: boolean }, rng: () => number): string {
    if (tile.isNearWater || tile.type === 'arena') {
      const r = rng();
      if (r < 0.5) return 'tree_palm';
      if (r < 0.72) return 'tree_willow';
      if (r < 0.9) return 'tree_dead';
      return 'tree_round';
    }
    if (tile.type === 'nieve') {
      const r = rng();
      return r < 0.62 ? 'tree_pine' : r < 0.9 ? 'tree_dead' : 'tree_round';
    }
    const r = rng();
    if (r < 0.3) return 'tree_round';
    if (r < 0.55) return 'tree_pine';
    if (r < 0.7) return 'tree_willow';
    if (r < 0.82) return 'tree_sakura';
    if (r < 0.94) return 'tree_dead';
    return 'tree_round';
  }

  /** Portal de instancia: sombra, halo aditivo palpitante y entrada elevada. */
  private spawnInstanceEntrance(
    poi: InstancePoi,
    pos: { x: number; y: number },
    baseY: number,
    depthBase: number,
    objects: Phaser.GameObjects.GameObject[],
    timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[],
  ): void {
    const shadow = this.scene.add.image(
      pos.x + TREE_SHADOW_OFFSET_X * 1.9,
      baseY + TREE_SHADOW_OFFSET_Y * 1.5,
      TREE_SHADOW_KEY,
    );
    shadow.setScale(1.9, 1.5);
    shadow.setDepth(depthBase + 0.4);
    objects.push(shadow);

    const glow = this.scene.add.image(pos.x, baseY - 20, 'poi_glow');
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setTint(INSTANCE_COLOR[poi.kind]);
    glow.setAlpha(0.3);
    glow.setScale(0.95);
    glow.setDepth(depthBase + 9);
    objects.push(glow);
    timers.push(this.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.2, to: 0.48 },
      scaleX: { from: 0.9, to: 1.3 },
      scaleY: { from: 0.9, to: 1.3 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }));

    const entrance = this.scene.add.image(pos.x, baseY + 2, `entrance_${poi.kind}`);
    entrance.setOrigin(0.5, ENTRANCE_ORIGIN_Y);
    entrance.setScale(1.12);
    entrance.setDepth(depthBase + 10);
    objects.push(entrance);
  }

  /**
   * Muros de la cara SW y SE de una meseta cuando su vecino sur/este está más
   * bajo. El ancla hace que el borde inferior del muro coincida exactamente
   * con la arista compartida del piso inferior, a cualquier desnivel.
   */
  private spawnCliffWalls(
    tile: Tile,
    pos: { x: number; y: number },
    elev: number,
    variantB: boolean,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    const southElev = this.elevationAt(tile.x, tile.y + 1);
    if (southElev < elev) {
      const wall = this.scene.add.image(
        pos.x - TILE_WIDTH / 2,
        pos.y + TILE_HEIGHT - elev * CLIFF_STEP,
        cliffWallTexture('sw', elev - southElev, variantB),
      );
      wall.setOrigin(0, 0);
      wall.setDepth(pos.y + TILE_HEIGHT / 2 + southElev * ELEVATION_DEPTH_STEP + 0.05);
      objects.push(wall);
    }

    const eastElev = this.elevationAt(tile.x + 1, tile.y);
    if (eastElev < elev) {
      const wall = this.scene.add.image(
        pos.x,
        pos.y + TILE_HEIGHT + TILE_HEIGHT / 2 - elev * CLIFF_STEP,
        cliffWallTexture('se', elev - eastElev, variantB),
      );
      wall.setOrigin(0, 0);
      wall.setDepth(pos.y + TILE_HEIGHT / 2 + eastElev * ELEVATION_DEPTH_STEP + 0.05);
      objects.push(wall);
    }
  }

  /** AO que proyecta el acantilado sobre el piso bajo, recortado al rombo. */
  private spawnCliffShadows(
    tile: Tile,
    pos: { x: number; y: number },
    surfaceY: number,
    tileDepth: number,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    if (tile.elevation >= 3) return;
    if (this.elevationAt(tile.x, tile.y - 1) > tile.elevation) {
      const shadow = this.scene.add.image(pos.x, surfaceY, CLIFF_SHADOW_KEY);
      shadow.setOrigin(0.5, 0);
      shadow.setDepth(tileDepth + 0.15);
      objects.push(shadow);
    }
    if (this.elevationAt(tile.x - 1, tile.y) > tile.elevation) {
      const shadow = this.scene.add.image(pos.x, surfaceY, CLIFF_SHADOW_W_KEY);
      shadow.setOrigin(0.5, 0);
      shadow.setDepth(tileDepth + 0.16);
      objects.push(shadow);
    }
  }

  /** Runas del nodo en ambos extremos del borde: se descubre desde arriba y abajo. */
  private spawnJumpNodeMarkers(
    node: JumpNode,
    objects: Phaser.GameObjects.GameObject[],
    timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[],
  ): void {
    const fromPos = mapToScreen(node.from.x, node.from.y);
    const fromElev = this.elevationAt(node.from.x, node.from.y);
    const toElev = this.elevationAt(node.to.x, node.to.y);
    const fromSurfaceY = fromPos.y + CUBE_HEIGHT - fromElev * CLIFF_STEP;

    // Punto medio de la arista compartida (NE si el alto está al norte,
    // NW si está al oeste).
    const edgeX = fromPos.x + (node.to.y === node.from.y ? -TILE_WIDTH / 4 : TILE_WIDTH / 4);
    const edgeY = fromSurfaceY + TILE_HEIGHT / 4;

    const makeMarker = (x: number, y: number, depth: number, alpha: number) => {
      const marker = this.scene.add.image(x, y, JUMP_NODE_KEY);
      marker.setOrigin(0.5, 0.5);
      marker.setDepth(depth);
      marker.setAlpha(alpha);
      objects.push(marker);
      timers.push(this.scene.tweens.add({
        targets: marker,
        alpha: { from: alpha * 0.55, to: alpha },
        scaleX: { from: 0.92, to: 1.08 },
        scaleY: { from: 0.92, to: 1.08 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }));
    };

    makeMarker(
      edgeX,
      edgeY,
      fromPos.y + fromElev * ELEVATION_DEPTH_STEP + 0.35,
      0.82,
    );
    makeMarker(
      edgeX,
      edgeY - CLIFF_STEP,
      fromPos.y + toElev * ELEVATION_DEPTH_STEP + 0.35,
      0.5,
    );
  }

  /** Corriente del agua: desplaza el patrón de cada lámina. El período de la
   *  textura es 128 px, así que el offset se envuelve para no degradar la
   *  precisión flotante en sesiones largas. */
  public animateWater(timeMs: number): void {
    const flow = (timeMs * 0.02) % 128;
    const swell = Math.sin(timeMs * 0.0005) * 3;
    for (const chunk of this.loadedChunks.values()) {
      for (const layer of chunk.waterLayers) {
        layer.sprite.tilePositionX = layer.baseX + flow;
        layer.sprite.tilePositionY = layer.baseY + swell;
      }
    }
  }

  /** Detalles planos (piedras, matas, flores, grietas) sobre suelo caminable. */
  private maybePlaceDecal(
    tileType: TileType,
    pos: { x: number; y: number },
    baseY: number,
    depthBase: number,
    rng: () => number,
    objects: Phaser.GameObjects.GameObject[],
  ): void {
    if (!isFlatTileType(tileType)) return;

    const chance = tileType === 'arena' ? 0.1 : tileType === 'nieve' ? 0.08 : 0.14;
    if (rng() > chance) return;

    const roll = rng();
    let key: string;
    if (tileType === 'arena') key = roll < 0.6 ? 'decal_stone' : 'decal_crack';
    else if (tileType === 'nieve') key = roll < 0.7 ? 'decal_stone' : 'decal_crack';
    else if (tileType === 'pantano') key = roll < 0.5 ? 'decal_grass' : roll < 0.8 ? 'decal_stone' : 'decal_crack';
    else key = roll < 0.45 ? 'decal_grass' : roll < 0.7 ? 'decal_flower' : roll < 0.9 ? 'decal_stone' : 'decal_crack';

    let dx = 0;
    let dy = 0;
    for (let attempt = 0; attempt < 6; attempt++) {
      dx = (rng() * 2 - 1) * 22;
      dy = (rng() * 2 - 1) * 9;
      if (Math.abs(dx) / 32 + Math.abs(dy) / 16 <= 0.72) break;
    }

    const decal = this.scene.add.image(
      pos.x + dx,
      baseY + TILE_HEIGHT / 2 + dy,
      key,
    );
    decal.setOrigin(0.5, 0.65);
    decal.setScale(0.75 + rng() * 0.45);
    decal.setAlpha(0.82 + rng() * 0.18);
    decal.setFlipX(rng() > 0.5);
    decal.setDepth(depthBase + 0.2);
    objects.push(decal);
  }

  private unloadChunk(key: string, chunk: ChunkData): void {
    chunk.objects.forEach((obj) => obj.destroy());
    chunk.obstacles.forEach((o) => this.obstacles.delete(o));
    chunk.waterTiles.forEach((w) => this.waterTiles.delete(w));
    chunk.timers.forEach((t) => t.remove());
    this.loadedChunks.delete(key);
  }

  private createSplash(x: number, y: number, depthBase: number): void {
    const splash = this.scene.add.image(x, y, 'splash_ring');
    splash.setDepth(depthBase + 2);
    splash.setAlpha(0.8);
    this.scene.tweens.add({
      targets: splash,
      scaleX: 3,
      scaleY: 1.5,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => splash.destroy(),
    });
  }
}