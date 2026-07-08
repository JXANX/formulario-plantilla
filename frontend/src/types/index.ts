export interface Testigo {
  id: number;
  documento: string;
  nombre: string;
  segundoNombre?: string | null;
  primerApellido: string;
  segundoApellido?: string | null;
  nombreCompleto: string;
  celular: string;
  correo?: string | null;
  nombreOrganizacion?: string | null;
  tipoTestigo: string;
  fechaRegistro: string;
  mesaId: number;
  numeroMesa: number;
  puestoId: number;
  nombrePuesto: string;
  municipioId: number;
  nombreMunicipio: string;
  departamentoId: number;
  nombreDepartamento: string;
  registradoPor: string;
}

export interface Mesa {
  id: number;
  numeroMesa: number;
  ocupados: number;
  capacidad: number;
  estadoSemaforo?: string;
}

export interface Puesto {
  id: number;
  nombrePuesto: string;
  municipioId: number;
  codigoPuesto?: string;
  zona?: string;
  coordinador?: Testigo | null;
  coordinadorAcreditado?: Testigo | null;
}

export interface Departamento {
  id: number;
  nombre: string;
}

export interface Municipio {
  id: number;
  nombre: string;
  departamentoId: number;
}

export interface CoberturaMunicipio {
  id?: number;
  municipioId?: number;
  municipioNombre: string;
  codigoMunicipio?: string;
  departamentoId?: number;
  departamentoNombre?: string;
  totalMesas: number;
  mesasConTestigo?: number; // for Acreditados
  mesasSinTestigo?: number;  // for Acreditados
  mesasCubiertas?: number;   // for Testigos
  porcentajeCobertura: number;
}

export interface CoberturaPuesto {
  id?: number;
  puestoId?: number;
  puestoNombre: string;
  zona?: string;
  municipioId?: number;
  municipioNombre?: string;
  totalMesas: number;
  mesasTotalmenteCubiertas?: number;
  mesasParcialmenteCubiertas?: number;
  mesasSinTestigo?: number;
  mesasCubiertas?: number; // for Testigos
  porcentajeCobertura: number;
}

export interface AuditEntry {
  id: number;
  action: string;
  details: string;
  username: string;
  timestamp: string;
}

export interface Acreditado {
  id: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  correo: string;
  tipoTestigo: string;
  mesaId: number;
  municipioId: number;
  nombrePuesto: string;
  numeroMesa: number;
  nombreMunicipio: string;
}

export interface ComparativaTestigo {
  idTestigo: number;
  documento: string;
  nombreCompleto: string;
  celular: string;
  correo: string;
  mesaId: number;
  numeroMesa: number;
  puestoId: number;
  nombrePuesto: string;
  municipioId: number;
  nombreMunicipio: string;
  fueAcreditado: boolean;
}
