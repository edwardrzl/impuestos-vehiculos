// repositories/adminPanelRepository.ts
// SQL exclusivo del panel de administración: listar vehículos con filtros,
// obtener el detalle completo (vehículo + vigencias + pagos) y estadísticas.
//
// SEGURIDAD: los valores del usuario van SIEMPRE como parámetros (?), nunca
// concatenados en el SQL. Los nombres de columna tampoco vienen del usuario;
// los que necesitan ser dinámicos se validan contra una lista blanca definida
// aquí mismo en el código. Si algo no está en esa lista, se ignora.

import db from '../db.js';
import type {
  Vehiculo,
  Vigencia,
  Pago,
  FiltrosVehiculos,
  VehiculosAdminPaginados,
  VehiculoDetalleAdmin,
  StatsAdmin,
} from '../types.js';

const POR_PAGINA = 20;

// Lista blanca: solo estas columnas de vehiculos pueden usarse como filtro exacto.
// La clave es el nombre del filtro que llega del frontend; el valor es el nombre
// real de la columna en SQLite. NUNCA se usan valores externos como nombre de columna.
const COLUMNA_POR_FILTRO: Record<string, string> = {
  clase: 'clase',
  tipo_servicio: 'tipo_servicio',
};

/**
 * Devuelve una página de vehículos aplicando los filtros indicados.
 *
 * Construcción segura del WHERE dinámico:
 *   - Los valores del usuario → parámetros ?.
 *   - Los nombres de columna → tomados de COLUMNA_POR_FILTRO (código nuestro).
 *   - El filtro estado_pago → usa subqueries hardcodeadas; el valor del usuario
 *     solo determina QUÉ rama ejecutar, no escribe SQL.
 */
export function listarVehiculosPaginados(
  filtros: FiltrosVehiculos,
  pagina: number
): VehiculosAdminPaginados {
  const condiciones: string[] = [];
  const params: (string | number)[] = [];

  // Placa: búsqueda parcial case-insensitive. Las placas están en mayúsculas en la BD,
  // así que uppercaseamos el término para que LIKE las encuentre sin importar cómo escribió el admin.
  if (filtros.placa && filtros.placa.trim().length > 0) {
    condiciones.push('placa LIKE ?');
    params.push(`%${filtros.placa.trim().toUpperCase()}%`);
  }

  // Marca: búsqueda parcial. Los % están en el VALOR (parámetro), no en el SQL.
  // LIKE con parámetros es seguro; nunca concatenamos la entrada del usuario.
  if (filtros.marca && filtros.marca.trim().length >= 2) {
    condiciones.push('marca LIKE ?');
    params.push(`%${filtros.marca.trim()}%`);
  }

  // Filtros exactos: el nombre de columna siempre viene de la lista blanca.
  for (const [campo, columna] of Object.entries(COLUMNA_POR_FILTRO)) {
    const valor = filtros[campo as keyof FiltrosVehiculos];
    if (valor) {
      condiciones.push(`${columna} = ?`);
      params.push(valor as string);
    }
  }

  // Modelo: filtro numérico por año exacto.
  if (filtros.modelo) {
    condiciones.push('modelo = ?');
    params.push(filtros.modelo);
  }

  // Estado de pago: subquery fija. El usuario elige la RAMA, no escribe SQL.
  if (filtros.estado_pago === 'pendiente') {
    condiciones.push(
      "placa IN (SELECT DISTINCT placa FROM vigencias WHERE estado = 'pendiente')"
    );
  } else if (filtros.estado_pago === 'al_dia') {
    condiciones.push(
      "placa NOT IN (SELECT DISTINCT placa FROM vigencias WHERE estado = 'pendiente')"
    );
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  const offset = (pagina - 1) * POR_PAGINA;

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM vehiculos ${where}`)
    .get(...params) as { total: number };


  console.log("HOLAAAAAAAAAAAAA")
  console.log(`SELECT COUNT(*) as total FROM vehiculos ${where}`)
  console.log(`parametros insertados: ${params}`)

  const vehiculos = db
    .prepare(`SELECT * FROM vehiculos ${where} ORDER BY placa LIMIT ? OFFSET ?`)
    .all(...params, POR_PAGINA, offset) as Vehiculo[];

  return { vehiculos, total, pagina, por_pagina: POR_PAGINA };
}

// Sentencias preparadas una vez para las consultas del detalle y pagos.
const detalleVigencias = db.prepare(
  `SELECT id, placa, anio, valor, descuento, estado, fecha_pago, fecha_vencimiento
   FROM vigencias WHERE placa = ? ORDER BY anio DESC`
);
const detallePagos = db.prepare(
  'SELECT * FROM pagos WHERE placa = ? ORDER BY fecha_pago DESC'
);

/**
 * Devuelve el vehículo con todas sus vigencias y todos sus pagos.
 * Si el vehículo no existe, devuelve vehiculo=undefined.
 */
export function obtenerDetalleVehiculo(placa: string): VehiculoDetalleAdmin | null {
  const vehiculo = db
    .prepare('SELECT * FROM vehiculos WHERE placa = ?')
    .get(placa) as Vehiculo | undefined;

  if (!vehiculo) return null;

  return {
    vehiculo,
    vigencias: detalleVigencias.all(placa) as Vigencia[],
    pagos: detallePagos.all(placa) as Pago[],
  };
}

// Una sola query con subconsultas para traer las 4 estadísticas de un golpe.
const statsQuery = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM vehiculos)                           AS total_vehiculos,
    (SELECT COUNT(*) FROM vigencias WHERE estado = 'pendiente') AS vigencias_pendientes,
    (SELECT COUNT(*) FROM vigencias WHERE estado = 'pagado')    AS vigencias_pagadas,
    (SELECT COALESCE(SUM(monto_total), 0) FROM pagos)          AS monto_recaudado
`);

/** Devuelve los contadores globales del panel. */
export function obtenerStats(): StatsAdmin {
  return statsQuery.get() as StatsAdmin;
}
