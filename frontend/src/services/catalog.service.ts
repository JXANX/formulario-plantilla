import { api } from './api';

export const catalogService = {
  getDepartamentos: () => 
    api.get('/api/catalogo/departamentos'),
  
  getMunicipios: (departamentoId: number | string) => 
    api.get(`/api/catalogo/departamentos/${departamentoId}/municipios`),
  
  getPuestos: (municipioId: number | string) => 
    api.get(`/api/catalogo/municipios/${municipioId}/puestos`),
  
  getMesas: (puestoId: number | string) => 
    api.get(`/api/catalogo/puestos/${puestoId}/mesas`),
};
