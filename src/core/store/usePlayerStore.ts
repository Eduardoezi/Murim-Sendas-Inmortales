import { create } from 'zustand';
import { PlayerData, CultivatorAttributes } from '../../types/player.types';

export const DEFAULT_ATTRIBUTES: CultivatorAttributes = {
  fuerza: 10,
  destreza: 10,
  constitucion: 10,
  inteligencia: 10,
  percepcion: 10,
  astucia: 10,
  voluntad: 10,
  suerte: 10,
  carisma: 10,
  sabiduria: 10,
};

export interface PlayerStoreState extends PlayerData {
  // Estado de sesión y control
  playerId: string | null;
  realmName: string;
  cb_actual: number;
  cb_requerido: number;
  eficienciaBase: number;

  // Estados de Meditación
  isMeditating: boolean;
  meditationLocation: 'private' | 'world' | null;

  // Métodos de mutación
  setPlayer: (data: Partial<PlayerStoreState>) => void;
  startMeditation: (location: 'private' | 'world') => void;
  stopMeditation: () => void;
  tickCultivation: () => void;
  resetPlayer: () => void;
}

let cultivationInterval: ReturnType<typeof setInterval> | null = null;

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  id: '',
  playerId: null,
  name: '',
  gender: 'Hombre',
  lineage: 'Común',
  affinity: 'Ortodoxo',
  faction: 'Errante',
  realm: 'Refinamiento de Qi',
  subRealm: 1,
  realmName: 'Refinamiento de Qi (Etapa 1)',
  dantianScale: 'Gota',
  dantianPurity: 100,
  
  hp: 100,
  maxHp: 100,
  qi: 50,
  maxQi: 100,
  spiritStones: 250,
  sectMerits: 0,
  
  attributes: { ...DEFAULT_ATTRIBUTES },
  
  cb_actual: 0,
  cb_requerido: 100,
  eficienciaBase: 5,
  
  isMeditating: false,
  meditationLocation: null,

  setPlayer: (data) => set((state) => ({ ...state, ...data })),

  startMeditation: (location) => {
    set({ isMeditating: true, meditationLocation: location });

    if (cultivationInterval) clearInterval(cultivationInterval);
    
    cultivationInterval = setInterval(() => {
      get().tickCultivation();
    }, 5000);
  },

  stopMeditation: () => {
    if (cultivationInterval) {
      clearInterval(cultivationInterval);
      cultivationInterval = null;
    }
    set({ isMeditating: false, meditationLocation: null });
  },

  tickCultivation: () => {
    const state = get();
    if (!state.isMeditating) return;

    // Fórmula del GDD: QiGanado = 0.5 * (Percepción + Voluntad/2) * Mult_Dantian
    const ganancia = state.eficienciaBase + Math.floor(state.attributes.percepcion / 2);
    
    set((prev) => {
      const nuevoCB = prev.cb_actual + ganancia;
      
      if (prev.meditationLocation === 'world' && Math.random() < 0.10) {
        console.warn("¡Has sido atacado durante tu meditación!");
      }

      return { cb_actual: nuevoCB };
    });
  },

  resetPlayer: () => {
    if (cultivationInterval) clearInterval(cultivationInterval);
    set({
      id: '',
      playerId: null,
      name: '',
      gender: 'Hombre',
      lineage: 'Común',
      affinity: 'Ortodoxo',
      faction: 'Errante',
      realm: 'Refinamiento de Qi',
      subRealm: 1,
      realmName: 'Refinamiento de Qi (Etapa 1)',
      dantianScale: 'Gota',
      dantianPurity: 100,
      hp: 100,
      maxHp: 100,
      qi: 50,
      maxQi: 100,
      spiritStones: 250,
      sectMerits: 0,
      attributes: { ...DEFAULT_ATTRIBUTES },
      cb_actual: 0,
      cb_requerido: 100,
      eficienciaBase: 5,
      isMeditating: false,
      meditationLocation: null
    });
  }
}));
