import { api } from './api';

export const acreditadoService = {
  getAll: () =>
    api.get('/api/acreditados'),

  getStats: () =>
    api.get('/api/acreditados/stats'),

  getComparativa: () =>
    api.get('/api/acreditados/comparativa'),

  getCoberturaMunicipios: (departamentoId: number | string) =>
    api.get(`/api/acreditados/cobertura-municipios?departamentoId=${departamentoId}`),

  getCoberturaPuestos: (municipioId: number | string) =>
    api.get(`/api/acreditados/cobertura-puestos?municipioId=${municipioId}`),

  importExcel: (formData: FormData) =>
    api.post('/api/acreditados/import', formData),

  exportCobertura: (departamentoId?: number | string) => {
    const param = departamentoId ? `?departamentoId=${departamentoId}` : '';
    return api.get(`/api/acreditados/export-cobertura${param}`);
  },

  exportAll: () =>
    api.get('/api/acreditados/export'),

  exportTestigosMunicipio: (municipioId: number | string) =>
    api.get(`/api/acreditados/export-testigos-municipio?municipioId=${municipioId}`),

  clear: () =>
    api.delete('/api/acreditados/clear'),
};
