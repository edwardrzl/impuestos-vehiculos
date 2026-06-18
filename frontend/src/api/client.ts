// api/client.ts - Capa centralizada de comunicación con el backend.
// Toda llamada a la API pasa por aquí. Esto tiene varias ventajas:
//   1. La URL base está en UN solo lugar (gracias al proxy de Vite, basta con /api).
//   2. Los errores se manejan de forma consistente.
//   3. Los tipos de retorno son explícitos, ayudando al editor a autocompletar.
//   4. El header Authorization se agrega automáticamente cuando hay sesión activa.

import type {
  VehiculoConVigencias,
  ComprobantePago,
  ComprobanteConsultado,
  ApiError,
  StatsAdmin,
  ListaVehiculosAdmin,
  DetalleVehiculoAdmin,
  FiltrosAdmin,
  ResultadoCargaCSV,
  ResultadoGenerarVigencias,
} from '../types';
import { leerToken } from '../auth/session';

// Wrapper alrededor de fetch que:
//   - Agrega el header Authorization si hay token guardado.
//   - Parsea la respuesta como JSON.
//   - Si el status no es OK, lanza un Error con el mensaje del backend.
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = leerToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Si hay un token activo, lo adjuntamos en cada petición.
    // El backend lo verifica en las rutas protegidas (authMiddleware).
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si hubo error, leemos el mensaje del backend y lo propagamos
  if (!response.ok) {
    let mensaje = 'Error en la petición';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch {
      // El backend no devolvió JSON, usamos el statusText
      mensaje = response.statusText || mensaje;
    }
    throw new Error(mensaje);
  }

  return response.json() as Promise<T>;
}

/**
 * Consulta un vehículo por su placa.
 * Devuelve el vehículo, sus vigencias y un resumen.
 */
export function consultarVehiculo(placa: string): Promise<VehiculoConVigencias> {
  const placaLimpia = placa.toUpperCase().trim();
  return request<VehiculoConVigencias>(`/api/vehiculos/${placaLimpia}`);
}

/**
 * Procesa el pago de una o varias vigencias.
 */
export function procesarPago(params: {
  placa: string;
  vigenciasIds: number[];
  metodoPago: string;
}): Promise<ComprobantePago> {
  return request<ComprobantePago>('/api/pagos', {
    method: 'POST',
    body: JSON.stringify({
      placa: params.placa,
      vigencias_ids: params.vigenciasIds,
      metodo_pago: params.metodoPago,
    }),
  });
}

/**
 * Inicia sesión con usuario y contraseña de administrador.
 * Devuelve el token JWT que debe guardarse con guardarToken().
 */
export async function loginAdmin(usuario: string, password: string): Promise<string> {
  const respuesta = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
  return respuesta.token;
}

/** Devuelve los contadores globales del panel de administración. */
export function obtenerStatsAdmin(): Promise<StatsAdmin> {
  return request<StatsAdmin>('/api/admin/stats');
}

/**
 * Lista vehículos con filtros opcionales y paginación.
 * Solo envía los filtros que tienen valor (marca >= 2 chars, otros no vacíos).
 */
export function listarVehiculosAdmin(
  filtros: FiltrosAdmin,
  pagina: number
): Promise<ListaVehiculosAdmin> {
  const params = new URLSearchParams();

  // Placa: cualquier fragmento no vacío activa el filtro.
  if (filtros.placa.trim()) params.set('placa', filtros.placa.trim());
  // Marca: solo si tiene al menos 2 caracteres (lo mismo que valida el backend).
  if (filtros.marca.trim().length >= 2) params.set('marca', filtros.marca.trim());
  if (filtros.clase) params.set('clase', filtros.clase);
  if (filtros.modelo) params.set('modelo', filtros.modelo);
  if (filtros.tipo_servicio) params.set('tipo_servicio', filtros.tipo_servicio);
  if (filtros.estado_pago) params.set('estado_pago', filtros.estado_pago);
  params.set('pagina', String(pagina));

  return request<ListaVehiculosAdmin>(`/api/admin/vehiculos?${params.toString()}`);
}

/** Devuelve el detalle completo de un vehículo: datos, vigencias y pagos. */
export function obtenerDetalleVehiculoAdmin(placa: string): Promise<DetalleVehiculoAdmin> {
  return request<DetalleVehiculoAdmin>(`/api/admin/vehiculos/${placa}`);
}

/** Consulta un comprobante de pago ya registrado por su referencia. */
export function consultarPagoPorReferencia(referencia: string): Promise<ComprobanteConsultado> {
  return request<ComprobanteConsultado>(`/api/pagos/${referencia.trim().toUpperCase()}`);
}

/** Devuelve el año siguiente al último con vigencias registradas (mínimo 2027). */
export function obtenerAnioSiguiente(): Promise<{ anio_siguiente: number }> {
  return request<{ anio_siguiente: number }>('/api/admin/vigencias/anio-siguiente');
}

/** Genera vigencias anuales para todos los vehículos registrados. */
export function generarVigenciasAnuales(params: {
  anio: number;
  tasa_pct: number;
  descuento_pct: number;
  fecha_vencimiento: string;
}): Promise<ResultadoGenerarVigencias> {
  return request<ResultadoGenerarVigencias>('/api/admin/vigencias/generar-anual', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Sube un archivo CSV al endpoint de carga masiva de vehículos.
 * No usa request() porque fetch no debe fijar Content-Type con multipart/form-data
 * (el navegador lo hace automáticamente con el boundary correcto).
 */
export async function cargarCSVVehiculos(archivo: File): Promise<ResultadoCargaCSV> {
  const token = leerToken();
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await fetch('/api/admin/csv/vehiculos', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    let mensaje = 'Error al cargar el archivo';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch { /* sin body JSON */ }
    throw new Error(mensaje);
  }

  return response.json() as Promise<ResultadoCargaCSV>;
}
