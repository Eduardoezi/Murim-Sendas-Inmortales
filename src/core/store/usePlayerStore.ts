import { create } from 'zustand';
import { PlayerData, CultivatorAttributes, PlayerAppearance } from '../../types/player.types';

// 1. Atributos por defecto (Basados en el GDD)
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

// 2. Apariencia por defecto (Extraída directamente de CharacterCustomizer.tsx)
export const DEFAULT_APPEARANCE: PlayerAppearance = {
  skinTone: '#f5d0a9',
  hairStyle: 0,
  hairColor: '#1a1a1a',
  eyeType: 0,
  eyeColor: '#4a2511',
  eyebrowType: 0,
  mouthType: 0,
  noseType: 0,
  outfitColor: '#2d4a22',
  accessoryType: 0,
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

// Referencia al intervalo fuera del estado para evitar re-renders innecesarios
let cultivationInterval: ReturnType<typeof setInterval> | null = null;

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  // --- ESTADO INICIAL ---
  id: '',
  playerId: null,
  name: '',
  gender: 'Hombre',
  birthdate: '', // Añadido para coincidir con CreationPage
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
  appearance: { ...DEFAULT_APPEARANCE }, // <-- Solucionado con la estructura real
  
  cb_actual: 0,
  cb_requerido: 100,
  eficienciaBase: 5,
  
  isMeditating: false,
  meditationLocation: null,

  // --- MÉTODOS ---

  setPlayer: (data) => set((state) => ({ ...state, ...data })),

  startMeditation: (location) => {
    // Evitar iniciar si ya está meditando
    if (get().isMeditating) return;

    set({ isMeditating: true, meditationLocation: location });

    // Limpieza preventiva
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

    // Fórmula del GDD: QiGanado = EficienciaBase + (Percepción / 2)
    const ganancia = state.eficienciaBase + Math.floor(state.attributes.percepcion / 2);
    
    set((prev) => {
      const nuevoCB = prev.cb_actual + ganancia;
      
      // Evento de peligro al meditar en el mundo abierto
      if (prev.meditationLocation === 'world' && Math.random() < 0.10) {
        console.warn("¡Has sido atacado durante tu meditación!");
        // TODO: EventBus.emit('combat:start', { surprise: true })
      }

      return { cb_actual: nuevoCB };
    });
  },

  resetPlayer: () => {
    // 1. Detener el reloj de cultivo si está activo
    if (cultivationInterval) {
      clearInterval(cultivationInterval);
      cultivationInterval = null;
    }

    // 2. Restablecer todo el estado a sus valores iniciales
    set({
      id: '',
      playerId: null,
      name: '',
      gender: 'Hombre',
      birthdate: '',
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
      appearance: { ...DEFAULT_APPEARANCE }, // Restablecer apariencia
      cb_actual: 0,
      cb_requerido: 100,
      eficienciaBase: 5,
      isMeditating: false,
      meditationLocation: null
    });
  }
}));