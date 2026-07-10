import { api } from './api';

export interface UserSession {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  token: string;
}

export const authService = {
  login: (correo: string, password: string) =>
    api.post('/api/auth/login', { correo, password }),

  getCurrentUser: (): UserSession | null => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getUserRol: (): string | null => {
    const user = authService.getCurrentUser();
    return user ? user.rol : null;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

