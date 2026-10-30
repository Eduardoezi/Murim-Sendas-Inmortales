// src/game/scenes/HudScene.ts
// ─────────────────────────────────────────────────────────────────────────────
// Capa de interfaz del mundo. Existe como escena aparte porque una cámara con
// zoom NO deja indiferentes a los objetos con scrollFactor 0: el zoom vive en la
// matriz de la cámara y escala todo lo que esa cámara pinta. Mientras el
// minimapa estuvo dentro de WorldScene, cada golpe de zoom lo agrandaba y lo
// desplazaba desde el centro de cámara (que sigue al personaje), y el área
// clicable se separaba del dibujo. Aquí la cámara no sigue ni escala a nadie.
// ─────────────────────────────────────────────────────────────────────────────
import Phaser from 'phaser';
import { MinimapSystem } from '../systems/MinimapSystem';
import { AutoMapSystem } from '../systems/AutoMapSystem';
import { MapDiscovery } from '../systems/MapDiscovery';
import { HudDataSource } from '../systems/HudDataSource';
import { MACRO_OVERLAY_ALPHA } from '../rendering/tileTextures';

export const HUD_SCENE_KEY = 'Hud';
const WORLD_SCENE_KEY = 'WorldScene';

const DEPTH_VIGNETTE = 10;
const DEPTH_MACRO = 20;
const DEPTH_MINIMAP = 30;
const DEPTH_AUTOMAP = 40;
const DEPTH_TOAST = 50;

export class HudScene extends Phaser.Scene {
  private discovery!: MapDiscovery;
  private minimap!: MinimapSystem;
  private autoMap!: AutoMapSystem;

  private vignette?: Phaser.GameObjects.Image;
  private macroOverlay?: Phaser.GameObjects.TileSprite;
  private worldSource: (HudDataSource & Phaser.Scene) | null = null;

  constructor() {
    super({ key: HUD_SCENE_KEY });
  }

  private get world(): (HudDataSource & Phaser.Scene) | null {
    if (this.worldSource) return this.worldSource;
    const scene = this.scene.get(WORLD_SCENE_KEY) as unknown as (HudDataSource & Phaser.Scene) | undefined;
    if (scene && typeof scene.getPlayerTile === 'function') this.worldSource = scene;
    return this.worldSource;
  }

  create() {
    this.discovery = new MapDiscovery();

    const world = this.world;
    if (!world) {
      console.error('[hud] WorldScene no está disponible: el minimapa queda inactivo');
      return;
    }

    this.minimap = new MinimapSystem(this, {
      world,
      discovery: this.discovery,
      depth: DEPTH_MINIMAP,
    });

    // Automapa (Tab): overlay no interactivo → el clic-a-mover sigue activo.
    this.autoMap = new AutoMapSystem(this, {
      world,
      discovery: this.discovery,
      depth: DEPTH_AUTOMAP,
    });

    this.createVignette();
    this.bindResize();
  }

  /** ¿El puntero (px de pantalla) está sobre un widget del HUD? WorldScene lo
   *  consulta antes de mover al personaje o de hacer zoom de cámara. */
  public isPointerBlocked(x: number, y: number): boolean {
    return !!this.minimap && this.minimap.isPointerOver(x, y);
  }

  public toggleAutoMap(): void { this.autoMap?.toggle(); }
  public toggleMinimap(): void { this.minimap?.toggleVisible(); }

  /** Aviso efímero sobre el mundo (requisitos de habilidad, saltos inviables). */
  public showToast(message: string): void {
    const x = this.scale.width / 2;
    const y = this.scale.height * 0.58;
    const text = this.add.text(x, y, message, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '15px',
      color: '#e8e0c8',
      backgroundColor: 'rgba(10, 9, 7, 0.78)',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(DEPTH_TOAST).setAlpha(0);

    this.tweens.chain({
      targets: text,
      tweens: [
        { alpha: 1, y: y - 12, duration: 200, ease: 'Sine.easeOut' },
        { alpha: 1, duration: 1100 },
        { alpha: 0, y: y - 24, duration: 320, ease: 'Sine.easeIn', onComplete: () => text.destroy() },
      ],
    });
  }

  update(): void {
    const world = this.world;
    if (!world || !this.minimap) return;

    // Un solo recorrido de revelado alimenta radar y automapa.
    this.discovery.update(world.getPlayerTile());
    this.minimap.update();
    this.autoMap.update();
    this.syncMacroOverlay(world);
  }

  private createVignette(): void {
    const key = 'hud_vignette';
    if (!this.textures.exists(key)) {
      const size = 512;
      const texture = this.textures.createCanvas(key, size, size);
      if (!texture) return;
      const ctx = texture.context;
      const grad = ctx.createRadialGradient(
        size / 2, size / 2, size * 0.16,
        size / 2, size / 2, size * 0.72,
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.45, 'rgba(4,6,8,0.08)');
      grad.addColorStop(0.75, 'rgba(2,4,6,0.34)');
      grad.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      texture.refresh();
    }

    this.vignette = this.add.image(0, 0, key)
      .setOrigin(0, 0)
      .setDepth(DEPTH_VIGNETTE)
      .setDisplaySize(this.scale.width, this.scale.height);
  }

  /**
   * Capa macro de variación: ruido grande en multiply al 14 % sobre el suelo.
   * Anclada al mundo (no a la pantalla): con tileScale = zoom de cámara y
   * tilePosition = scroll, el grano sigue pegado a la misma tesela aunque se
   * haga zoom, y el marco del radar no se mueve por encima.
   */
  private syncMacroOverlay(world: HudDataSource & Phaser.Scene): void {
    if (!this.macroOverlay) {
      if (!this.textures.exists('macro_noise')) return; // lo creó WorldScene
      this.macroOverlay = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'macro_noise')
        .setOrigin(0, 0)
        .setDepth(DEPTH_MACRO)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setAlpha(MACRO_OVERLAY_ALPHA);
    }

    const cam = world.cameras.main;
    this.macroOverlay.setTileScale(cam.zoom, cam.zoom);
    this.macroOverlay.setTilePosition(cam.scrollX, cam.scrollY);
  }

  private bindResize(): void {
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.minimap?.handleResize();
      this.autoMap?.handleResize();
      this.vignette?.setDisplaySize(gameSize.width, gameSize.height);
      this.macroOverlay?.setSize(gameSize.width, gameSize.height);
    });
  }
}
