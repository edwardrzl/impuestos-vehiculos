// types.ts - Tipos e interfaces que se usan en todo el backend.
// Tener estos tipos centralizados evita repetirlos en cada archivo
// y garantiza consistencia: si cambia la estructura de datos,
// cambias en un solo lugar.

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

// Tipos para las respuestas de la API (lo que el frontend recibe)
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

// Fila de la tabla admins tal como la devuelve SQLite.
export interface Admin {
  id: number;
  usuario: string;
  password_hash: string;
}

// Datos del admin que viajan DENTRO del JWT (payload).
// NO incluimos password_hash aquí por razones de seguridad.
export interface AdminPayload {
  id: number;
  usuario: string;
}

// ─── Tipos para el panel de administración ───────────────────────────────────

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

// Resultado que devuelve el service de importación CSV al controller.
export interface ResultadoCargaCSV {
  insertados: number;
  omitidos: number;
  errores: Array<{ fila: number; placa: string; motivo: string }>;
  advertencias: string[];
}

// Resultado de POST /api/admin/vigencias/generar-anual
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
