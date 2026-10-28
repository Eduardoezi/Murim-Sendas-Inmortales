import Phaser from 'phaser';
import { getJointPosition, Point2D } from '../utils/kinematics';
import {
  ArmorType,
  PlayerAppearance,
  PlayerEquipment,
  WeaponType,
} from '../../types/player.types';

export type Facing8 =
  | 'up' | 'down' | 'left' | 'right'
  | 'up-left' | 'up-right' | 'down-left' | 'down-right';

export type EquipSlot = 'weapon' | 'chest';

export interface EquipItemConfig {
  weapon?: WeaponType;
  armor?: ArmorType;
}

export interface ProceduralCharacterConfig {
  cartX: number;
  cartY: number;
  appearance: PlayerAppearance;
  equipment: PlayerEquipment;
  isWalkable: (x: number, y: number) => boolean;
}

const TILE_HALF_W = 32;
const TILE_HALF_H = 16;
/** Altura del ancla isométrica al suelo visible (misma convención que los tiles). */
const GROUND_Y = 16;
const HIP_Y = -8;
const HIP_X = 4.2;
const TORSO_HEIGHT = 26;
const SHOULDER_X = 8.2;
const UPPER_LEG = 12;
const LOWER_LEG = 12;
const UPPER_ARM = 10;
const LOWER_ARM = 10;
const HEAD_OFFSET_Y = -TORSO_HEIGHT - 10;
const OUTLINE = 0x0a0e14;

const MOVE_SPEED = 5; // tiles por segundo
const STUCK_LIMIT_MS = 320;
const ATTACK_DURATION_MS = 320;
const ATTACK_EFFECT_MS = 150;

interface Palette {
  skin: number;
  skinDark: number;
  hair: number;
  hairLight: number;
  outfit: number;
  outfitDark: number;
  outfitLight: number;
  eye: number;
  trim: number;
}

interface WeaponStyle {
  blade: number;
  bladeHi: number;
  guard: number;
  grip: number;
  frost: boolean;
  trail: number;
}

const WEAPON_STYLES: Record<Exclude<WeaponType, 'none'>, WeaponStyle> = {
  'wooden-sword': {
    blade: 0xb98a55, bladeHi: 0xe0bd8b, guard: 0x6f4c2c, grip: 0x4a2f1b,
    frost: false, trail: 0xffd28a,
  },
  'iron-sword': {
    blade: 0xc4ccd6, bladeHi: 0xf2f6fa, guard: 0x88919d, grip: 0x3b2f2a,
    frost: false, trail: 0xdcecff,
  },
  'frost-sword': {
    blade: 0xdff8ff, bladeHi: 0xffffff, guard: 0x66d4e8, grip: 0x2e4a55,
    frost: true, trail: 0x9be8ff,
  },
};

const ARMOR_STYLES: Record<ArmorType, { useOutfit: boolean; main?: number; trim?: number }> = {
  disciple: { useOutfit: true },
  jade: { useOutfit: false, main: 0x2f6b4f, trim: 0x9fe0b6 },
  crimson: { useOutfit: false, main: 0x7a2331, trim: 0xe0a27f },
};

const FACING_VECTOR: Record<Facing8, Point2D> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  'up-left': { x: -0.7, y: -0.7 },
  'up-right': { x: 0.7, y: -0.7 },
  'down-left': { x: -0.7, y: 0.7 },
  'down-right': { x: 0.7, y: 0.7 },
};

function hexToColor(hex: string, fallback: number): number {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  return parseInt(hex.slice(1), 16);
}

