import { api } from './api';

export interface Usuario {
  id?: number;
  nombre: string;
  correo: string;
  password?: string;
  rol: string;
  activo: boolean;
}

export const usuariosService = {
  listar: () => api.get('/api/usuarios'),
  crear: (user: Usuario) => api.post('/api/usuarios', user),
  actualizar: (id: number, user: Usuario) => api.put(`/api/usuarios/${id}`, user),
  eliminar: (id: number) => api.delete(`/api/usuarios/${id}`),
};
