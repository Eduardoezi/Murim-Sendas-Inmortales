// src/game/scenes/WorldScene.ts
import Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { generateChunkTerrain } from '../../core/data/world/generators/terrainGenerator';
import { generateChunkFauna } from '../../core/data/world/generators/faunaGenerator';
import { INITIAL_PROVINCES } from '../../core/data/world/seeds/provinces';
import { findPath } from '../utils/pathfinding';
import { mulberry32, stringToHash } from '../../core/utils/prng';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const CUBE_HEIGHT = 16;
const CHUNK_SIZE = 16; 
const LOAD_RADIUS = 2; 

const mapToScreen = (mapX: number, mapY: number) => ({
  x: (mapX - mapY) * (TILE_WIDTH / 2),
  y: (mapX + mapY) * (TILE_HEIGHT / 2)
});

const screenToMap = (screenX: number, screenY: number) => ({
  x: Math.round((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
  y: Math.round((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2)
});

interface Chunk {
  objects: Phaser.GameObjects.GameObject[];
  obstacles: string[]; 
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private isMoving = false;
  private obstacles = new Set<string>(); 
  private waterTiles = new Set<string>(); // NUEVO: Para saber dónde está el agua
  private loadedChunks = new Map<string, Chunk>();
  private treeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private faunaGroup!: Phaser.Physics.Arcade.Group; 
  private province: any;

  constructor() {
    super({ key: 'WorldScene' });
  }

  private createTileTexture(key: string, topColor: number, sideColor: number) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(topColor, 1);
    g.beginPath(); g.moveTo(32, 0); g.lineTo(64, 16); g.lineTo(32, 32); g.lineTo(0, 16); g.closePath(); g.fillPath();
    g.fillStyle(sideColor, 1);
    g.beginPath(); g.moveTo(0, 16); g.lineTo(32, 32); g.lineTo(32, 32 + CUBE_HEIGHT); g.lineTo(0, 16 + CUBE_HEIGHT); g.closePath(); g.fillPath();
    g.fillStyle(sideColor - 0x111111, 1);
    g.beginPath(); g.moveTo(32, 32); g.lineTo(64, 16); g.lineTo(64, 16 + CUBE_HEIGHT); g.lineTo(32, 32 + CUBE_HEIGHT); g.closePath(); g.fillPath();
    g.generateTexture(key, 64, 32 + CUBE_HEIGHT);
    g.destroy();
  }

  private createVignette() {
    const width = this.scale.width;
    const height = this.scale.height;
    const vignetteTexture = this.textures.createCanvas('vignette', width, height);
    if (!vignetteTexture) return;
    const ctx = vignetteTexture.getContext();
    const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
    gradient.addColorStop(0, 'rgba(5, 7, 12, 0)');
    gradient.addColorStop(0.6, 'rgba(5, 7, 12, 0.5)');
    gradient.addColorStop(1, 'rgba(5, 7, 12, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    vignetteTexture.refresh();
    const vignette = this.add.image(width / 2, height / 2, 'vignette');
    vignette.setScrollFactor(0);
    vignette.setDepth(10000);
    vignette.setOrigin(0.5, 0.5);
  }

  private createTrees() {
    // ... (Mismo código de árboles que ya tenías) ...
    const gRound = this.make.graphics({ x: 0, y: 0 }, false);
    gRound.fillStyle(0x5c4033, 1); gRound.fillRect(28, 40, 8, 20);
    gRound.fillStyle(0x22c55e, 1);
    const leafPositions = [
      {x:32, y:30}, {x:24, y:35}, {x:40, y:35}, {x:20, y:25}, {x:44, y:25}, 
      {x:28, y:20}, {x:36, y:20}, {x:32, y:15}, {x:16, y:32}, {x:48, y:32},
      {x:26, y:12}, {x:38, y:12}
    ];
    leafPositions.forEach(p => gRound.fillCircle(p.x, p.y, 10));
    gRound.generateTexture('tree_round', 64, 64);
    
    const gPine = this.make.graphics({ x: 0, y: 0 }, false);
    gPine.fillStyle(0x5c4033, 1); gPine.fillRect(28, 50, 8, 14);
    for(let i=0; i<4; i++) {
      const yOffset = 10 + (i * 10);
      const width = 10 + (i * 6);
      gPine.fillStyle(0x15803d, 1); gPine.fillTriangle(32, yOffset, 32 - width, yOffset + 20, 32, yOffset + 20);
      gPine.fillStyle(0x22c55e, 1); gPine.fillTriangle(32, yOffset, 32 + width, yOffset + 20, 32, yOffset + 20);
    }
    gPine.generateTexture('tree_pine', 64, 64);

    const gPalm = this.make.graphics({ x: 0, y: 0 }, false);
    gPalm.lineStyle(6, 0x8b5a2b, 1);
    gPalm.beginPath(); gPalm.moveTo(32, 60); gPalm.lineTo(40, 20); gPalm.strokePath();
    gPalm.lineStyle(4, 0x22c55e, 1);
    for(let i=0; i<6; i++) {
      gPalm.beginPath(); gPalm.moveTo(40, 20); 
      const angle = (Math.PI / 3) * i;
      gPalm.lineTo(40 + Math.cos(angle)*20, 20 + Math.sin(angle)*10); gPalm.strokePath();
    }
    gPalm.generateTexture('tree_palm', 64, 64);

    const gDead = this.make.graphics({ x: 0, y: 0 }, false);
    gDead.lineStyle(6, 0x4a4a4a, 1);
    gDead.beginPath(); gDead.moveTo(32, 60); gDead.lineTo(32, 20); gDead.strokePath();
    gDead.lineStyle(4, 0x4a4a4a, 1);
    gDead.beginPath(); gDead.moveTo(32, 40); gDead.lineTo(15, 25); gDead.strokePath();
    gDead.beginPath(); gDead.moveTo(32, 30); gDead.lineTo(50, 15); gDead.strokePath();
    gDead.generateTexture('tree_dead', 64, 64);
  }

  private createBeastTextures() {
    // Texturas temporales para animales
    const gWolf = this.make.graphics({ x: 0, y: 0 }, false);
    gWolf.fillStyle(0x4a4a4a, 1); gWolf.fillCircle(16, 16, 12);
    gWolf.generateTexture('beast_wolf', 32, 32);
    
    const gEagle = this.make.graphics({ x: 0, y: 0 }, false);
    gEagle.fillStyle(0x8b5a2b, 1); gEagle.fillCircle(16, 16, 10);
    gEagle.generateTexture('beast_eagle', 32, 32);
    
    const gSnake = this.make.graphics({ x: 0, y: 0 }, false);
    gSnake.fillStyle(0x22c55e, 1); gSnake.fillCircle(16, 16, 8);
    gSnake.generateTexture('beast_snake', 32, 32);

    // Textura para el chapoteo (Splash)
    const gSplash = this.make.graphics({ x: 0, y: 0 }, false);
    gSplash.lineStyle(2, 0xffffff, 1);
    gSplash.strokeCircle(10, 10, 5);
    gSplash.generateTexture('splash_ring', 20, 20);
  }

  preload() {
    this.load.spritesheet('hero_walk', '/assets/sprites/walk.png', { frameWidth: 256, frameHeight: 280 });
    this.load.spritesheet('hero_idle', '/assets/sprites/idle.png', { frameWidth: 256, frameHeight: 280 });

    this.createTileTexture('tile_hierba', 0x4ade80, 0x22c55e);
    this.createTileTexture('tile_agua', 0x3b82f6, 0x2563eb);
    this.createTileTexture('tile_arena', 0xfcd34d, 0xd97706);
    this.createTileTexture('tile_nieve', 0xf8fafc, 0xcbd5e1);
    
    this.createTrees();
    this.createBeastTextures(); 
  }

  create() {
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('hero_walk', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('hero_idle', { start: 0, end: 7 }), frameRate: 6, repeat: -1 });
    this.createVignette();

    this.cameras.main.setBackgroundColor('#4ade80');

    this.province = INITIAL_PROVINCES.find(p => p.id === 'prov_shaanxi') || INITIAL_PROVINCES[0];
    
    this.treeGroup = this.physics.add.staticGroup();
    this.faunaGroup = this.physics.add.group(); 

    let startMapX = 8;
    let startMapY = 8;
    try {
      const saved = localStorage.getItem('murim_player_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          startMapX = parsed.x;
          startMapY = parsed.y;
        }
      }
    } catch (e) {}

    const startPos = mapToScreen(startMapX, startMapY);
    this.player = this.physics.add.sprite(startPos.x, startPos.y + CUBE_HEIGHT, 'hero_idle');
    this.player.setOrigin(0.5, 0.9);
    this.player.setScale(0.16); 
    
    this.physics.add.collider(this.player, this.treeGroup);
    // NOTA: Quitamos la colisión del jugador con el faunaGroup para poder caminar sobre los peces
    this.physics.add.collider(this.faunaGroup, this.treeGroup); 

    this.player.play('idle');
    this.player.setDepth(startPos.y + CUBE_HEIGHT);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.updateChunksAroundPlayer();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isMoving) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const mapCoords = screenToMap(worldPoint.x, worldPoint.y);
      
      // Solo bloquear si es agua, no si es un animal
      if (this.waterTiles.has(`${mapCoords.x},${mapCoords.y}`)) return; 
      if (this.treeGroup.getChildren().some((t: any) => t.x === mapToScreen(mapCoords.x, mapCoords.y).x && t.y === mapToScreen(mapCoords.x, mapCoords.y).y + CUBE_HEIGHT)) return;

      const startMapCoords = screenToMap(this.player.x, this.player.y - CUBE_HEIGHT);
      // Usar el set de obstáculos que ahora NO incluye el agua
      const path = findPath(startMapCoords.x, startMapCoords.y, mapCoords.x, mapCoords.y, (x, y) => this.obstacles.has(`${x},${y}`));

      if (path.length > 0) {
        this.isMoving = true;
        this.player.play('walk');
        const tweenConfigs = [];
        for (let i = 1; i < path.length; i++) {
          const targetPos = mapToScreen(path[i].x, path[i].y);
          tweenConfigs.push({
            x: targetPos.x,
            y: targetPos.y + CUBE_HEIGHT,
            duration: 200,
            onUpdate: () => { this.player.setDepth(this.player.y); }
          });
        }
        
        this.tweens.chain({
          targets: this.player,
          tweens: tweenConfigs,
          onComplete: () => {
            this.isMoving = false;
            this.player.play('idle');
            localStorage.setItem('murim_player_pos', JSON.stringify({ x: mapCoords.x, y: mapCoords.y }));
            this.updateChunksAroundPlayer();
          }
        });
      }
    });
  }

  private updateChunksAroundPlayer() {
    const mapCoords = screenToMap(this.player.x, this.player.y - CUBE_HEIGHT);
    const currentChunkX = Math.floor(mapCoords.x / CHUNK_SIZE);
    const currentChunkY = Math.floor(mapCoords.y / CHUNK_SIZE);

    const requiredChunks = new Set<string>();
    for (let dx = -LOAD_RADIUS; dx <= LOAD_RADIUS; dx++) {
      for (let dy = -LOAD_RADIUS; dy <= LOAD_RADIUS; dy++) {
        requiredChunks.add(`${currentChunkX + dx},${currentChunkY + dy}`);
      }
    }

    for (const [key, chunk] of this.loadedChunks.entries()) {
      if (!requiredChunks.has(key)) this.unloadChunk(key, chunk);
    }

    for (const key of requiredChunks) {
      if (!this.loadedChunks.has(key)) {
        const [cx, cy] = key.split(',').map(Number);
        this.loadChunk(cx, cy);
      }
    }
  }

  // Efecto visual de chapoteo
  private createSplash(x: number, y: number) {
    const splash = this.add.image(x, y, 'splash_ring');
    splash.setDepth(y + 2);
    splash.setAlpha(0.8);
    this.tweens.add({
      targets: splash,
      scaleX: 3,
      scaleY: 1.5, // Achatado por la perspectiva isométrica
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => splash.destroy()
    });
  }

  private loadChunk(chunkX: number, chunkY: number) {
    const key = `${chunkX},${chunkY}`;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const chunkObstacles: string[] = [];

    const tiles = generateChunkTerrain(this.province.id, this.province.biome, chunkX, chunkY, CHUNK_SIZE);
    
    tiles.forEach(tile => {
      const pos = mapToScreen(tile.x, tile.y);
      const depth = pos.y;
      
      const img = this.add.image(pos.x, pos.y + CUBE_HEIGHT, `tile_${tile.type}`);
      img.setOrigin(0.5, 0);
      img.setDepth(depth);
      objects.push(img);

      if (tile.type === 'agua') {
        this.waterTiles.add(`${tile.x},${tile.y}`); // Guardamos dónde hay agua
        if (tile.waterDepth === 1) img.setTint(0x1e3a8a); 
        
        const tileSeed = stringToHash(`water_${tile.x}_${tile.y}`);
        const rng = mulberry32(tileSeed);
        this.tweens.add({
          targets: img,
          alpha: { from: 0.85, to: 1 },
          duration: 2000 + (rng() * 1000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: rng() * 2000
        });
        return; 
      }

      if (tile.type === 'hierba' || tile.type === 'arena' || tile.type === 'nieve') {
        const tileSeed = stringToHash(`${chunkX}_${chunkY}_${tile.x}_${tile.y}`);
        const rng = mulberry32(tileSeed);
        const treeRng = rng(); 

        if (treeRng < tile.density) {
          let treeKey = 'tree_round';
          if (tile.isNearWater || tile.type === 'arena') treeKey = treeRng > 0.3 ? 'tree_palm' : 'tree_dead';
          else if (tile.type === 'nieve') treeKey = treeRng > 0.4 ? 'tree_pine' : 'tree_dead';
          else {
            if (treeRng > 0.85) treeKey = 'tree_dead';
            else if (treeRng > 0.4) treeKey = 'tree_pine';
          }

          const scaleVariance = 0.85 + (rng() * 0.3); 
          const isFlipped = rng() > 0.5;

          const treeImg = this.treeGroup.create(pos.x, pos.y + CUBE_HEIGHT, treeKey) as Phaser.Physics.Arcade.Sprite;
          treeImg.setOrigin(0.5, 0.9);
          treeImg.setScale(scaleVariance);
          treeImg.setFlipX(isFlipped);
          treeImg.setDepth(pos.y + 1); 

          if (treeImg.body) {
            treeImg.body.setSize(20, 20);
            treeImg.body.setOffset(22, 40);
          }
          objects.push(treeImg);
          chunkObstacles.push(`${tile.x},${tile.y}`);
        }
      }
    });

    // --- POBLACIÓN DE FAUNA ---
    const chunkFauna = generateChunkFauna(this.province.id, chunkX, chunkY, CHUNK_SIZE);
    chunkFauna.forEach(beast => {
      const tileKey = `${beast.x},${beast.y}`;
      const isWaterHere = this.waterTiles.has(tileKey);
      const isBlockedHere = this.obstacles.has(tileKey) || chunkObstacles.includes(tileKey);

      // REGLA: Los acuáticos solo en agua. Los terrestres solo en tierra libre.
      if (beast.isAquatic && !isWaterHere) return;
      if (!beast.isAquatic && (isWaterHere || isBlockedHere)) return;

      const pos = mapToScreen(beast.x, beast.y);
      
      let texture = 'beast_wolf';
      if (beast.name.includes('Águila')) texture = 'beast_eagle';
      if (beast.name.includes('Serpiente') || beast.name.includes('Carpa') || beast.name.includes('Dragón')) texture = 'beast_snake';

      const beastImg = this.faunaGroup.create(pos.x, pos.y + CUBE_HEIGHT, texture) as Phaser.Physics.Arcade.Sprite;
      beastImg.setOrigin(0.5, 0.9);
      beastImg.setScale(0.8);
      
      if (beastImg.body) {
        beastImg.body.setSize(20, 20);
        beastImg.body.setOffset(6, 12);
      }

      if (beast.isAquatic) {
        // IA Acuática: Se esconde bajo el agua y salta periódicamente
        beastImg.setDepth(pos.y - 1); // Debajo del agua (el agua tiene depth pos.y)
        beastImg.setAlpha(0.5); // Se ve semi-transparente bajo el agua

        this.time.addEvent({
          delay: 2000 + Math.random() * 3000,
          loop: true,
          callback: () => {
            if (!beastImg.active) return;
            
            // El animal salta
            beastImg.setDepth(pos.y + 2); // Sube a la superficie
            beastImg.setAlpha(1);
            this.createSplash(beastImg.x, beastImg.y); // Crea el chapoteo

            this.tweens.add({
              targets: beastImg,
              y: beastImg.y - 15, // Salta 15px hacia arriba
              duration: 300,
              yoyo: true,
              ease: 'Quad.easeOut',
              onComplete: () => {
                this.createSplash(beastImg.x, beastImg.y); // Chapoteo al caer
                beastImg.setDepth(pos.y - 1); // Se vuelve a sumergir
                beastImg.setAlpha(0.5);
              }
            });
          }
        });

      } else {
        // IA Terrestre: Camina aleatoriamente
        beastImg.setDepth(pos.y + 1);
        this.tweens.add({
          targets: beastImg,
          x: pos.x + (Math.random() * 100 - 50),
          y: pos.y + CUBE_HEIGHT + (Math.random() * 50 - 25),
          duration: 3000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: () => { beastImg.setDepth(beastImg.y); }
        });
      }

      objects.push(beastImg);
    });

    chunkObstacles.forEach(o => this.obstacles.add(o));
    this.loadedChunks.set(key, { objects, obstacles: chunkObstacles });
  }

  private unloadChunk(key: string, chunk: Chunk) {
    chunk.objects.forEach(obj => obj.destroy());
    chunk.obstacles.forEach(o => this.obstacles.delete(o));
    this.loadedChunks.delete(key);
  }
}