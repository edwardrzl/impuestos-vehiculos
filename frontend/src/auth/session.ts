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
