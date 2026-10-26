// src/game/utils/kinematics.ts

export interface Point2D { x: number; y: number; }

/**
 * Calcula la posición final de un hueso basado en su origen, longitud y ángulo.
 * Usa Forward Kinematics (Cinemática Directa).
 * @param origin Punto de origen (Ej: El hombro)
 * @param length Longitud del hueso (Ej: El brazo)
 * @param angle Ángulo en radianes (0 es apuntando hacia abajo)
 */
export function getJointPosition(origin: Point2D, length: number, angle: number): Point2D {
  return {
    x: origin.x + Math.sin(angle) * length,
    y: origin.y + Math.cos(angle) * length // Y positivo es hacia abajo en Phaser
  };
}

/**
 * Genera los ángulos para una animación de caminata usando ondas seno.
 * @param time Tiempo transcurrido (en milisegundos o segundos)
 * @param isMoving Booleano para saber si está caminando o en reposo
 */
export function getWalkAnimationAngles(time: number, isMoving: boolean) {
  if (!isMoving) {
    // Reposo (Idle): Respiración sutil y brazos relajados
    return {
      torso: Math.sin(time * 2) * 0.02, // Ligera inclinación
      head: Math.sin(time * 2) * 0.01,
      shoulderL: 0.1, shoulderR: -0.1,
      elbowL: 0.1, elbowR: -0.1,
      hipL: 0.05, hipR: -0.05,
      kneeL: 0.05, kneeR: -0.05
    };
  }

  // Caminando: Oscilación cruzada (Brazo izq con Pierna der)
  const speed = time * 8; // Velocidad del paso
  const amp = 0.6; // Amplitud del paso

  return {
    torso: Math.sin(speed * 2) * 0.05, // Rebote del torso
    head: 0,
    shoulderL: Math.sin(speed) * amp,      // Brazo Izq adelante
    shoulderR: -Math.sin(speed) * amp,     // Brazo Der atrás
    elbowL: 0.2 + Math.max(0, -Math.sin(speed)) * 0.4, // Codo se dobla
    elbowR: 0.2 + Math.max(0, Math.sin(speed)) * 0.4,
    hipL: -Math.sin(speed) * amp,          // Pierna Izq atrás
    hipR: Math.sin(speed) * amp,           // Pierna Der adelante
    kneeL: Math.max(0, Math.sin(speed)) * 0.8, // Rodilla se dobla al levantar
    kneeR: Math.max(0, -Math.sin(speed)) * 0.8
  };
}