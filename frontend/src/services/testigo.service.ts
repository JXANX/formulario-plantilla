import { api } from './api';

export const testigoService = {
  getTestigos: () => 
    api.get('/api/testigos'),
  
  getByDocumento: (documento: string) => 
    api.get(`/api/testigos/documento/${documento}`),
  
  createTestigo: (body: any) => 
    api.post('/api/testigos', body),
  
  updateTestigo: (id: number | string, body: any) => 
    api.put(`/api/testigos/${id}`, body),
  
  deleteTestigo: (id: number | string) => 
    api.delete(`/api/testigos/${id}`),
  
  moveTestigo: (id: number | string, nuevaMesaId: number | string) => 
    api.put(`/api/testigos/${id}/mover?nuevaMesaId=${nuevaMesaId}`),

  getDistribucionMunicipio: (municipioId: number | string) =>
    api.get(`/api/distribucion/municipio/${municipioId}`),
};
