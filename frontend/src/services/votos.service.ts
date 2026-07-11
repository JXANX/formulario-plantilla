import { api } from './api';

export interface VotoRenglon {
  candidatoId?: number | null;
  candidatoNombre?: string | null;
  candidatoPartido?: string | null;
  candidatoNumeroTarjeton?: number | null;
  
  tipoVotoId: number;
  tipoVotoCodigo: string;
  tipoVotoNombre: string;

  votosRegistraduria: number;
  votosTestigo: number;
  diferencia: number;
}

export interface FotoE14DTO {
  id: number;
  origen: string;
  fechaSubida: string;
  subidoPorNombre: string;
}

export interface VotosDetalleMesa {
  mesaId: number;
  numeroMesa: number;
  puestoNombre: string;
  municipioNombre: string;
  testigoId?: number | null;
  testigoNombre?: string | null;
  testigoCelular?: string | null;
  testigoDocumento?: string | null;

  renglones: VotoRenglon[];
  fotos: FotoE14DTO[];
}

export interface ResumenMunicipio {
  municipioId: number;
  municipioNombre: string;
  totalMesas: number;
  reportadasRegistraduria: number;
  reportadasTestigo: number;
  conDiscrepancias: number;
  porcentajeAvance: number;
}

export interface ResumenOperario {
  operarioId: number;
  operarioNombre: string;
  mesasAsignadas: number;
  reportadasRegistraduria: number;
  reportadasTestigo: number;
  conDiscrepancias: number;
}

export interface VotosResumen {
  totalMesas: number;
  mesasReportadasRegistraduria: number;
  mesasReportadasTestigo: number;
  mesasConDiscrepancias: number;
  totalDiscrepanciasActivas: number;
  totalVotosRegistraduria: number;
  totalVotosTestigo: number;
  municipios: ResumenMunicipio[];
  operarios: ResumenOperario[];
}

export const votosService = {
  obtenerAsignacionesOperario: (operarioId: number) => 
    api.get(`/api/asignaciones/operario/${operarioId}`),

  obtenerDetalleMesa: (mesaId: number) => 
    api.get(`/api/votos/mesa/${mesaId}/detalle`),

  registrarVotosRegistraduria: (mesaId: number, candidatoId: number | null, tipoVotoId: number, votos: number) => {
    const candParam = candidatoId ? `&candidatoId=${candidatoId}` : '';
    return api.post(`/api/votos/registraduria?mesaId=${mesaId}${candParam}&tipoVotoId=${tipoVotoId}&votos=${votos}`);
  },

  registrarVotosTestigo: (mesaId: number, candidatoId: number | null, tipoVotoId: number, votos: number, testigoId?: number | null) => {
    const candParam = candidatoId ? `&candidatoId=${candidatoId}` : '';
    const testParam = testigoId ? `&testigoId=${testigoId}` : '';
    return api.post(`/api/votos/testigo?mesaId=${mesaId}${candParam}&tipoVotoId=${tipoVotoId}&votos=${votos}${testParam}`);
  },

  subirFotoE14: (mesaId: number, origen: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mesaId', String(mesaId));
    formData.append('origen', origen);
    return api.post('/api/votos/fotos/subir', formData);
  },

  obtenerDiscrepancias: () => 
    api.get('/api/votos/discrepancias'),

  obtenerResumen: () => 
    api.get('/api/votos/resumen'),

  autoBalancear: () => 
    api.post('/api/asignaciones/auto-balance'),

  limpiarAsignaciones: () => 
    api.delete('/api/asignaciones/limpiar'),

  crearAsignacion: (operarioId: number, mesaId: number) => 
    api.post(`/api/asignaciones?operarioId=${operarioId}&mesaId=${mesaId}`),

  obtenerTodasAsignaciones: () => 
    api.get('/api/asignaciones'),

  eliminarAsignacion: (id: number) => 
    api.delete(`/api/asignaciones/${id}`),
};
