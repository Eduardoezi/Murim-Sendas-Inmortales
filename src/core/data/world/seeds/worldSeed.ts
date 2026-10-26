export interface WorldSeedConfig {
  rootHash: string;
  version: string;
  epoch: string;
  worldName: string;
  gridSize: {
    width: number;
    height: number;
  };
  globalModifiers: {
    qiDensity: number;
    chaosFactor: number;
  };
}

export const WORLD_SEED: WorldSeedConfig = {
  rootHash: 'MURIM_2027_IMPERIAL_CENTRAL',
  version: '1.0.0-alpha',
  epoch: 'Era de la Guerra de las Cien Sectas',
  worldName: 'Jianghu Central - Tierras Inmortales',
  gridSize: {
    width: 1000, // Coordenadas lógicas globales del mapa
    height: 1000
  },
  globalModifiers: {
    qiDensity: 1.25,      // Densidad base de energía espiritual en el mundo
    chaosFactor: 0.45     // Factor de imprevisibilidad para eventos y encuentros
  }
};