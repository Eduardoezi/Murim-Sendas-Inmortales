import Phaser from 'phaser';
import { getJointPosition, getWalkAnimationAngles } from '../utils/kinematics';
import { WORLD_SCALE } from '../config';

export type Facing8 =
  | 'up' | 'down' | 'left' | 'right'
  | 'up-left' | 'up-right' | 'down-left' | 'down-right';

const CUBE_HEIGHT = 16;
const BODY_W = 20;
const BODY_H = 12;

export class PlayerEntity {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public graphics: Phaser.GameObjects.Graphics;
  public isMoving = false;
  public facing: Facing8 = 'down';

  private readonly SCALE = WORLD_SCALE;
  private readonly L_neck = 8 * this.SCALE;
  private readonly L_torso = 30 * this.SCALE;
  private readonly L_upperArm = 18 * this.SCALE;
  private readonly L_lowerArm = 16 * this.SCALE;
  private readonly L_pelvis = 10 * this.SCALE;
  private readonly L_upperLeg = 20 * this.SCALE;
  private readonly L_lowerLeg = 20 * this.SCALE;

  constructor(scene: Phaser.Scene, startX: number, startY: number) {
    this.sprite = scene.physics.add.sprite(startX, startY, 'tile_hierba');
    this.sprite.setOrigin(0.5, 0.9);
    this.sprite.setVisible(false);
    this.sprite.setDepth(startY);

    if (this.sprite.body) {
      this.sprite.body.setSize(BODY_W, BODY_H);
      this.sprite.body.setOffset((64 - BODY_W) / 2, 32 - BODY_H - 2);
    }

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(startY);
  }

  public update(time: number): void {
    this.graphics.clear();
    const g = this.graphics;

    const legLength = this.L_upperLeg + this.L_lowerLeg;
    const origin = { x: this.sprite.x, y: this.sprite.y - legLength };

    const angles = getWalkAnimationAngles(time * 0.002, this.isMoving);

    const torsoBase = { x: origin.x, y: origin.y - this.L_pelvis };
    const neckPos = this.getJoint(torsoBase, this.L_torso, Math.PI + angles.torso);
    const headPos = this.getJoint(neckPos, this.L_neck, Math.PI + angles.torso + angles.head);

    const shoulderOffset = 8 * this.SCALE;
    const shoulderL = { x: neckPos.x - shoulderOffset, y: neckPos.y + 5 * this.SCALE };
    const shoulderR = { x: neckPos.x + shoulderOffset, y: neckPos.y + 5 * this.SCALE };

    const elbowL = this.getJoint(shoulderL, this.L_upperArm, angles.shoulderL);
    const handL = this.getJoint(elbowL, this.L_lowerArm, angles.shoulderL + angles.elbowL);
    const elbowR = this.getJoint(shoulderR, this.L_upperArm, angles.shoulderR);
    const handR = this.getJoint(elbowR, this.L_lowerArm, angles.shoulderR + angles.elbowR);

    const hipOffset = 5 * this.SCALE;
    const hipL = { x: origin.x - hipOffset, y: origin.y };
    const hipR = { x: origin.x + hipOffset, y: origin.y };

    const kneeL = this.getJoint(hipL, this.L_upperLeg, angles.hipL);
    const footL = this.getJoint(kneeL, this.L_lowerLeg, angles.hipL + angles.kneeL);
    const kneeR = this.getJoint(hipR, this.L_upperLeg, angles.hipR);
    const footR = this.getJoint(kneeR, this.L_lowerLeg, angles.hipR + angles.kneeR);

    // Cabeza y ojo según facing de 8 ejes
    g.lineStyle(4 * this.SCALE, 0x1e293b, 1);
    g.fillStyle(0xef4444, 1);
    g.lineBetween(origin.x, origin.y, torsoBase.x, torsoBase.y);
    g.lineBetween(torsoBase.x, torsoBase.y, neckPos.x, neckPos.y);
    g.lineBetween(neckPos.x, neckPos.y, headPos.x, headPos.y);

    g.fillStyle(0xfcd34d, 1);
    g.fillCircle(headPos.x, headPos.y, 7 * this.SCALE);

    // Ojo direccional
    const eyeHidden = this.facing === 'up';
    if (!eyeHidden) {
      const dir = this.getFacingVector();
      g.fillStyle(0x000000, 1);
      g.fillCircle(
        headPos.x + dir.x * 3 * this.SCALE,
        headPos.y + dir.y * 2 * this.SCALE,
        1.5 * this.SCALE
      );
    }

    // Extremidades
    g.fillStyle(0xef4444, 1);
    g.lineBetween(shoulderL.x, shoulderL.y, elbowL.x, elbowL.y);
    g.lineBetween(elbowL.x, elbowL.y, handL.x, handL.y);
    g.lineBetween(shoulderR.x, shoulderR.y, elbowR.x, elbowR.y);
    g.lineBetween(elbowR.x, elbowR.y, handR.x, handR.y);
    g.lineBetween(hipL.x, hipL.y, kneeL.x, kneeL.y);
    g.lineBetween(kneeL.x, kneeL.y, footL.x, footL.y);
    g.lineBetween(hipR.x, hipR.y, kneeR.x, kneeR.y);
    g.lineBetween(kneeR.x, kneeR.y, footR.x, footR.y);

    const joints = [torsoBase, neckPos, shoulderL, shoulderR, elbowL, elbowR,
      handL, handR, hipL, hipR, kneeL, kneeR, footL, footR];
    joints.forEach((j) => g.fillCircle(j.x, j.y, 3 * this.SCALE));
  }

