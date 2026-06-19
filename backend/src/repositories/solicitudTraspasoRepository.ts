import db from '../db.js';
import type { SolicitudTraspaso, SolicitudTraspasoAdmin } from '../types.js';

const insertarSolicitud = db.prepare(`
  INSERT INTO solicitudes_traspaso
    (placa, ciudadano_id, foto_tarjeta_path, estado, resultado_ia, validacion_db, fecha_solicitud)
  VALUES (@placa, @ciudadano_id, @foto_tarjeta_path, 'pendiente', @resultado_ia, @validacion_db, @fecha_solicitud)
`);

const listarPorCiudadanoStmt = db.prepare(`
  SELECT id, placa, ciudadano_id, foto_tarjeta_path, estado, resultado_ia,
         validacion_db, fecha_solicitud, fecha_resolucion, admin_notas
  FROM solicitudes_traspaso
  WHERE ciudadano_id = ?
  ORDER BY fecha_solicitud DESC
`);

const buscarPorIdStmt = db.prepare(`
  SELECT id, placa, ciudadano_id, foto_tarjeta_path, estado, resultado_ia,
         validacion_db, fecha_solicitud, fecha_resolucion, admin_notas
  FROM solicitudes_traspaso
  WHERE id = ?
`);

export function crearSolicitud(datos: {
  placa: string;
  ciudadano_id: number;
  foto_tarjeta_path: string;
  resultado_ia: string | null;
  validacion_db: number;
}): number {
  const resultado = insertarSolicitud.run({
    ...datos,
    fecha_solicitud: new Date().toISOString(),
  });
  return resultado.lastInsertRowid as number;
}

export function listarPorCiudadano(ciudadano_id: number): SolicitudTraspaso[] {
  return listarPorCiudadanoStmt.all(ciudadano_id) as SolicitudTraspaso[];
}

export function buscarPorId(id: number): SolicitudTraspaso | undefined {
  return buscarPorIdStmt.get(id) as SolicitudTraspaso | undefined;
}

// ─── Queries para el panel de administración ──────────────────────────────────

const COLUMNAS_ADMIN = `
  st.id, st.placa, st.ciudadano_id, st.foto_tarjeta_path, st.estado,
  st.resultado_ia, st.validacion_db, st.fecha_solicitud, st.fecha_resolucion, st.admin_notas,
  c.nombre  AS ciudadano_nombre,
  c.email   AS ciudadano_email,
  c.documento AS ciudadano_documento,
  v.marca   AS vehiculo_marca,
  v.linea   AS vehiculo_linea,
  v.modelo  AS vehiculo_modelo,
  v.propietario           AS vehiculo_propietario,
  v.documento_propietario AS vehiculo_documento_propietario
`;

const listarTodasAdminStmt = db.prepare(`
  SELECT ${COLUMNAS_ADMIN}
  FROM solicitudes_traspaso st
  JOIN ciudadanos c ON st.ciudadano_id = c.id
  LEFT JOIN vehiculos v ON st.placa = v.placa
  ORDER BY st.fecha_solicitud DESC
`);

const listarPorEstadoAdminStmt = db.prepare(`
  SELECT ${COLUMNAS_ADMIN}
  FROM solicitudes_traspaso st
  JOIN ciudadanos c ON st.ciudadano_id = c.id
  LEFT JOIN vehiculos v ON st.placa = v.placa
  WHERE st.estado = ?
  ORDER BY st.fecha_solicitud DESC
`);

const resolverStmt = db.prepare(`
  UPDATE solicitudes_traspaso
  SET estado = @estado, admin_notas = @admin_notas, fecha_resolucion = @fecha_resolucion
  WHERE id = @id
`);

export function listarSolicitudes(
  filtro?: 'pendiente' | 'aprobado' | 'rechazado'
): SolicitudTraspasoAdmin[] {
  if (filtro) {
    return listarPorEstadoAdminStmt.all(filtro) as SolicitudTraspasoAdmin[];
  }
  return listarTodasAdminStmt.all() as SolicitudTraspasoAdmin[];
}

export function resolverSolicitud(datos: {
  id: number;
  estado: 'aprobado' | 'rechazado';
  admin_notas: string | null;
}): number {
  const resultado = resolverStmt.run({
    ...datos,
    fecha_resolucion: new Date().toISOString(),
  });
  return resultado.changes as number;
}
