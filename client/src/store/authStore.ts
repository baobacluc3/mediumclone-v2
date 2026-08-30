import { create } from 'zustand';
import type { UserData } from '../types';

type State = { token: string | null; user: UserData | null; setAuth: (u: UserData) => void; logout: () => void };
export const useAuthStore = create<State>((set) => ({
  token: localStorage.getItem('token'), user: null,
  setAuth: (u) => { localStorage.setItem('token', u.token); set({ token: u.token, user: u }); },
  logout: () => { localStorage.removeItem('token'); set({ token: null, user: null }); },
}));
