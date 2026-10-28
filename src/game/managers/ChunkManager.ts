import Phaser from 'phaser';
import { generateChunkTerrain, getTileTypeAt, TileType } from '../../core/data/world/generators/terrainGenerator';
import { generateChunkFauna } from '../../core/data/world/generators/faunaGenerator';
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { Province } from '../../core/data/world/types';
import { sampleGeoCached } from '../../core/data/world/generators/geoTileCache';
import { getInstanceInChunk, INSTANCE_COLOR } from '../../core/data/world/generators/instanceGenerator';
import type { InstancePoi } from '../../core/data/world/generators/instanceGenerator';
import { BeastEntity } from '../entities/BeastEntity';
import { masksByNeighborType } from '../rendering/autotile';
import {
  CUBE_HEIGHT,
  ENTRANCE_ORIGIN_Y,
  TILE_HEIGHT,
  TILE_WIDTH,
  WATER_DEPTH,
  ensureTransitionTexture,
  isFlatTileType,
  pickGroundTint,
  pickMountainTexture,
  pickMountainTint,
} from '../rendering/tileTextures';
import { TREE_ORIGIN_Y, TREE_SHADOW_KEY } from '../rendering/treeTextures';

const CHUNK_SIZE = 16;
const LOAD_RADIUS = 2;

const mapToScreen = (mapX: number, mapY: number) => ({
  x: (mapX - mapY) * (TILE_WIDTH / 2),
  y: (mapX + mapY) * (TILE_HEIGHT / 2),
});

