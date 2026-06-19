const TOKEN_KEY = 'prisma_admin_token';

export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function leerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function borrarToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaAutenticado(): boolean {
  return leerToken() !== null;
}

// ─── Sesión del ciudadano ────────────────────────────────────────────────────
// Usa sessionStorage (no localStorage) para que la sesión no persista entre
// pestañas ni tras cerrar el navegador, a diferencia de la sesión de admin.

const CIUDADANO_TOKEN_KEY = 'ciudadano_token';
const CIUDADANO_INFO_KEY  = 'ciudadano_info';

interface InfoCiudadano {
  id: number;
  nombre: string;
  email: string;
}

export function guardarSesionCiudadano(token: string, ciudadano: InfoCiudadano): void {
  sessionStorage.setItem(CIUDADANO_TOKEN_KEY, token);
  sessionStorage.setItem(CIUDADANO_INFO_KEY, JSON.stringify(ciudadano));
}

export function obtenerTokenCiudadano(): string | null {
  return sessionStorage.getItem(CIUDADANO_TOKEN_KEY);
}

export function obtenerCiudadano(): InfoCiudadano | null {
  const raw = sessionStorage.getItem(CIUDADANO_INFO_KEY);
  return raw ? (JSON.parse(raw) as InfoCiudadano) : null;
}

export function cerrarSesionCiudadano(): void {
  sessionStorage.removeItem(CIUDADANO_TOKEN_KEY);
  sessionStorage.removeItem(CIUDADANO_INFO_KEY);
}

export function estaAutenticadoCiudadano(): boolean {
  return obtenerTokenCiudadano() !== null;
}
