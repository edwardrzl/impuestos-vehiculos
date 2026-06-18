// repositories/adminRepository.ts
// Acceso a SQLite para la tabla admins. Solo SQL, sin lógica de negocio.

import db from '../db.js';
import type { Admin } from '../types.js';

const buscarAdminPorUsuario = db.prepare(
  'SELECT id, usuario, password_hash FROM admins WHERE usuario = ?'
);

/** Busca un admin por su nombre de usuario. Devuelve undefined si no existe. */
export function obtenerPorUsuario(usuario: string): Admin | undefined {
  return buscarAdminPorUsuario.get(usuario) as Admin | undefined;
}
