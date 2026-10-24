import Phaser from 'phaser';
import { mapToScreen } from '../utils/isoMath';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private isMoving = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero_idle');


    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 1. El origen: 0.5 (centro X), 0.9 (cerca de la base Y)
    // Esto asegura que los pies del personaje toquen exactamente el suelo del tile.
    this.setOrigin(0.5, 0.9); 
    this.setDepth(x + y + 0.2);

    
    // 2. La Escala: Como el sprite original es enorme (256x280), 
    // lo encogemos a un 35% para que quepa bien en el tile isométrico.
    this.setScale(0.35); 

    // 3. La Caja de Colisión
    if (this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      // Definimos un área de 60x40 píxeles para los pies (en el tamaño original)
      body.setSize(60, 40); 
      // Lo movemos al centro de la base (X=98, Y=230)
      body.setOffset(98, 230); 
    }
  }

  public moveToTile(mapX: number, mapY: number) {
    if (this.isMoving) return;

    const targetPos = mapToScreen(mapX, mapY);
    this.isMoving = true;

    // 1. ¡Empezamos a caminar!
    this.play('walk');

    // Distancia para calcular la velocidad del viaje
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetPos.x, targetPos.y);
    const duration = distance * 3; // 3ms por píxel para que no vuele

    this.scene.tweens.add({
      targets: this,
      x: targetPos.x,
      y: targetPos.y,
      duration: duration,
      ease: 'Linear',
      onUpdate: () => {
        // Actualizamos la profundidad para que el personaje pase por detrás de los árboles si camina hacia arriba
        this.setDepth(this.x + this.y + 0.2);
      },
      onComplete: () => {
        this.isMoving = false;
        // 2. ¡Llegamos! Nos quedamos quietos respirando.
        this.play('idle');
      }
    });
  }
}