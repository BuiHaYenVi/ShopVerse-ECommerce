import { create } from 'zustand';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  address?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (data: { user: User; tokens: { accessToken: string; refreshToken: string } }) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,

  initAuth: () => {
    try {
      const storedToken = localStorage.getItem('shopverse_access_token');
      const storedRefreshToken = localStorage.getItem('shopverse_refresh_token');
      const storedUser = localStorage.getItem('shopverse_user');

      if (storedToken && storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        set({
          user: parsedUser,
          accessToken: storedToken,
          refreshToken: storedRefreshToken,
          isAuthenticated: true,
          isAdmin: parsedUser.role === 'ADMIN',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: ({ user, tokens }) => {
    localStorage.setItem('shopverse_access_token', tokens.accessToken);
    localStorage.setItem('shopverse_refresh_token', tokens.refreshToken);
    localStorage.setItem('shopverse_user', JSON.stringify(user));

    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
    });
  },

  logout: async () => {
    try {
      if (get().accessToken) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('shopverse_access_token');
      localStorage.removeItem('shopverse_refresh_token');
      localStorage.removeItem('shopverse_user');

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  },

  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedFields };
    localStorage.setItem('shopverse_user', JSON.stringify(newUser));
    set({ user: newUser });
  },
}));
