// En desarrollo VITE_API_URL no existe → rutas /api/... relativas → proxy de Vite las captura.
// En producción VITE_API_URL = 'https://impuestos-vehiculos.onrender.com' → llamadas directas al backend.
const BASE_URL = import.meta.env.VITE_API_URL || '';

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
  InfoCiudadano,
  LoginCiudadanoResponse,
  SolicitudTraspasoResponse,
  SolicitudTraspasoHistorial,
  SolicitudTraspasoAdmin,
  MensajeChat,
  RespuestaChat,
} from '../types';
import { leerToken, obtenerTokenCiudadano } from '../auth/session';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = leerToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let mensaje = 'Error en la petición';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch {
      mensaje = response.statusText || mensaje;
    }
    throw new Error(mensaje);
  }

  return response.json() as Promise<T>;
}

export function consultarVehiculo(placa: string): Promise<VehiculoConVigencias> {
  const placaLimpia = placa.toUpperCase().trim();
  return request<VehiculoConVigencias>(`/api/vehiculos/${placaLimpia}`);
}

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

export async function loginAdmin(usuario: string, password: string): Promise<string> {
  const respuesta = await request<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
  return respuesta.token;
}

export function obtenerStatsAdmin(): Promise<StatsAdmin> {
  return request<StatsAdmin>('/api/admin/stats');
}

export function listarVehiculosAdmin(
  filtros: FiltrosAdmin,
  pagina: number
): Promise<ListaVehiculosAdmin> {
  const params = new URLSearchParams();

  if (filtros.placa.trim()) params.set('placa', filtros.placa.trim());
  if (filtros.marca.trim().length >= 2) params.set('marca', filtros.marca.trim());
  if (filtros.clase) params.set('clase', filtros.clase);
  if (filtros.modelo) params.set('modelo', filtros.modelo);
  if (filtros.tipo_servicio) params.set('tipo_servicio', filtros.tipo_servicio);
  if (filtros.estado_pago) params.set('estado_pago', filtros.estado_pago);
  params.set('pagina', String(pagina));

  return request<ListaVehiculosAdmin>(`/api/admin/vehiculos?${params.toString()}`);
}

export function obtenerDetalleVehiculoAdmin(placa: string): Promise<DetalleVehiculoAdmin> {
  return request<DetalleVehiculoAdmin>(`/api/admin/vehiculos/${placa}`);
}

export function consultarPagoPorReferencia(referencia: string): Promise<ComprobanteConsultado> {
  return request<ComprobanteConsultado>(`/api/pagos/${referencia.trim().toUpperCase()}`);
}

export function obtenerAnioSiguiente(): Promise<{ anio_siguiente: number }> {
  return request<{ anio_siguiente: number }>('/api/admin/vigencias/anio-siguiente');
}

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

// El historial completo viaja en cada turno: Gemini no tiene memoria server-side.
export function enviarMensajeChat(historial: MensajeChat[]): Promise<RespuestaChat> {
  return request<RespuestaChat>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ historial }),
  });
}

// ─── API ciudadano ────────────────────────────────────────────────────────────

// Variante de request() que adjunta el token del ciudadano en vez del del admin.
async function requestCiudadano<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = obtenerTokenCiudadano();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    let mensaje = 'Error en la petición';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch {
      mensaje = response.statusText || mensaje;
    }
    throw new Error(mensaje);
  }
  return response.json() as Promise<T>;
}

// No usa request(): fetch no debe fijar Content-Type con multipart/form-data.
export async function registrarCiudadano(datos: FormData): Promise<InfoCiudadano> {
  const response = await fetch(`${BASE_URL}/api/ciudadanos/registro`, {
    method: 'POST',
    body: datos,
  });
  if (!response.ok) {
    let mensaje = 'Error en el registro';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch { /* sin body */ }
    throw new Error(mensaje);
  }
  return response.json() as Promise<InfoCiudadano>;
}

export function loginCiudadano(email: string, password: string): Promise<LoginCiudadanoResponse> {
  return requestCiudadano<LoginCiudadanoResponse>('/api/ciudadanos/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// No usa requestCiudadano(): con multipart/form-data el navegador debe fijar
// Content-Type con su boundary. Adjunta manualmente el token del ciudadano.
export async function crearSolicitudTraspaso(datos: FormData): Promise<SolicitudTraspasoResponse> {
  const token = obtenerTokenCiudadano();
  const response = await fetch(`${BASE_URL}/api/traspasos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: datos,
  });
  if (!response.ok) {
    let mensaje = 'Error al enviar la solicitud';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch { /* sin body */ }
    // Propaga el status para distinguir 400 / 502 / 503 en la página.
    throw Object.assign(new Error(mensaje), { status: response.status });
  }
  return response.json() as Promise<SolicitudTraspasoResponse>;
}

export function listarMisSolicitudes(): Promise<SolicitudTraspasoHistorial[]> {
  return requestCiudadano<SolicitudTraspasoHistorial[]>('/api/traspasos/mis-solicitudes');
}

// ─── API admin — traspasos ────────────────────────────────────────────────────

export function listarSolicitudesTraspaso(
  estado?: 'pendiente' | 'aprobado' | 'rechazado'
): Promise<SolicitudTraspasoAdmin[]> {
  const url = estado
    ? `/api/admin/solicitudes-traspaso?estado=${estado}`
    : '/api/admin/solicitudes-traspaso';
  return request<SolicitudTraspasoAdmin[]>(url);
}

// No usa request(): necesitamos propagar el status HTTP para distinguir 409 en el modal.
export async function resolverSolicitudAdmin(
  id: number,
  datos: { estado: 'aprobado' | 'rechazado'; admin_notas?: string }
): Promise<void> {
  const token = leerToken();
  const response = await fetch(`${BASE_URL}/api/admin/solicitudes-traspaso/${id}/resolver`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datos),
  });
  if (!response.ok) {
    let mensaje = 'Error al resolver la solicitud';
    try {
      const data = (await response.json()) as ApiError;
      mensaje = data.message ?? data.error ?? mensaje;
    } catch { /* sin body */ }
    throw Object.assign(new Error(mensaje), { status: response.status });
  }
}

// No usa request(): fetch no debe fijar Content-Type con multipart/form-data
// (el navegador lo hace automáticamente con el boundary correcto).
export async function cargarCSVVehiculos(archivo: File): Promise<ResultadoCargaCSV> {
  const token = leerToken();
  const formData = new FormData();
  formData.append('archivo', archivo);

  const response = await fetch(`${BASE_URL}/api/admin/csv/vehiculos`, {
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
