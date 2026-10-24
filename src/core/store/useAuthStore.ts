import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userEmail: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('murim_token'),
  userEmail: localStorage.getItem('murim_email'),
  login: (token, email) => {
    localStorage.setItem('murim_token', token);
    localStorage.setItem('murim_email', email);
    set({ token, userEmail: email });
  },
  logout: () => {
    localStorage.removeItem('murim_token');
    localStorage.removeItem('murim_email');
    set({ token: null, userEmail: null });
  },
}));