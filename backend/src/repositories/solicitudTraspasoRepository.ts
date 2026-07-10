import db from '../db.js';
import type { SolicitudTraspaso, SolicitudTraspasoAdmin, EstadoSolicitudTraspaso } from '../types.js';

const insertarStmt = db.prepare(`
  INSERT INTO solicitudes_traspaso
    (ciudadano_id, placa, foto_path, estado, creado_en, actualizado_en)
  VALUES (@ciudadano_id, @placa, @foto_path, 'PENDIENTE_REVISION_ADMIN', @ahora, @ahora)
`);

const listarPorCiudadanoStmt = db.prepare(`
  SELECT * FROM solicitudes_traspaso
  WHERE ciudadano_id = ?
  ORDER BY creado_en DESC
`);

export function crearSolicitud(datos: {
  ciudadano_id: number;
  placa: string;
  foto_path: string;
}): number {
  const resultado = insertarStmt.run({ ...datos, ahora: new Date().toISOString() });
  return Number(resultado.lastInsertRowid);
}

export function listarPorCiudadano(ciudadano_id: number): SolicitudTraspaso[] {
  return listarPorCiudadanoStmt.all(ciudadano_id) as SolicitudTraspaso[];
}

// ─── Queries para el panel de administración ──────────────────────────────────

const buscarPorIdStmt = db.prepare('SELECT * FROM solicitudes_traspaso WHERE id = ?');

const COLUMNAS_ADMIN = `
  st.*,
  c.nombre    AS ciudadano_nombre,
  c.email     AS ciudadano_email,
  c.documento AS ciudadano_documento,
  v.marca     AS vehiculo_marca,
  v.linea     AS vehiculo_linea,
  v.modelo    AS vehiculo_modelo,
  v.propietario           AS vehiculo_propietario,
  v.documento_propietario AS vehiculo_documento_propietario
`;

const listarTodasAdminStmt = db.prepare(`
  SELECT ${COLUMNAS_ADMIN}
  FROM solicitudes_traspaso st
  JOIN ciudadanos c ON st.ciudadano_id = c.id
  LEFT JOIN vehiculos v ON st.placa = v.placa
  ORDER BY st.creado_en DESC
`);

const listarPorEstadoAdminStmt = db.prepare(`
  SELECT ${COLUMNAS_ADMIN}
  FROM solicitudes_traspaso st
  JOIN ciudadanos c ON st.ciudadano_id = c.id
  LEFT JOIN vehiculos v ON st.placa = v.placa
  WHERE st.estado = ?
  ORDER BY st.creado_en DESC
`);

const resolverStmt = db.prepare(`
  UPDATE solicitudes_traspaso
  SET estado = @estado, comentario_admin = @comentario_admin, actualizado_en = @actualizado_en
  WHERE id = @id
`);

export function buscarPorId(id: number): SolicitudTraspaso | undefined {
  return buscarPorIdStmt.get(id) as SolicitudTraspaso | undefined;
}

export function listarAdmin(filtro?: EstadoSolicitudTraspaso): SolicitudTraspasoAdmin[] {
  if (filtro) {
    return listarPorEstadoAdminStmt.all(filtro) as SolicitudTraspasoAdmin[];
  }
  return listarTodasAdminStmt.all() as SolicitudTraspasoAdmin[];
}

export function resolverSolicitud(datos: {
  id: number;
  estado: 'APROBADO' | 'RECHAZADO';
  comentario_admin: string | null;
}): number {
  const resultado = resolverStmt.run({ ...datos, actualizado_en: new Date().toISOString() });
  return resultado.changes as number;
}
