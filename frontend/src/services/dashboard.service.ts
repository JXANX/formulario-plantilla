import { api } from './api';

export const dashboardService = {
  getStats: () => 
    api.get('/api/dashboard/stats'),
  
  exportExcel: () => 
    api.get('/api/excel/export'),
    
  importExcel: (formData: FormData) => 
    api.post('/api/excel/import', formData),

  getCoberturaMunicipios: (departamentoId?: number | string) => {
    const param = departamentoId ? `?departamentoId=${departamentoId}` : '';
    return api.get(`/api/dashboard/cobertura-municipios${param}`);
  },

  getCoberturaPuestos: (municipioId?: number | string) => {
    const param = municipioId ? `?municipioId=${municipioId}` : '';
    return api.get(`/api/dashboard/cobertura-puestos${param}`);
  },

  exportCobertura: (departamentoId?: number | string) => {
    const param = departamentoId ? `?departamentoId=${departamentoId}` : '';
    return api.get(`/api/excel/export-cobertura${param}`);
  },

  exportTestigosMunicipio: (municipioId: number | string) =>
    api.get(`/api/excel/export-testigos-municipio?municipioId=${municipioId}`),
};
