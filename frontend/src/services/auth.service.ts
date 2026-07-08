import { api } from './api';

export const authService = {
  login: (correo: string, password: string) =>
    api.post('/api/auth/login', { correo, password }),
};