  private getFacingVector(): { x: number; y: number } {
    switch (this.facing) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      case 'up-left': return { x: -0.7, y: -0.7 };
      case 'up-right': return { x: 0.7, y: -0.7 };
      case 'down-left': return { x: -0.7, y: 0.7 };
      case 'down-right': return { x: 0.7, y: 0.7 };
    }
  }

  private getJoint(start: { x: number; y: number }, length: number, angle: number) {
    return getJointPosition(start, length, angle);
  }

  public walkPath(
    scene: Phaser.Scene,
    path: { x: number; y: number }[],
    mapToScreen: (x: number, y: number) => { x: number; y: number },
    onComplete: () => void
  ): void {
    // Fix #8: guarda contra llamadas concurrentes
    if (this.isMoving) return;

    // Fix #8: si ya estamos en el destino, no hay tween vacío
    if (path.length < 2) {
      onComplete();
      return;
    }

    this.isMoving = true;
    const tweens: Phaser.Types.Tweens.TweenBuilderConfig[] = [];

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const cur = path[i];
      const target = mapToScreen(cur.x, cur.y);

      // Facing de 8 ejes
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      this.facing = this.computeFacing(dx, dy);

      tweens.push({
        targets: this.sprite, 
        x: target.x,
        y: target.y + CUBE_HEIGHT,
        duration: 200,
        onUpdate: () => {
          this.sprite.setDepth(this.sprite.y);
          this.graphics.setDepth(this.sprite.y);
        },
      });
    }

    scene.tweens.chain({
      targets: this.sprite,
      tweens,
      onComplete: () => {
        this.isMoving = false;
        onComplete();
      },
    });
  }

  private computeFacing(dx: number, dy: number): Facing8 {
    const sx = Math.sign(dx);
    const sy = Math.sign(dy);
    if (sx > 0 && sy > 0) return 'down-right';
    if (sx > 0 && sy < 0) return 'up-right';
    if (sx < 0 && sy > 0) return 'down-left';
    if (sx < 0 && sy < 0) return 'up-left';
    if (sx > 0) return 'right';
    if (sx < 0) return 'left';
    if (sy > 0) return 'down';
    return 'up';
  }
}