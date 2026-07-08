import { api } from './api';

export const coordinatorService = {
  // Manual witnesses
  getTestigosPuesto: (puestoId: number | string) =>
    api.get(`/api/catalogo/puestos/${puestoId}/testigos`),

  assignCoordinator: (puestoId: number | string, testigoId?: number | string) => {
    const param = testigoId ? `?testigoId=${testigoId}` : '';
    return api.put(`/api/catalogo/puestos/${puestoId}/coordinador${param}`);
  },

  // Accredited witnesses (CNE)
  getAcreditadosPuesto: (puestoId: number | string) =>
    api.get(`/api/catalogo/puestos/${puestoId}/acreditados`),

  assignCoordinatorAcreditado: (puestoId: number | string, acreditadoId?: number | string) => {
    const param = acreditadoId ? `?acreditadoId=${acreditadoId}` : '';
    return api.put(`/api/catalogo/puestos/${puestoId}/coordinador-acreditado${param}`);
  },

  // Exports
  exportCoordinadores: (municipioId: number | string) =>
    api.get(`/api/excel/export-coordinadores?municipioId=${municipioId}`),
};