export const screenToMap = (screenX: number, screenY: number) => ({
  x: Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
  y: Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2),
});

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

  /** Obstáculo físico cargado (árbol o montaña renderizada). */
  public isBlockedTile(x: number, y: number): boolean {
    return this.obstacles.has(`${Math.round(x)},${Math.round(y)}`);
  }

  /** Geometría montañosa real, aunque el chunk aún no esté cargado. */
  public isMountainTile(x: number, y: number): boolean {
    const kind = sampleGeoCached(Math.round(x), Math.round(y)).kind;
    return kind === 'montania_alta' || kind === 'montania_media' || kind === 'estribacion';
  }

  /** Tile libre de obstáculos y de montaña: apto para caminar, spawn o destino. */
  public isTileWalkable(x: number, y: number): boolean {
    return !this.isBlockedTile(x, y) && !this.isMountainTile(x, y);
  }

  /** Tile caminable más cercano por anillos deterministas (spawn seguro). */
  public findNearestWalkableTile(origin: { x: number; y: number }, maxRadius = 24): { x: number; y: number } | null {
    const ox = Math.round(origin.x);
    const oy = Math.round(origin.y);
    if (this.isTileWalkable(ox, oy)) return { x: ox, y: oy };

    for (let ring = 1; ring <= maxRadius; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = ox + dx;
          const y = oy + dy;
          if (this.isTileWalkable(x, y)) return { x, y };
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

      // Montañas: roca elevada e IMPENETRABLE (obstáculo físico + lógico)
      if (tile.type === 'montana') {
        const mountainRng = mulberry32(stringToHash(`mtn_${tile.x}_${tile.y}`));
        const rock = this.scene.add.image(pos.x, pos.y - 6, pickMountainTexture(mountainRng));
        rock.setTint(pickMountainTint(mountainRng));
        rock.setOrigin(0.5, 0.28);
        rock.setDepth(pos.y + 4);
        objects.push(rock);
        const tileKey = `${tile.x},${tile.y}`;
        chunkObstacles.push(tileKey);
        localObstacles.add(tileKey);
        return;
      }

      const neighbors = {
        n: neighborTypeAt(tile.x, tile.y - 1),
        e: neighborTypeAt(tile.x + 1, tile.y),
        s: neighborTypeAt(tile.x, tile.y + 1),
        w: neighborTypeAt(tile.x - 1, tile.y),
      };
      const transitionMasks = masksByNeighborType(tile.type, neighbors);

      if (tile.type === 'agua') {
        // La lámina de agua es un TileSprite por chunk (ver más abajo): aquí
        // solo se registra el hueco del rombo y su matiz de calado.
        const surfaceY = pos.y + CUBE_HEIGHT;
        waterRects.push({ x: pos.x, y: surfaceY });

        const tileKey = `${tile.x},${tile.y}`;
        this.waterTiles.add(tileKey);
        chunkWaterTiles.push(tileKey);

        const shadeKey = tile.waterDepth === 1
          ? 'water_shade_deep'
          : tile.navigable && tile.geoId === 'grand_canal' ? 'water_shade_canal' : null;
        if (shadeKey) {
          const shade = this.scene.add.image(pos.x, surfaceY, shadeKey);
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

      // Suelo plano: rombo de una sola cara, con variante + espejo determinista.
      const detailRng = mulberry32(stringToHash(`ground_${chunkX}_${chunkY}_${tile.x}_${tile.y}`));
      const variant = detailRng() > 0.5 ? '_b' : '';
      const img = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, `tile_${tile.type}${variant}`);
      img.setOrigin(0.5, 0);
      img.setDepth(pos.y);
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
        const edge = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, key);
        edge.setOrigin(0.5, 0);
        edge.setDepth(pos.y + 0.1);
        objects.push(edge);
      }

      // Entrada de instancia: portal visual elevado sobre el tile. Se salta
      // árboles y decals para que la boca quede siempre legible.
      if (instancePoi && instancePoi.x === tile.x && instancePoi.y === tile.y) {
        this.spawnInstanceEntrance(instancePoi, pos, objects, timers);
        const tileKey = `${tile.x},${tile.y}`;
        chunkObstacles.push(tileKey);
        localObstacles.add(tileKey);
        return;
      }

      this.maybePlaceDecal(tile.type, pos, detailRng, objects);

      if (tile.type === 'pantano') {
        // juncos dispersos sin colisión (caminables, estética húmeda)
        const rng = mulberry32(stringToHash(`sw_${chunkX}_${chunkY}_${tile.x}_${tile.y}`));
        if (rng() < 0.25) {
          const reed = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, 'tree_dead');
          reed.setOrigin(0.5, TREE_ORIGIN_Y);
          reed.setScale(0.35);
          reed.setAlpha(0.6);
          reed.setDepth(pos.y + 1);
          objects.push(reed);
        }
        return;
      }

      if (tile.type === 'hierba' || tile.type === 'arena' || tile.type === 'nieve') {
        const rng = mulberry32(stringToHash(`${chunkX}_${chunkY}_${tile.x}_${tile.y}`));

        // Menos árboles que antes: el suelo y los decals deben leerse.
        if (rng() < tile.density * 0.7) {
          const treeKey = this.pickTreeKey(tile, rng);
          // Altura y copa variables por árbol: rompe la retícula de la rejilla.
          const scaleX = 1.2 + rng() * 0.6;
          const scaleY = 1.2 + rng() * 0.6;

          // Sombra de anclaje al suelo (elipse suave, luz del suroeste).
          const shadow = this.scene.add.image(
            pos.x + 4 * scaleX,
            pos.y + CUBE_HEIGHT + 4,
            TREE_SHADOW_KEY,
          );
          shadow.setScale(scaleX, scaleY * 0.9);
          shadow.setDepth(pos.y + 0.4);
          objects.push(shadow);

          const tree = this.treeGroup.create(pos.x, pos.y + CUBE_HEIGHT, treeKey) as Phaser.Physics.Arcade.Sprite;
          tree.setOrigin(0.5, TREE_ORIGIN_Y);
          tree.setScale(scaleX, scaleY);
          tree.setFlipX(rng() > 0.5);
          tree.setDepth(pos.y + 1);

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
    objects: Phaser.GameObjects.GameObject[],
    timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[],
  ): void {
    const baseY = pos.y + CUBE_HEIGHT;

    const shadow = this.scene.add.image(pos.x, baseY + 6, TREE_SHADOW_KEY);
    shadow.setScale(1.9, 1.5);
    shadow.setDepth(pos.y + 0.4);
    objects.push(shadow);

    const glow = this.scene.add.image(pos.x, baseY - 20, 'poi_glow');
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setTint(INSTANCE_COLOR[poi.kind]);
    glow.setAlpha(0.3);
    glow.setScale(0.95);
    glow.setDepth(pos.y + 9);
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
    entrance.setDepth(pos.y + 10);
    objects.push(entrance);
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
      pos.y + CUBE_HEIGHT + TILE_HEIGHT / 2 + dy,
      key,
    );
    decal.setOrigin(0.5, 0.65);
    decal.setScale(0.75 + rng() * 0.45);
    decal.setAlpha(0.82 + rng() * 0.18);
    decal.setFlipX(rng() > 0.5);
    decal.setDepth(pos.y + 0.2);
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