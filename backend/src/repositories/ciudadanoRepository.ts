import db from '../db.js';

const insertarCiudadano = db.prepare(`
  INSERT INTO ciudadanos (nombre, documento, email, password_hash, foto_documento_path, creado_en)
  VALUES (@nombre, @documento, @email, @password_hash, @foto_documento_path, @creado_en)
`);

const buscarPorEmailStmt = db.prepare(
  'SELECT id, nombre, documento, email, password_hash, foto_documento_path, creado_en FROM ciudadanos WHERE email = ?'
);

const buscarPorIdStmt = db.prepare(
  'SELECT id, nombre, documento, email, foto_documento_path, creado_en FROM ciudadanos WHERE id = ?'
);

export function crearCiudadano(datos: {
  nombre: string;
  documento: string;
  email: string;
  password_hash: string;
  foto_documento_path: string | null;
}): number {
  const resultado = insertarCiudadano.run({ ...datos, creado_en: new Date().toISOString() });
  return resultado.lastInsertRowid as number;
}

export function buscarPorEmail(email: string): {
  id: number;
  nombre: string;
  documento: string;
  email: string;
  password_hash: string;
  foto_documento_path: string | null;
  creado_en: string;
} | undefined {
  return buscarPorEmailStmt.get(email) as ReturnType<typeof buscarPorEmail>;
}

export function buscarPorId(id: number): {
  id: number;
  nombre: string;
  documento: string;
  email: string;
  foto_documento_path: string | null;
  creado_en: string;
} | undefined {
  return buscarPorIdStmt.get(id) as ReturnType<typeof buscarPorId>;
}