function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 0xff) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((color & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

function rotatePoint(x: number, y: number, angle: number): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

/**
 * Avatar 2.5D procedural: un Container con sub-gráficos independientes.
 * Sin spritesheets, sin Arcade Physics, sin tweens de caminata.
 */
export class ProceduralCharacter extends Phaser.GameObjects.Container {
  public cartX: number;
  public cartY: number;
  public isMoving = false;
  public facing: Facing8 = 'down';
  public equipment: PlayerEquipment;

  private appearance: PlayerAppearance;
  private palette: Palette;
  private readonly isWalkable: (x: number, y: number) => boolean;

  private readonly shadow: Phaser.GameObjects.Graphics;
  private readonly legL: Phaser.GameObjects.Graphics;
  private readonly legR: Phaser.GameObjects.Graphics;
  private readonly torso: Phaser.GameObjects.Graphics;
  private readonly armL: Phaser.GameObjects.Graphics;
  private readonly armR: Phaser.GameObjects.Graphics;
  private readonly head: Phaser.GameObjects.Graphics;

  private movePath: Point2D[] = [];
  private pathComplete?: () => void;
  private stuckMs = 0;

  private isAttacking = false;
  private attackStartedAt = Number.NEGATIVE_INFINITY;

  constructor(scene: Phaser.Scene, config: ProceduralCharacterConfig) {
    super(scene, 0, 0);

    this.cartX = config.cartX;
    this.cartY = config.cartY;
    this.appearance = { ...config.appearance };
    this.equipment = { ...config.equipment };
    this.isWalkable = config.isWalkable;
    this.palette = this.buildPalette();

    this.shadow = this.addPart(-20);
    this.legL = this.addPart(0);
    this.legR = this.addPart(1);
    this.torso = this.addPart(2);
    this.armL = this.addPart(3);
    this.armR = this.addPart(4);
    this.head = this.addPart(5);

    this.drawShadow();
    this.drawTorso();
    this.drawHead();
    this.updateRig(0);
    this.applyFacingDepth();
    this.project();

    scene.add.existing(this);
  }

  // ───────────────────────── API pública ─────────────────────────

  public getTilePosition(): Point2D {
    return { x: Math.round(this.cartX), y: Math.round(this.cartY) };
  }

  public setCartPosition(x: number, y: number): void {
    this.cartX = x;
    this.cartY = y;
    this.finishPath();
    this.project();
  }

  /** Sigue un path de tiles (A*) sin tweens: el update avanza en cartX/cartY. */
  public walkPath(path: Point2D[], onComplete?: () => void): void {
    if (this.isMoving) return;
    if (!path || path.length < 2) {
      onComplete?.();
      return;
    }

    this.movePath = path.slice(1).map((p) => ({ x: p.x, y: p.y }));
    this.pathComplete = onComplete;
    this.stuckMs = 0;
    this.isMoving = true;
  }

  public setAppearance(appearance: Partial<PlayerAppearance>): void {
    this.appearance = { ...this.appearance, ...appearance };
    this.palette = this.buildPalette();
    this.drawTorso();
    this.drawHead();
    this.updateRig(this.scene.time.now);
  }

  /** Equipa una pieza y redibuja solo la parte afectada. */
  public equipItem(slot: EquipSlot, item: EquipItemConfig): void {
    if (slot === 'weapon' && item.weapon) {
      this.drawWeapon(item.weapon);
      return;
    }
    if (slot === 'chest' && item.armor) {
      this.equipment.armor = item.armor;
      this.palette = this.buildPalette();
      this.drawTorso();
    }
  }

  /** Dibuja el arma geométricamente dentro del sub-gráfico armR. */
  public drawWeapon(type: WeaponType): void {
    this.equipment.weapon = type;
    this.updateRig(this.scene.time.now);
  }

  public attack(): void {
    if (this.equipment.weapon === 'none' || this.isAttacking) return;
    this.isAttacking = true;
    this.attackStartedAt = this.scene.time.now;
    this.spawnSlashEffect();
  }

  // ───────────────────────── Update / movimiento ─────────────────────────

  public update(time: number, delta: number): void {
    this.updateMovement(delta);
    this.project();
    this.updateRig(time);
  }

  private project(): void {
    this.x = (this.cartX - this.cartY) * TILE_HALF_W;
    this.y = (this.cartX + this.cartY) * TILE_HALF_H;
    this.setDepth(this.y + GROUND_Y);
  }

  private updateMovement(deltaMs: number): void {
    if (!this.isMoving) return;

    const startX = this.cartX;
    const startY = this.cartY;
    let remaining = MOVE_SPEED * Math.min(deltaMs, 64) / 1000;

    while (remaining > 1e-5 && this.movePath.length > 0) {
      const target = this.movePath[0];
      const dx = target.x - this.cartX;
      const dy = target.y - this.cartY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-4) {
        this.movePath.shift();
        continue;
      }

      const step = Math.min(remaining, dist);
      const beforeX = this.cartX;
      const beforeY = this.cartY;
      this.stepWithSlide((dx / dist) * step, (dy / dist) * step);

      const moved = Math.hypot(this.cartX - beforeX, this.cartY - beforeY);
      remaining -= moved;

      if (Math.hypot(target.x - this.cartX, target.y - this.cartY) < 1e-3) {
        this.movePath.shift();
        continue;
      }
      // Resbaló una fracción del paso: no consumas más distancia este frame.
      if (moved + 1e-4 < step) break;
    }

    const totalMoved = Math.hypot(this.cartX - startX, this.cartY - startY);
    if (totalMoved > 1e-5) {
      this.stuckMs = 0;
      this.updateFacing(this.cartX - startX, this.cartY - startY);
    } else {
      this.stuckMs += deltaMs;
      if (this.stuckMs >= STUCK_LIMIT_MS) {
        this.finishPath();
        return;
      }
    }

    if (this.movePath.length === 0) this.finishPath();
  }

  /** Wall sliding: diagonal bloqueada → solo X → solo Y. */
  private stepWithSlide(dx: number, dy: number): void {
    if (this.canStandAt(this.cartX + dx, this.cartY + dy)) {
      this.cartX += dx;
      this.cartY += dy;
      return;
    }
    if (Math.abs(dx) > 1e-6 && this.canStandAt(this.cartX + dx, this.cartY)) {
      this.cartX += dx;
      return;
    }
    if (Math.abs(dy) > 1e-6 && this.canStandAt(this.cartX, this.cartY + dy)) {
      this.cartY += dy;
    }
  }

  private canStandAt(x: number, y: number): boolean {
    return this.isWalkable(Math.round(x), Math.round(y));
  }

  private finishPath(): void {
    this.isMoving = false;
    this.movePath = [];
    this.stuckMs = 0;
    const done = this.pathComplete;
    this.pathComplete = undefined;
    done?.();
  }

  private updateFacing(dCartX: number, dCartY: number): void {
    const screenX = (dCartX - dCartY) * TILE_HALF_W;
    const screenY = (dCartX + dCartY) * TILE_HALF_H;
    const angle = Phaser.Math.Angle.Between(0, 0, screenX, screenY);
    const next = this.facingFromAngle(angle);
    if (next === this.facing) return;

    this.facing = next;
    this.drawTorso();
    this.drawHead();
    this.applyFacingDepth();
  }

  private facingFromAngle(angleRad: number): Facing8 {
    const deg = Phaser.Math.RadToDeg(angleRad);
    if (deg >= -22.5 && deg < 22.5) return 'right';
    if (deg >= 22.5 && deg < 67.5) return 'down-right';
    if (deg >= 67.5 && deg < 112.5) return 'down';
    if (deg >= 112.5 && deg < 157.5) return 'down-left';
    if (deg >= 157.5 || deg < -157.5) return 'left';
    if (deg >= -157.5 && deg < -112.5) return 'up-left';
    if (deg >= -112.5 && deg < -67.5) return 'up';
    return 'up-right';
  }

  // ───────────────────────── Animación matemática ─────────────────────────

  private updateRig(time: number): void {
    const moving = this.isMoving;
    const stride = Math.sin(time * (moving ? 0.013 : 0.0016));
    const breath = Math.sin(time * 0.0016);

    const legSwing = moving ? stride * 0.55 : breath * 0.06;
    const legRSwing = -legSwing;
    const kneeL = moving ? Math.max(0, -stride) * 0.7 : 0.03 + Math.max(0, -breath) * 0.04;
    const kneeR = moving ? Math.max(0, stride) * 0.7 : 0.03 + Math.max(0, breath) * 0.04;

    const bob = moving ? -Math.abs(stride) * 1.8 : breath * 1.0;
    const tilt = Phaser.Math.DegToRad(moving ? stride * 1.7 : breath * 0.45);

    const torsoY = HIP_Y + bob;
    this.torso.setPosition(0, torsoY).setRotation(tilt);

    const shoulderL = rotatePoint(-SHOULDER_X, -TORSO_HEIGHT + 2, tilt);
    const shoulderR = rotatePoint(SHOULDER_X, -TORSO_HEIGHT + 2, tilt);
    this.armL.setPosition(shoulderL.x, torsoY + shoulderL.y);
    this.armR.setPosition(shoulderR.x, torsoY + shoulderR.y);

    const headAnchor = rotatePoint(0, HEAD_OFFSET_Y, tilt);
    this.head.setPosition(
      headAnchor.x,
      torsoY + headAnchor.y + (moving ? Math.sin(time * 0.026) * 0.5 : breath * 0.25),
    );

    // La respiración mueve el cuerpo completo: las piernas siguen el mismo bob
    // para que los pies no queden anclados mientras el torso sube y baja.
    const legBob = moving ? bob * 0.35 : bob;
    this.legL.setPosition(-HIP_X, HIP_Y + legBob);
    this.legR.setPosition(HIP_X, HIP_Y + legBob);

    let armLAngle = moving ? -stride * 0.45 : -breath * 0.03;
    let armRAngle = moving ? stride * 0.45 : breath * 0.03;
    let elbowL = 0.18 + (moving ? Math.max(0, stride) * 0.35 : Math.max(0, breath) * 0.04);
    let elbowR = 0.18 + (moving ? Math.max(0, -stride) * 0.35 : Math.max(0, -breath) * 0.04);

    if (this.isAttacking) {
      const t = Phaser.Math.Clamp((time - this.attackStartedAt) / ATTACK_DURATION_MS, 0, 1);
      const eased = Phaser.Math.Easing.Quadratic.Out(t);
      armRAngle = Phaser.Math.Linear(-2.35, 1.05, eased);
      elbowR = Phaser.Math.Linear(0.05, 0.15, eased);
      armLAngle = Phaser.Math.Linear(0.25, -0.4, eased);
      if (t >= 1) this.isAttacking = false;
    }

    this.drawArm(this.armL, armLAngle, elbowL, false);
    this.drawArm(this.armR, armRAngle, elbowR, true);
    this.drawLeg(this.legL, legSwing, kneeL, true);
    this.drawLeg(this.legR, legRSwing, kneeR, false);
  }

  // ───────────────────────── Depth sorting ─────────────────────────

  private applyFacingDepth(): void {
    const north = this.facing === 'up' || this.facing === 'up-left' || this.facing === 'up-right';
    const south = this.facing === 'down' || this.facing === 'down-left' || this.facing === 'down-right';

    if (north) {
      // De espaldas: cabeza y brazos quedan detrás del torso.
      this.legL.setDepth(0);
      this.legR.setDepth(1);
      this.head.setDepth(2);
      this.armL.setDepth(3);
      this.armR.setDepth(4);
      this.torso.setDepth(5);
    } else if (south) {
      // De frente: el arma y la cabeza se dibujan por delante.
      this.legL.setDepth(0);
      this.legR.setDepth(1);
      this.torso.setDepth(2);
      this.head.setDepth(3);
      this.armL.setDepth(4);
      this.armR.setDepth(5);
    } else if (this.facing === 'right') {
      this.legL.setDepth(0);
      this.legR.setDepth(1);
      this.armR.setDepth(2);
      this.torso.setDepth(3);
      this.head.setDepth(4);
      this.armL.setDepth(5);
    } else {
      this.legL.setDepth(0);
      this.legR.setDepth(1);
      this.armL.setDepth(2);
      this.torso.setDepth(3);
      this.head.setDepth(4);
      this.armR.setDepth(5);
    }

    this.shadow.setDepth(-20);
    this.sort('depth');
  }

  // ───────────────────────── Dibujo del rig ─────────────────────────

  private addPart(depth: number): Phaser.GameObjects.Graphics {
    const graphics = new Phaser.GameObjects.Graphics(this.scene);
    graphics.setDepth(depth);
    this.add(graphics);
    return graphics;
  }

  private buildPalette(): Palette {
    const skin = hexToColor(this.appearance.skinTone, 0xf5d0a9);
    const hair = hexToColor(this.appearance.hairColor, 0x1a1a1a);
    const armor = ARMOR_STYLES[this.equipment.armor] ?? ARMOR_STYLES.disciple;
    const outfit = armor.useOutfit
      ? hexToColor(this.appearance.outfitColor, 0x2d4a22)
      : armor.main ?? 0x2d4a22;

    return {
      skin,
      skinDark: shade(skin, 0.82),
      hair,
      hairLight: shade(hair, 1.4),
      outfit,
      outfitDark: shade(outfit, 0.62),
      outfitLight: shade(outfit, 1.32),
      eye: hexToColor(this.appearance.eyeColor, 0x4a2511),
      trim: armor.trim ?? shade(outfit, 1.45),
    };
  }

  private drawShadow(): void {
    const g = this.shadow;
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, GROUND_Y, 25, 9);
  }

  private drawTorso(): void {
    const g = this.torso;
    const p = this.palette;
    const armor = this.equipment.armor;
    const back = this.facing === 'up' || this.facing === 'up-left' || this.facing === 'up-right';
    const side = this.facing === 'left' || this.facing === 'right';
    const sideDir = this.facing === 'left' ? -1 : 1;
    g.clear();

    const shoulder = side ? 7 : armor === 'crimson' ? 9.5 : 8.5;
    const hem = side ? 8.2 : armor === 'jade' ? 11 : 9.5;

    // Silueta de la túnica.
    const silhouette = side
      ? [
          { x: -5.8, y: -TORSO_HEIGHT },
          { x: 5.8, y: -TORSO_HEIGHT },
          { x: 7.6, y: 4 },
          { x: 3.6, y: 6 },
          { x: -3.6, y: 6 },
          { x: -7.6, y: 4 },
        ]
      : [
          { x: -shoulder, y: -TORSO_HEIGHT },
          { x: shoulder, y: -TORSO_HEIGHT },
          { x: hem, y: 4 },
          { x: 4.5, y: 6 },
          { x: -4.5, y: 6 },
          { x: -hem, y: 4 },
        ];
    g.fillStyle(p.outfitDark, 0.9);
    g.fillPoints(silhouette.map((pt) => ({ x: pt.x + 0.6, y: pt.y + 0.8 })), true);

    g.fillStyle(p.outfit, 1);
    g.fillPoints(silhouette, true);
    g.lineStyle(1.6, OUTLINE, 0.85);
    g.strokePoints(silhouette, true);

    // Sombra lateral: en perfil cae en el borde opuesto al frente.
    g.fillStyle(p.outfitDark, 0.4);
    if (side) {
      g.fillPoints([
        { x: -sideDir * 1.6, y: -TORSO_HEIGHT + 1 },
        { x: -sideDir * 5.8, y: -TORSO_HEIGHT },
        { x: -sideDir * 7.4, y: 4 },
        { x: -sideDir * 2.6, y: 6 },
      ], true);
    } else {
      g.fillPoints([
        { x: 2.5, y: -TORSO_HEIGHT + 1 },
        { x: shoulder, y: -TORSO_HEIGHT },
        { x: hem, y: 4 },
        { x: 3, y: 6 },
      ], true);
    }

    // Pliegues: la espalda lleva costura central y canesú; el perfil, pliegues verticales.
    g.lineStyle(1, p.outfitDark, 0.55);
    if (back) {
      g.lineBetween(-shoulder + 1.2, -TORSO_HEIGHT + 8, shoulder - 1.2, -TORSO_HEIGHT + 8);
      g.lineBetween(0, -TORSO_HEIGHT + 1.5, 0, 4.2);
      g.lineBetween(-5.5, -18, -3.6, -6);
      g.lineBetween(5.5, -18, 3.6, -6);
      g.lineStyle(1, p.outfitLight, 0.16);
      g.lineBetween(-1.4, -TORSO_HEIGHT + 2.5, -2.4, 1.5);
    } else if (side) {
      g.lineBetween(sideDir * 1.4, -TORSO_HEIGHT + 2.5, sideDir * 2.2, 2.5);
      g.lineStyle(1, p.outfitLight, 0.22);
      g.lineBetween(-sideDir * 1.2, -TORSO_HEIGHT + 4, -sideDir * 2, 1);
    } else {
      g.lineBetween(-4.5, -20, -6.5, 3);
      g.lineBetween(1.5, -18, 2.5, 4);
    }

    // Cinturón: nudo al frente, lazo a la espalda, hebilla lateral de perfil.
    g.fillStyle(0x2a1d13, 1);
    if (side) {
      g.fillRect(-6.2, -6.5, 12.4, 3.4);
      g.fillStyle(p.trim, 0.95);
      g.fillCircle(sideDir * 2.8, -4.9, 1.9);
      g.lineStyle(1.2, p.trim, 0.85);
      g.lineBetween(sideDir * 2.6, -4.2, sideDir * 4.4, -1.6);
    } else if (back) {
      g.fillRect(-7, -6.5, 14, 3.4);
      g.lineStyle(1, p.trim, 0.5);
      g.strokeRect(-7, -6.5, 14, 3.4);
      g.fillStyle(p.trim, 0.95);
      g.fillPoints([
        { x: -2.6, y: -7.1 },
        { x: 0, y: -5.4 },
        { x: 2.6, y: -7.1 },
        { x: 1.2, y: -3.4 },
        { x: -1.2, y: -3.4 },
      ], true);
      g.lineStyle(1.2, p.trim, 0.8);
      g.lineBetween(-1.4, -4.2, -3.2, -1);
      g.lineBetween(1.4, -4.2, 3.2, -1);
    } else {
      g.fillRect(-7, -6.5, 14, 3.4);
      g.fillStyle(p.trim, 0.95);
      g.fillRect(-1.6, -6.9, 3.2, 3.8);
    }

    // Cuello: V al frente, nuca cubierta en la espalda, borde lateral en perfil.
    if (back) {
      g.fillStyle(p.skinDark, 1);
      g.fillEllipse(0, -TORSO_HEIGHT + 0.8, 7.4, 3.2);
      g.fillStyle(p.outfitDark, 1);
      g.fillRect(-5.4, -TORSO_HEIGHT + 1.2, 10.8, 2.6);
      g.lineStyle(1.1, p.outfitLight, 0.4);
      g.lineBetween(-4.8, -TORSO_HEIGHT + 2.4, 4.8, -TORSO_HEIGHT + 2.4);
    } else if (side) {
      g.fillStyle(p.skin, 0.95);
      g.fillEllipse(sideDir * 1.8, -TORSO_HEIGHT + 2, 4.2, 5.2);
      g.lineStyle(1.2, p.outfitDark, 0.9);
      g.lineBetween(sideDir * 4.6, -TORSO_HEIGHT + 1.2, sideDir * 2.4, -TORSO_HEIGHT + 5);
    } else {
      g.fillStyle(p.skin, 1);
      g.fillTriangle(-3.8, -TORSO_HEIGHT + 0.4, 3.8, -TORSO_HEIGHT + 0.4, 0, -18.5);
      g.lineStyle(1.3, p.outfitDark, 0.85);
      g.lineBetween(-5.5, -TORSO_HEIGHT + 1, 0, -17.5);
      g.lineBetween(5.5, -TORSO_HEIGHT + 1, 0, -17.5);
    }

    // Detalles de la armadura según la cara visible.
    if (armor === 'jade') {
      g.lineStyle(1.2, p.trim, 0.8);
      if (back) {
        g.lineBetween(-7.8, -18.5, 7.8, -18.5);
        g.lineBetween(-8.4, -13.5, 8.4, -13.5);
        g.fillStyle(p.trim, 0.3);
        g.fillCircle(0, -22.5, 2.8);
        g.lineStyle(1, p.trim, 0.8);
        g.strokeCircle(0, -22.5, 2.8);
      } else if (side) {
        g.lineBetween(-4.8, -15, sideDir * 6.8, -15);
        g.lineBetween(-5.2, -10, sideDir * 7.2, -10);
        g.fillStyle(p.trim, 0.3);
        g.fillCircle(sideDir * 3.4, -20, 2.2);
      } else {
        g.lineBetween(-7.5, -14, 7.5, -14);
        g.lineBetween(-8.5, -9, 8.5, -9);
        g.fillStyle(p.trim, 0.35);
        g.fillRect(-3, -15, 6, 2.5);
      }
    } else if (armor === 'crimson') {
      const plate = side
        ? [
            { x: sideDir * 1.8 - 4.8, y: -22.5 },
            { x: sideDir * 1.8 + 4.8, y: -22 },
            { x: sideDir * 1.8 + 5.4, y: -13 },
            { x: sideDir * 1.8, y: -10 },
            { x: sideDir * 1.8 - 4.8, y: -13 },
          ]
        : back
          ? [
              { x: -7.4, y: -23 },
              { x: 7.4, y: -23 },
              { x: 5.8, y: -12 },
              { x: 0, y: -9.5 },
              { x: -5.8, y: -12 },
            ]
          : [
              { x: -7.5, y: -23 },
              { x: 7.5, y: -23 },
              { x: 5.5, y: -11 },
              { x: 0, y: -8 },
              { x: -5.5, y: -11 },
            ];
      g.fillStyle(shade(p.outfit, side ? 1.15 : 1.25), 0.95);
      g.fillPoints(plate, true);
      g.lineStyle(1.2, p.trim, 0.85);
      g.strokePoints(plate, true);
      if (back) {
        g.lineStyle(1, p.trim, 0.6);
        g.lineBetween(0, -22, 0, -10.5);
      }
    }
  }

  private drawLeg(
    g: Phaser.GameObjects.Graphics,
    hipAngle: number,
    kneeAngle: number,
    farSide: boolean,
  ): void {
    const knee = getJointPosition({ x: 0, y: 0 }, UPPER_LEG, hipAngle);
    const lowerAngle = hipAngle - kneeAngle;
    const foot = getJointPosition(knee, LOWER_LEG, lowerAngle);
    const pants = shade(this.palette.outfit, farSide ? 0.45 : 0.55);
    const boot = farSide ? 0x201814 : 0x2b201a;

    g.clear();
    this.strokeLimb(g, 0, 0, knee.x, knee.y, 6.2, pants);
    this.strokeLimb(g, knee.x, knee.y, foot.x, foot.y, 5.2, pants);

    g.fillStyle(OUTLINE, 0.8);
    g.fillEllipse(foot.x, foot.y + 0.6, 8.6, 5.4);
    g.fillStyle(boot, 1);
    g.fillEllipse(foot.x, foot.y + 0.5, 6.6, 3.8);
  }

  private drawArm(
    g: Phaser.GameObjects.Graphics,
    shoulderAngle: number,
    elbowAngle: number,
    weaponArm: boolean,
  ): void {
    const elbow = getJointPosition({ x: 0, y: 0 }, UPPER_ARM, shoulderAngle);
    const forearmAngle = shoulderAngle + elbowAngle;
    const hand = getJointPosition(elbow, LOWER_ARM, forearmAngle);
    const sleeve = weaponArm
      ? this.palette.outfit
      : shade(this.palette.outfit, 0.82);

    g.clear();
    this.strokeLimb(g, 0, 0, elbow.x, elbow.y, 5.8, sleeve);
    this.strokeLimb(g, elbow.x, elbow.y, hand.x, hand.y, 4.2, this.palette.skin);

    if (weaponArm) {
      this.drawWeaponOnArm(g, hand, forearmAngle);
    }

    g.fillStyle(OUTLINE, 0.85);
    g.fillCircle(hand.x, hand.y, 3.2);
    g.fillStyle(this.palette.skin, 1);
    g.fillCircle(hand.x, hand.y, 2.3);

    // Hombrera.
    g.fillStyle(OUTLINE, 0.8);
    g.fillCircle(0, 0, 4.5);
    g.fillStyle(sleeve, 1);
    g.fillCircle(0, 0, 3.6);
    g.fillStyle(this.palette.outfitLight, 0.5);
    g.fillCircle(-1, -1.2, 1.6);
  }

  private drawWeaponOnArm(
    g: Phaser.GameObjects.Graphics,
    hand: Point2D,
    forearmAngle: number,
  ): void {
    if (this.equipment.weapon === 'none') return;
    const style = WEAPON_STYLES[this.equipment.weapon];
    if (!style) return;

    const bladeAngle = forearmAngle + 0.3;
    const tip = getJointPosition(hand, 22, bladeAngle);
    const pommel = getJointPosition(hand, -5, bladeAngle);
    const guardCenter = getJointPosition(hand, 1, bladeAngle);
    const perpendicular = bladeAngle + Math.PI / 2;
    const guardA = getJointPosition(guardCenter, 4.4, perpendicular);
    const guardB = getJointPosition(guardCenter, -4.4, perpendicular);

    // Contorno de la hoja.
    g.lineStyle(5.4, OUTLINE, 0.85);
    g.lineBetween(pommel.x, pommel.y, tip.x, tip.y);
    g.lineStyle(3.2, style.blade, 1);
    g.lineBetween(hand.x, hand.y, tip.x, tip.y);

    // Filo iluminado.
    g.lineStyle(1, style.bladeHi, 0.9);
    g.lineBetween(
      Phaser.Math.Linear(hand.x, tip.x, 0.18),
      Phaser.Math.Linear(hand.y, tip.y, 0.18),
      Phaser.Math.Linear(hand.x, tip.x, 0.94),
      Phaser.Math.Linear(hand.y, tip.y, 0.94),
    );

    // Empuñadura.
    g.lineStyle(4.4, OUTLINE, 1);
    g.lineBetween(pommel.x, pommel.y, guardCenter.x, guardCenter.y);
    g.lineStyle(2.9, style.grip, 1);
    g.lineBetween(pommel.x, pommel.y, guardCenter.x, guardCenter.y);

    // Guarda.
    g.lineStyle(4.4, OUTLINE, 1);
    g.lineBetween(guardA.x, guardA.y, guardB.x, guardB.y);
    g.lineStyle(2.6, style.guard, 1);
    g.lineBetween(guardA.x, guardA.y, guardB.x, guardB.y);

    if (style.frost) {
      g.fillStyle(0xaef4ff, 0.85);
      g.fillCircle(tip.x, tip.y, 2.2);
      g.fillStyle(0xe6fdff, 0.65);
      g.fillCircle(
        Phaser.Math.Linear(hand.x, tip.x, 0.55),
        Phaser.Math.Linear(hand.y, tip.y, 0.55),
        1.3,
      );
      g.lineStyle(1, 0x9be8ff, 0.55);
      g.lineBetween(
        Phaser.Math.Linear(hand.x, tip.x, 0.25),
        Phaser.Math.Linear(hand.y, tip.y, 0.25) - 1.8,
        Phaser.Math.Linear(hand.x, tip.x, 0.85),
        Phaser.Math.Linear(hand.y, tip.y, 0.85) - 1.8,
      );
    }
  }

  private strokeLimb(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    color: number,
  ): void {
    g.lineStyle(width + 1.8, OUTLINE, 0.6);
    g.lineBetween(x1, y1, x2, y2);
    g.lineStyle(width, color, 1);
    g.lineBetween(x1, y1, x2, y2);
  }

  // ───────────────────────── Cabeza ─────────────────────────

  private drawHead(): void {
    const g = this.head;
    const p = this.palette;
    const style = this.appearance.hairStyle;
    const dir = FACING_VECTOR[this.facing];
    const back = this.facing === 'up' || this.facing === 'up-left' || this.facing === 'up-right';
    const side = this.facing === 'left' || this.facing === 'right';

    g.clear();

    // Cuello (se dibuja antes que la cabeza).
    g.fillStyle(p.skinDark, 1);
    g.fillRect(-2.8, 4, 5.6, 9);

    // Masa de pelo trasera.
    if (style === 2) {
      g.fillStyle(shade(p.hair, 0.85), 1);
      g.fillPoints([
        { x: -8.4, y: -4 },
        { x: 8.4, y: -4 },
        { x: 9, y: 9 },
        { x: 3, y: 13 },
        { x: -3, y: 13 },
        { x: -9, y: 9 },
      ], true);
    } else if (style === 1) {
      g.fillStyle(shade(p.hair, 0.85), 1);
      g.fillPoints([
        { x: 3, y: -6 },
        { x: 7, y: -1 },
        { x: 8.5, y: 7 },
        { x: 5, y: 11 },
        { x: 2.5, y: 6 },
        { x: 3.5, y: 0 },
      ], true);
    }

    // Rostro.
    g.fillStyle(p.skin, 1);
    g.fillCircle(0, 0, 8);
    g.fillStyle(p.skinDark, 0.45);
    g.fillEllipse(-dir.x * 5, 2, 5, 10);
    g.lineStyle(1.3, OUTLINE, 0.9);
    g.strokeCircle(0, 0, 8);

    // Orejas.
    g.fillStyle(p.skin, 1);
    g.fillCircle(-7.8, 1, 1.9);
    g.fillCircle(7.8, 1, 1.9);

    if (!back) {
      const eyeShiftX = dir.x * 1.1;
      const eyeShiftY = dir.y * 0.5;
      const eyeSides = side ? [Math.sign(dir.x)] : [-1, 1];

      for (const eyeSide of eyeSides) {
        const ex = eyeSide * 2.8 + eyeShiftX;
        const ey = 0.8 + eyeShiftY;

        if (this.appearance.eyeType === 0) {
          g.fillStyle(0xf8fafc, 1);
          g.fillEllipse(ex, ey, 4.3, 3.2);
          g.fillStyle(p.eye, 1);
          g.fillCircle(ex + dir.x * 0.5, ey, 1.35);
          g.fillStyle(0xffffff, 0.85);
          g.fillCircle(ex + dir.x * 0.5 - 0.4, ey - 0.5, 0.45);
        } else {
          g.lineStyle(1.8, 0x1b2430, 1);
          g.lineBetween(ex - 1.9, ey - 0.5, ex + 1.9, ey + 0.6);
          g.fillStyle(p.eye, 1);
          g.fillCircle(ex + dir.x * 0.3, ey + 0.2, 1);
        }

        // Ceja.
        const browY = -2.4 + eyeShiftY;
        g.lineStyle(1.35, 0x241a14, 0.95);
        if (this.appearance.eyebrowType === 1) {
          g.lineBetween(ex - 2.1, browY + 0.5, ex, browY - 0.5);
          g.lineBetween(ex, browY - 0.5, ex + 2.1, browY + 0.5);
        } else if (this.appearance.eyebrowType === 2) {
          g.lineBetween(ex - eyeSide * 2.1, browY - 0.7, ex + eyeSide * 1.9, browY + 0.4);
        } else {
          g.lineBetween(ex - 2, browY, ex + 2, browY);
        }
      }

      // Nariz.
      g.lineStyle(1.2, p.skinDark, 0.9);
      g.lineBetween(dir.x * 1.4, 2.2, dir.x * 1.4 + 0.6, 3.6);

      // Boca.
      g.lineStyle(1.15, 0x7a3540, 0.9);
      if (this.appearance.mouthType === 1) {
        g.beginPath();
        g.arc(dir.x * 0.8, 4.6, 2.2, 0.25, Math.PI - 0.25, false);
        g.strokePath();
      } else {
        g.lineBetween(-1.7 + dir.x * 0.8, 5.4, 1.7 + dir.x * 0.8, 5.4);
      }
    }

    // Casquete de pelo.
    if (back) {
      g.fillStyle(p.hair, 1);
      g.fillCircle(0, -0.5, 8.5);
      g.fillStyle(p.hairLight, 0.16);
      g.fillEllipse(-2, -4, 5, 3);
    } else {
      g.fillStyle(p.hair, 1);
      g.beginPath();
      g.arc(0, -4, 8.5, Math.PI, Math.PI * 2, false);
      g.fillPath();

      // Flequillo irregular.
      g.fillTriangle(-8.2, -4.2, -5.2, -4.6, -6.6, -0.8);
      g.fillTriangle(-4.4, -4.6, -1.4, -4.6, -2.8, -1.5);
      g.fillTriangle(1.2, -4.6, 4.2, -4.6, 2.8, -1.4);
      g.fillTriangle(5, -4.4, 8, -4, 6.8, -0.6);
    }

    // Estilos.
    if (style === 0) {
      g.fillStyle(shade(p.hair, 0.9), 1);
      g.fillCircle(0, -9.6, 3.4);
      g.lineStyle(1, p.trim, 0.8);
      g.lineBetween(-2.4, -9.2, 2.4, -9.2);
    } else if (style === 1) {
      g.fillStyle(p.trim, 0.9);
      g.fillCircle(3.6, -5.2, 1.2);
      if (back) {
        g.fillStyle(p.hair, 1);
        g.fillPoints([
          { x: 2, y: -4 },
          { x: 6.5, y: 0 },
          { x: 7.8, y: 8 },
          { x: 4.6, y: 12 },
          { x: 2.2, y: 7 },
          { x: 3, y: 1 },
        ], true);
      }
    } else if (style === 2 && !back) {
      g.fillStyle(shade(p.hair, 0.92), 1);
      g.fillPoints([
        { x: -8.6, y: -3 },
        { x: -6, y: -0.5 },
        { x: -7.2, y: 9 },
        { x: -9.6, y: 7 },
      ], true);
      g.fillPoints([
        { x: 8.6, y: -3 },
        { x: 6, y: -0.5 },
        { x: 7.2, y: 9 },
        { x: 9.6, y: 7 },
      ], true);
    }

    // Accesorios.
    if (this.appearance.accessoryType === 1) {
      g.fillStyle(0xf5c542, 1);
      g.fillPoints([
        { x: -6, y: -10.5 },
        { x: -4.5, y: -14 },
        { x: -2.5, y: -11.2 },
        { x: 0, y: -15 },
        { x: 2.5, y: -11.2 },
        { x: 4.5, y: -14 },
        { x: 6, y: -10.5 },
      ], true);
      g.lineStyle(1, 0x9a6b14, 0.9);
      g.strokePoints([
        { x: -6, y: -10.5 },
        { x: -4.5, y: -14 },
        { x: -2.5, y: -11.2 },
        { x: 0, y: -15 },
        { x: 2.5, y: -11.2 },
        { x: 4.5, y: -14 },
        { x: 6, y: -10.5 },
      ], true);
      g.fillStyle(0xef4444, 1);
      g.fillCircle(0, -12.8, 1.1);
    } else if (this.appearance.accessoryType === 2) {
      g.lineStyle(1.6, 0x67e8f9, 0.95);
      g.lineBetween(5.5, -4.8, 9.5, -1.2);
      g.lineBetween(6.6, -6.4, 10.2, -3.2);
      g.fillStyle(0xa5f3fc, 0.9);
      g.fillCircle(8.8, -2.7, 1.1);
    }
  }

  // ───────────────────────── Combate procedural ─────────────────────────

  private spawnSlashEffect(): void {
    if (this.equipment.weapon === 'none') return;
    const style = WEAPON_STYLES[this.equipment.weapon];
    if (!style) return;

    const dir = this.facing === 'left' || this.facing === 'up-left' || this.facing === 'down-left'
      ? -1
      : 1;

    const curve = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(-20 * dir, 8),
      new Phaser.Math.Vector2(-6 * dir, -34),
      new Phaser.Math.Vector2(24 * dir, -30),
      new Phaser.Math.Vector2(30 * dir, 10),
    );
    const points = curve.getPoints(22);

    const effect = this.scene.add.graphics();
    effect.setPosition(this.x, this.y - 6);
    effect.setDepth(this.depth + 30);

    // Halo ancho.
    effect.lineStyle(10, style.trail, 0.16);
    effect.beginPath();
    effect.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) effect.lineTo(points[i].x, points[i].y);
    effect.strokePath();

    // Estela con grosor variable.
    const outer: Point2D[] = [];
    const inner: Point2D[] = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const len = Math.hypot(tx, ty) || 1;
      const nx = -ty / len;
      const ny = tx / len;
      const t = i / (points.length - 1);
      const width = Math.sin(t * Math.PI) * 6;
      outer.push({ x: p.x + nx * width, y: p.y + ny * width });
      inner.push({ x: p.x - nx * width, y: p.y - ny * width });
    }

    effect.fillStyle(style.trail, 0.35);
    effect.fillPoints([...outer, ...inner.reverse()], true);

    effect.lineStyle(2.2, 0xffffff, 0.9);
    effect.beginPath();
    effect.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) effect.lineTo(points[i].x, points[i].y);
    effect.strokePath();

    effect.setAlpha(1);
    this.scene.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: ATTACK_EFFECT_MS,
      ease: 'Quad.easeOut',
      onComplete: () => effect.destroy(),
    });
  }
}
