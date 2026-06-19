import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as ciudadanoRepository from '../repositories/ciudadanoRepository.js';
import { ConflictoRecurso, CredencialesInvalidas } from '../errors.js';
import { JWT_SECRET, JWT_EXPIRACION } from '../config.js';
import type { CiudadanoPayload } from '../types.js';

const MENSAJE_ERROR_GENERICO = 'Credenciales inválidas';

export function registrar(datos: {
  nombre: string;
  documento: string;
  email: string;
  password: string;
  foto_documento_path: string | null;
}): { id: number; nombre: string; email: string } {
  const password_hash = bcrypt.hashSync(datos.password, 10);

  try {
    const id = ciudadanoRepository.crearCiudadano({
      nombre: datos.nombre,
      documento: datos.documento,
      email: datos.email,
      password_hash,
      foto_documento_path: datos.foto_documento_path,
    });
    return { id, nombre: datos.nombre, email: datos.email };
  } catch (error) {
    // SQLite lanza "UNIQUE constraint failed: ciudadanos.<columna>" cuando hay duplicado.
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('.email')) throw new ConflictoRecurso('El email ya está registrado');
      if (error.message.includes('.documento')) throw new ConflictoRecurso('El documento ya está registrado');
      throw new ConflictoRecurso('El ciudadano ya está registrado');
    }
    throw error;
  }
}

export function login(datos: {
  email: string;
  password: string;
}): { token: string; ciudadano: { id: number; nombre: string; email: string } } {
  const ciudadano = ciudadanoRepository.buscarPorEmail(datos.email);

  // Siempre ejecutamos compareSync aunque el email no exista: evita timing attacks
  // donde una respuesta más rápida revelaría que el email no está en la BD.
  const hashParaComparar = ciudadano?.password_hash ?? '$2a$10$invalido.para.que.no.sea.vacio';
  const passwordValida = bcrypt.compareSync(datos.password, hashParaComparar);

  if (!ciudadano || !passwordValida) {
    throw new CredencialesInvalidas(MENSAJE_ERROR_GENERICO);
  }

  const payload: CiudadanoPayload = { id: ciudadano.id, rol: 'ciudadano' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRACION });

  return {
    token,
    ciudadano: { id: ciudadano.id, nombre: ciudadano.nombre, email: ciudadano.email },
  };
}
