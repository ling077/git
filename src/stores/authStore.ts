import { create } from 'zustand';
import { apiPost } from '@/utils/api';

export interface User {
  id: number;
  username: string;
  email: string;
  preferred_languages: string[];
  consecutive_days: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, languages: string[]) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  isLoggedIn: !!localStorage.getItem('token'),

  login: async (email, password) => {
    const res = await apiPost<{ success: boolean; token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    set({ token: res.token, user: res.user, isLoggedIn: true });
  },

  register: async (username, email, password, languages) => {
    const res = await apiPost<{ success: boolean; token: string; user: User }>('/auth/register', {
      username,
      email,
      password,
      languages,
    });
    localStorage.setItem('token', res.token);
    set({ token: res.token, user: res.user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isLoggedIn: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token, isLoggedIn: true });
    } else {
      set({ token: null, user: null, isLoggedIn: false });
    }
  },
}));

export const useAuth = useAuthStore;