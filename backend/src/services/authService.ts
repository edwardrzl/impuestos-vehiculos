// services/authService.ts
// Lógica de autenticación. No conoce req/res.
//
// El flujo de login tiene un detalle de seguridad importante:
// si el usuario no existe O si la contraseña es incorrecta, lanzamos
// EXACTAMENTE el mismo error con el mismo mensaje. Así un atacante
// no puede saber si adivinó un usuario válido o no.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as adminRepository from '../repositories/adminRepository.js';
import { CredencialesInvalidas } from '../errors.js';
import { JWT_SECRET, JWT_EXPIRACION } from '../config.js';
import type { AdminPayload } from '../types.js';

const MENSAJE_ERROR_GENERICO = 'Credenciales inválidas';

/**
 * Verifica usuario y contraseña. Si son correctos, firma un JWT y lo devuelve.
 * Si cualquiera de los dos es incorrecto, lanza CredencialesInvalidas.
 */
export function login(usuario: string, password: string): string {
  const admin = adminRepository.obtenerPorUsuario(usuario);

  // Si el usuario no existe, aun así llamamos a compareSync con un hash falso.
  // Esto evita un "timing attack": sin esta llamada, la respuesta sería
  // más rápida cuando el usuario no existe (no se hashea nada), revelando
  // indirectamente que ese usuario no está en la base.
  const hashParaComparar = admin?.password_hash ?? '$2a$10$invalido.para.que.no.sea.vacio';
  const passwordValida = bcrypt.compareSync(password, hashParaComparar);

  if (!admin || !passwordValida) {
    throw new CredencialesInvalidas(MENSAJE_ERROR_GENERICO);
  }

  // El payload del JWT contiene id y usuario. Al verificar el token más tarde,
  // podremos saber qué admin hizo la petición sin consultar la base de datos.
  const payload: AdminPayload = { id: admin.id, usuario: admin.usuario };

  // jwt.sign() devuelve el token como string cuando no se le pasa callback.
  // El token tiene tres partes: header.payload.firma — todo codificado en Base64.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRACION });
}
