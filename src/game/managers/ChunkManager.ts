import Phaser from 'phaser';
import { generateChunkTerrain, getTileTypeAt, TileType } from '../../core/data/world/generators/terrainGenerator';
import { generateChunkFauna } from '../../core/data/world/generators/faunaGenerator';
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { Province } from '../../core/data/world/types';
import { sampleGeoCached } from '../../core/data/world/generators/geoTileCache';
import { BeastEntity } from '../entities/BeastEntity';
import { masksByNeighborType } from '../rendering/autotile';
import {
  CUBE_HEIGHT,
  TILE_HEIGHT,
  TILE_WIDTH,
  ensureTransitionTexture,
  isFlatTileType,
  pickGroundTint,
  pickMountainTexture,
  pickMountainTint,
} from '../rendering/tileTextures';

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

interface ChunkData {
  objects: Phaser.GameObjects.GameObject[];
  obstacles: string[];
  waterTiles: string[];
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

  /** Tile libre de obstáculos y de montaña: apto para spawn o destino. */
  public isWalkableTile(x: number, y: number): boolean {
    return !this.isBlockedTile(x, y) && !this.isMountainTile(x, y);
  }

  /** Tile caminable más cercano por anillos deterministas (spawn seguro). */
  public findNearestWalkableTile(origin: { x: number; y: number }, maxRadius = 24): { x: number; y: number } | null {
    const ox = Math.round(origin.x);
    const oy = Math.round(origin.y);
    if (this.isWalkableTile(ox, oy)) return { x: ox, y: oy };

    for (let ring = 1; ring <= maxRadius; ring++) {
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = ox + dx;
          const y = oy + dy;
          if (this.isWalkableTile(x, y)) return { x, y };
        }
      }
    }
    return null;
  }

  public update(playerScreenX: number, playerScreenY: number): void {
    const mapCoords = screenToMap(playerScreenX, playerScreenY - CUBE_HEIGHT);
    const currentChunkX = Math.floor(mapCoords.x / CHUNK_SIZE);
    const currentChunkY = Math.floor(mapCoords.y / CHUNK_SIZE);

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
    const timers: (Phaser.Time.TimerEvent | Phaser.Tweens.Tween)[] = [];

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
        // Agua profunda: conserva el cubo y su volumen.
        const img = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, 'tile_agua');
        img.setOrigin(0.5, 0);
        img.setDepth(pos.y);
        objects.push(img);

        const tileKey = `${tile.x},${tile.y}`;
        this.waterTiles.add(tileKey);
        chunkWaterTiles.push(tileKey);

        if (tile.waterDepth === 1) img.setTint(0x1e3a8a);
        // ríos navegables vs canal somero: leve matiz distinto
        else if (tile.navigable && tile.geoId === 'grand_canal') img.setTint(0x38bdf8);

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

        const rng = mulberry32(stringToHash(`water_${tile.x}_${tile.y}`));
        const tween = this.scene.tweens.add({
          targets: img,
          alpha: { from: 0.85, to: 1 },
          duration: 2000 + rng() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: rng() * 2000,
        });
        timers.push(tween);
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

      this.maybePlaceDecal(tile.type, pos, detailRng, objects);

      if (tile.type === 'pantano') {
        // juncos dispersos sin colisión (caminables, estética húmeda)
        const rng = mulberry32(stringToHash(`sw_${chunkX}_${chunkY}_${tile.x}_${tile.y}`));
        if (rng() < 0.25) {
          const reed = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, 'tree_dead');
          reed.setScale(0.35);
          reed.setAlpha(0.7);
          reed.setDepth(pos.y + 1);
          objects.push(reed);
        }
        return;
      }

      if (tile.type === 'hierba' || tile.type === 'arena' || tile.type === 'nieve') {
        const rng = mulberry32(stringToHash(`${chunkX}_${chunkY}_${tile.x}_${tile.y}`));

        // Menos árboles que antes: el suelo y los decals deben leerse.
        if (rng() < tile.density * 0.7) {
          let treeKey = 'tree_round';
          if (tile.isNearWater || tile.type === 'arena') treeKey = rng() > 0.3 ? 'tree_palm' : 'tree_dead';
          else if (tile.type === 'nieve') treeKey = rng() > 0.4 ? 'tree_pine' : 'tree_dead';
          else {
            const r = rng();
            if (r > 0.85) treeKey = 'tree_dead';
            else if (r > 0.4) treeKey = 'tree_pine';
          }

          const tree = this.treeGroup.create(pos.x, pos.y + CUBE_HEIGHT, treeKey) as Phaser.Physics.Arcade.Sprite;
          tree.setOrigin(0.5, 0.9);
          tree.setScale((0.90 + rng() * 0.3) * 2);
          tree.setFlipX(rng() > 0.5);
          tree.setDepth(pos.y + 1);

          if (tree.body) {
            tree.body.setSize(20, 20);
            tree.body.setOffset(22, 40);
          }

          objects.push(tree);
          const tileKey = `${tile.x},${tile.y}`;
          chunkObstacles.push(tileKey);
          localObstacles.add(tileKey);
        }
      }
    });

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
    this.loadedChunks.set(key, { objects, obstacles: chunkObstacles, waterTiles: chunkWaterTiles, timers });
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