export interface Vehiculo {
  placa: string;
  clase: string;
  marca: string;
  linea: string;
  modelo: number;
  tipo_servicio: string;
  capacidad: string;
  avaluo: number;
  propietario: string;
  documento_propietario: string;
}

export type EstadoVigencia = 'pagado' | 'pendiente';

export interface Vigencia {
  id: number;
  placa: string;
  anio: number;
  valor: number;
  descuento: number;
  estado: EstadoVigencia;
  fecha_pago: string | null;
  fecha_vencimiento: string | null;
}

export interface Pago {
  id: number;
  referencia: string;
  placa: string;
  vigencias_pagadas: string; // JSON string en BD
  monto_total: number;
  metodo_pago: string;
  fecha_pago: string;
  estado: string;
}

export interface VehiculoConVigencias {
  vehiculo: Vehiculo;
  vigencias: Vigencia[];
  resumen: {
    total_vigencias: number;
    vigencias_pendientes: number;
    total_deuda: number;
    estado_general: 'al_dia' | 'con_deuda';
  };
}

export interface Admin {
  id: number;
  usuario: string;
  password_hash: string;
}

// password_hash se excluye del payload JWT intencionalmente.
export interface AdminPayload {
  id: number;
  usuario: string;
}

export interface Ciudadano {
  id: number;
  nombre: string;
  documento: string;
  email: string;
  foto_documento_path: string | null;
  creado_en: string;
}

export interface CiudadanoPayload {
  id: number;
  rol: 'ciudadano';
}

export type EstadoSolicitud = 'pendiente' | 'aprobado' | 'rechazado';

// Lo que Claude Vision devuelve tras analizar la tarjeta de propiedad.
export interface ResultadoIA {
  es_tarjeta_propiedad: boolean;
  placa_extraida: string | null;
  documento_extraido: string | null;
  confianza: 'alta' | 'media' | 'baja';
  observaciones: string;
}

export interface SolicitudTraspaso {
  id: number;
  placa: string;
  ciudadano_id: number;
  foto_tarjeta_path: string;
  estado: EstadoSolicitud;
  resultado_ia: string | null; // JSON serializado de ResultadoIA
  validacion_db: number;       // 0 | 1 (SQLite no tiene boolean nativo)
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  admin_notas: string | null;
}

export interface FiltrosVehiculos {
  placa?: string;
  marca?: string;
  clase?: string;
  modelo?: number;
  tipo_servicio?: string;
  estado_pago?: 'pendiente' | 'al_dia';
}

export interface VehiculosAdminPaginados {
  vehiculos: Vehiculo[];
  total: number;
  pagina: number;
  por_pagina: number;
}

export interface VehiculoDetalleAdmin {
  vehiculo: Vehiculo;
  vigencias: Vigencia[];
  pagos: Pago[];
}

export interface StatsAdmin {
  total_vehiculos: number;
  vigencias_pendientes: number;
  vigencias_pagadas: number;
  monto_recaudado: number;
}

// Solicitud con datos del ciudadano y del vehículo, resultado del JOIN admin.
export interface SolicitudTraspasoAdmin extends SolicitudTraspaso {
  ciudadano_nombre: string;
  ciudadano_email: string;
  ciudadano_documento: string;
  vehiculo_marca: string | null;
  vehiculo_linea: string | null;
  vehiculo_modelo: number | null;
  vehiculo_propietario: string | null;
  vehiculo_documento_propietario: string | null;
}

export interface ResultadoCargaCSV {
  insertados: number;
  omitidos: number;
  errores: Array<{ fila: number; placa: string; motivo: string }>;
  advertencias: string[];
}

export interface ResultadoGenerarVigencias {
  anio: number;
  total_vehiculos: number;
  creadas: number;
  omitidas: number;
  errores: number;
}

export interface ComprobantePago {
  id: number;
  referencia: string;
  placa: string;
  propietario: string;
  vigencias: Array<{ anio: number; valor: number }>;
  monto_total: number;
  metodo_pago: string;
  fecha_pago: string;
}
