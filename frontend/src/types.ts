// types.ts - Tipos del frontend.
// Espejan exactamente lo que devuelve el backend.
// Cuando cambies algo en el backend, recuerda actualizar aquí también.

// ─── Asistente IA ─────────────────────────────────────────────────────────────

// Formato de mensaje que espera POST /api/chat (compatible con el SDK de Gemini).
export interface MensajeChat {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface RespuestaChat {
  respuesta: string;
}

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

export interface ResumenVehiculo {
  total_vigencias: number;
  vigencias_pendientes: number;
  total_deuda: number;
  estado_general: 'al_dia' | 'con_deuda';
}

export interface VehiculoConVigencias {
  vehiculo: Vehiculo;
  vigencias: Vigencia[];
  resumen: ResumenVehiculo;
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

// Tipo del error que devuelve nuestro backend
export interface ApiError {
  error: string;
  message?: string;
}

// Tipo normalizado que usa ModalComprobante. Tanto el flujo de pago como el de
// búsqueda por referencia adaptan sus datos a esta forma antes de pasarla al modal.
export interface DatosComprobante {
  referencia: string;
  placa: string;
  propietario: string;
  anios_pagados: number[];
  monto_total: number;
  metodo_pago: string;
  fecha_pago: string;
}

// Lo que devuelve GET /api/pagos/:referencia. Tiene todos los campos de
// DatosComprobante más el id interno del pago.
export interface ComprobanteConsultado extends DatosComprobante {
  id: number;
}

// ─── Tipos del panel de administración ───────────────────────────────────────

export interface StatsAdmin {
  total_vehiculos: number;
  vigencias_pendientes: number;
  vigencias_pagadas: number;
  monto_recaudado: number;
}

export interface ListaVehiculosAdmin {
  vehiculos: Vehiculo[];
  total: number;
  pagina: number;
  por_pagina: number;
}

export interface PagoAdmin {
  id: number;
  referencia: string;
  vigencias_pagadas: string; // JSON string con array de años
  monto_total: number;
  metodo_pago: string;
  fecha_pago: string;
  estado: string;
}

export interface DetalleVehiculoAdmin {
  vehiculo: Vehiculo;
  vigencias: Vigencia[];
  pagos: PagoAdmin[];
}

export interface FiltrosAdmin {
  placa: string;
  marca: string;
  clase: string;
  modelo: string;
  tipo_servicio: string;
  estado_pago: string;
}

// ─── Tipos del portal ciudadano ──────────────────────────────────────────────

export interface InfoCiudadano {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginCiudadanoResponse {
  token: string;
  ciudadano: InfoCiudadano;
}

// ─── Traspasos ────────────────────────────────────────────────────────────────

export type EstadoSolicitudTraspaso = 'PENDIENTE_REVISION_ADMIN' | 'APROBADO' | 'RECHAZADO';

// Cada solicitud en GET /api/traspasos/mis-solicitudes
export interface SolicitudTraspaso {
  id: number;
  ciudadano_id: number;
  placa: string;
  foto_path: string;
  estado: EstadoSolicitudTraspaso;
  comentario_admin: string | null;
  creado_en: string;
  actualizado_en: string;
}

// Respuesta de POST /api/traspasos/solicitar: 201 si se creó, 200 si la IA rechazó.
export type ResultadoSolicitudTraspaso =
  | { aprobada: true; id: number; estado: 'PENDIENTE_REVISION_ADMIN'; mensaje: string }
  | { aprobada: false; razon: string };

// Solicitud enriquecida con datos del ciudadano y el vehículo (vista admin).
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

// Resumen que devuelve POST /api/admin/vigencias/generar-anual
export interface ResultadoGenerarVigencias {
  anio: number;
  total_vehiculos: number;
  creadas: number;
  omitidas: number;
  errores: number;
}

// Resumen que devuelve POST /api/admin/csv/vehiculos
export interface ResultadoCargaCSV {
  insertados: number;
  omitidos: number;
  errores: Array<{ fila: number; placa: string; motivo: string }>;
  advertencias: string[];
}
