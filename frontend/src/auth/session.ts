// auth/session.ts - Gestión del token de sesión en localStorage.
//
// localStorage es una API del navegador que persiste datos entre recargas de página.
// Centralizamos aquí toda la lógica de lectura/escritura del token para que el
// resto de la app no tenga que saber cómo ni dónde se guarda.

const TOKEN_KEY = 'prisma_admin_token';

/** Guarda el token en localStorage. Se llama después de un login exitoso. */
export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Lee el token guardado. Devuelve null si no hay sesión activa. */
export function leerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Elimina el token. Se llama al cerrar sesión. */
export function borrarToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** True si hay un token guardado (sesión activa). */
export function estaAutenticado(): boolean {
  return leerToken() !== null;
}
