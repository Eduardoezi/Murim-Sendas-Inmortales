import Phaser from 'phaser';
import { getJointPosition } from '../utils/kinematics';
import { WORLD_SCALE } from '../config';
import { mulberry32, stringToHash } from '../../core/utils/prng';

type BeastState = 'wander' | 'chase' | 'return';

const CHASE_RANGE_PX = 5 * 64;
const LEASH_RANGE_PX = 15 * 64;
const BODY_W = 20;
const BODY_H = 12;

export class BeastEntity {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly graphics: Phaser.GameObjects.Graphics;
  /** Verdadero para fauna acuática (serpientes de río): no cuenta como amenaza en el radar. */
  public isAquatic = false;

  private readonly scene: Phaser.Scene;
  private readonly spawnX: number;
  private readonly spawnY: number;
  private readonly rng: () => number;
  private readonly timeOffset: number;

  private readonly speed = 60;
  private state: BeastState = 'wander';
  private wanderTarget: { x: number; y: number };
  private facing: 1 | -1 = 1;

  /**
   * @param sprite El cuerpo físico YA creado por ChunkManager (dentro de faunaGroup).
   *               NO crear un sprite interno: evita el bug de "doble cerebro".
   * @param beastId Identificador determinista para sembrar el PRNG de la IA.
   */
  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Arcade.Sprite,
    beastId: string,
    spawnX: number,
    spawnY: number
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.spawnX = spawnX;
    this.spawnY = spawnY;

    // PRNG determinista (regla del proyecto: PROHIBIDO Math.random)
    this.rng = mulberry32(stringToHash(`beast_ai_${beastId}`));
    this.timeOffset = this.rng() * 1000;

    sprite.setOrigin(0.5, 0.9);
    sprite.setDepth(spawnY);

    // Cuerpo pequeño y centrado en los "pies" (textura 64x32, origin 0.5/0.9)
    if (sprite.body) {
      sprite.body.setSize(BODY_W, BODY_H);
      sprite.body.setOffset((64 - BODY_W) / 2, 32 - BODY_H - 2);
    }

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(spawnY);

    this.wanderTarget = { x: spawnX, y: spawnY };
  }

  public update(time: number, playerX: number, playerY: number): void {
    if (!this.sprite.active || !this.sprite.body) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    const distToPlayer = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, playerX, playerY
    );
    const distToSpawn = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, this.spawnX, this.spawnY
    );

    // ---------- Máquina de estados ----------
    if (distToSpawn > LEASH_RANGE_PX) {
      this.state = 'return';
    } else if (distToPlayer < CHASE_RANGE_PX) {
      this.state = 'chase';
    } else if (this.state !== 'wander') {
      this.state = 'wander';
      this.pickNewWanderTarget();
    }

    // ---------- Movimiento ----------
    switch (this.state) {
      case 'chase':
        this.scene.physics.moveToObject(this.sprite, { x: playerX, y: playerY }, this.speed * 1.5);
        break;
      case 'return':
        this.scene.physics.moveTo(this.sprite, this.spawnX, this.spawnY, this.speed);
        break;
      case 'wander': {
        const distToTarget = Phaser.Math.Distance.Between(
          this.sprite.x, this.sprite.y, this.wanderTarget.x, this.wanderTarget.y
        );
        if (distToTarget < 12) this.pickNewWanderTarget();
        this.scene.physics.moveTo(
          this.sprite, this.wanderTarget.x, this.wanderTarget.y, this.speed * 0.5
        );
        break;
      }
    }

    // ---------- Anti-atasco ----------
    // Si choca con un árbol, elige un nuevo objetivo (evita caminar "en el sitio")
    if (body.blocked.none === false || body.touching.none === false) {
      body.setVelocity(0, 0);
      this.pickNewWanderTarget();
    }

    // ---------- Orientación visual ----------
    if (Math.abs(body.velocity.x) > 5) {
      this.facing = body.velocity.x > 0 ? 1 : -1;
    }

    // ---------- Render ----------
    const isMoving = body.velocity.length() > 5;
    this.drawBeast(time, isMoving);

    this.graphics.setDepth(this.sprite.y);
    this.sprite.setDepth(this.sprite.y);
  }

  private pickNewWanderTarget(): void {
    const angle = this.rng() * Math.PI * 2;
    const radius = 20 + this.rng() * 80;
    this.wanderTarget.x = this.spawnX + Math.cos(angle) * radius;
    this.wanderTarget.y = this.spawnY + Math.sin(angle) * radius;
  }

  private drawBeast(time: number, isMoving: boolean): void {
    const g = this.graphics;
    g.clear();

    const origin = { x: this.sprite.x, y: this.sprite.y - 10 * WORLD_SCALE };
    const t = (time + this.timeOffset) * 0.005;
    const legSwing = isMoving ? Math.sin(t) * 0.4 : 0;

    const neck = getJointPosition(origin, 15 * WORLD_SCALE, Math.PI / 2);
    const frontLegBase = getJointPosition(origin, 10 * WORLD_SCALE, Math.PI / 2);
    const backLegBase = getJointPosition(origin, 10 * WORLD_SCALE, -Math.PI / 2);
    const frontLegFoot = getJointPosition(frontLegBase, 10 * WORLD_SCALE, legSwing);
    const backLegFoot = getJointPosition(backLegBase, 10 * WORLD_SCALE, -legSwing);

    g.lineStyle(6 * WORLD_SCALE, 0x4a4a4a, 1);
    g.fillStyle(0x4a4a4a, 1);

    // Cuerpo horizontal
    g.lineBetween(backLegBase.x, backLegBase.y, neck.x, neck.y);

    // Cabeza
    g.fillCircle(neck.x, neck.y, 6 * WORLD_SCALE);

    // Ojo (orientación)
    g.fillStyle(0x000000, 1);
    g.fillCircle(neck.x + this.facing * 3 * WORLD_SCALE, neck.y - 1 * WORLD_SCALE, 1.2 * WORLD_SCALE);

    // Patas
    g.lineStyle(3 * WORLD_SCALE, 0x4a4a4a, 1);
    g.lineBetween(frontLegBase.x, frontLegBase.y, frontLegFoot.x, frontLegFoot.y);
    g.lineBetween(backLegBase.x, backLegBase.y, backLegFoot.x, backLegFoot.y);
  }
}