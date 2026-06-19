import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as adminRepository from '../repositories/adminRepository.js';
import { CredencialesInvalidas } from '../errors.js';
import { JWT_SECRET, JWT_EXPIRACION } from '../config.js';
import type { AdminPayload } from '../types.js';

const MENSAJE_ERROR_GENERICO = 'Credenciales inválidas';

export function login(usuario: string, password: string): string {
  const admin = adminRepository.obtenerPorUsuario(usuario);

  // Siempre ejecutamos compareSync aunque el usuario no exista: evita timing attacks
  // donde una respuesta más rápida revelaría que el usuario no está en la BD.
  const hashParaComparar = admin?.password_hash ?? '$2a$10$invalido.para.que.no.sea.vacio';
  const passwordValida = bcrypt.compareSync(password, hashParaComparar);

  if (!admin || !passwordValida) {
    throw new CredencialesInvalidas(MENSAJE_ERROR_GENERICO);
  }

  const payload: AdminPayload = { id: admin.id, usuario: admin.usuario };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRACION });
}
