import Phaser from 'phaser';
import { generateChunkTerrain } from '../../core/data/world/generators/terrainGenerator';
import { generateChunkFauna } from '../../core/data/world/generators/faunaGenerator';
import { mulberry32, stringToHash } from '../../core/utils/prng';
import { Province } from '../../core/data/world/types';
import { BeastEntity } from '../entities/BeastEntity';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const CUBE_HEIGHT = 16;
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

    // Set local para comprobaciones O(1) durante este chunk
    const localObstacles = new Set<string>();

    tiles.forEach((tile) => {
      const pos = mapToScreen(tile.x, tile.y);

      // Montañas: roca elevada e IMPENETRABLE (obstáculo físico + lógico)
      if (tile.type === 'montana') {
        const rock = this.scene.add.image(pos.x, pos.y - 6, 'tile_montana');
        rock.setOrigin(0.5, 0.28);
        rock.setDepth(pos.y + 4);
        objects.push(rock);
        const tileKey = `${tile.x},${tile.y}`;
        chunkObstacles.push(tileKey);
        localObstacles.add(tileKey);
        return;
      }

      const img = this.scene.add.image(pos.x, pos.y + CUBE_HEIGHT, `tile_${tile.type}`);
      img.setOrigin(0.5, 0);
      img.setDepth(pos.y);
      objects.push(img);

      if (tile.type === 'agua') {
        const tileKey = `${tile.x},${tile.y}`;
        this.waterTiles.add(tileKey);
        chunkWaterTiles.push(tileKey);

        if (tile.waterDepth === 1) img.setTint(0x1e3a8a);
        // ríos navegables vs canal somero: leve matiz distinto
        else if (tile.navigable && tile.geoId === 'grand_canal') img.setTint(0x38bdf8);

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

        if (rng() < tile.density) {
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