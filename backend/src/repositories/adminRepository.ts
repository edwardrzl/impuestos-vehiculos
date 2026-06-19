import db from '../db.js';
import type { Admin } from '../types.js';

const buscarAdminPorUsuario = db.prepare(
  'SELECT id, usuario, password_hash FROM admins WHERE usuario = ?'
);

export function obtenerPorUsuario(usuario: string): Admin | undefined {
  return buscarAdminPorUsuario.get(usuario) as Admin | undefined;
}
