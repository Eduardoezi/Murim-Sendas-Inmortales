import { create } from 'zustand';

interface PlayerState {
  playerId: string | null;
  name: string;
  realm: string;
  qi: number;
  maxQi: number;
  spiritStones: number;
  setPlayer: (data: Partial<PlayerState>) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  playerId: null,
  name: '',
  realm: 'Refinamiento de Qi',
  qi: 50,
  maxQi: 100,
  spiritStones: 250,
  setPlayer: (data) => set((state) => ({ ...state, ...data })),
  resetPlayer: () => set({ playerId: null, name: '', realm: 'Refinamiento de Qi', qi: 50, maxQi: 100, spiritStones: 250 }),
}));