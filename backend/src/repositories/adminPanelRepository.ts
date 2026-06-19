// Valores del usuario siempre como parámetros (?); nombres de columna
// dinámicos validados contra la lista blanca COLUMNA_POR_FILTRO.
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

const COLUMNA_POR_FILTRO: Record<string, string> = {
  clase: 'clase',
  tipo_servicio: 'tipo_servicio',
};

export function listarVehiculosPaginados(
  filtros: FiltrosVehiculos,
  pagina: number
): VehiculosAdminPaginados {
  const condiciones: string[] = [];
  const params: (string | number)[] = [];

  if (filtros.placa && filtros.placa.trim().length > 0) {
    condiciones.push('placa LIKE ?');
    params.push(`%${filtros.placa.trim().toUpperCase()}%`);
  }

  if (filtros.marca && filtros.marca.trim().length >= 2) {
    condiciones.push('marca LIKE ?');
    params.push(`%${filtros.marca.trim()}%`);
  }

  for (const [campo, columna] of Object.entries(COLUMNA_POR_FILTRO)) {
    const valor = filtros[campo as keyof FiltrosVehiculos];
    if (valor) {
      condiciones.push(`${columna} = ?`);
      params.push(valor as string);
    }
  }

  if (filtros.modelo) {
    condiciones.push('modelo = ?');
    params.push(filtros.modelo);
  }

  // estado_pago usa subqueries fijas: el valor del usuario elige la rama, no escribe SQL.
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

  const vehiculos = db
    .prepare(`SELECT * FROM vehiculos ${where} ORDER BY placa LIMIT ? OFFSET ?`)
    .all(...params, POR_PAGINA, offset) as Vehiculo[];

  return { vehiculos, total, pagina, por_pagina: POR_PAGINA };
}

const detalleVigencias = db.prepare(
  `SELECT id, placa, anio, valor, descuento, estado, fecha_pago, fecha_vencimiento
   FROM vigencias WHERE placa = ? ORDER BY anio DESC`
);
const detallePagos = db.prepare(
  'SELECT * FROM pagos WHERE placa = ? ORDER BY fecha_pago DESC'
);

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

const statsQuery = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM vehiculos)                           AS total_vehiculos,
    (SELECT COUNT(*) FROM vigencias WHERE estado = 'pendiente') AS vigencias_pendientes,
    (SELECT COUNT(*) FROM vigencias WHERE estado = 'pagado')    AS vigencias_pagadas,
    (SELECT COALESCE(SUM(monto_total), 0) FROM pagos)          AS monto_recaudado
`);

export function obtenerStats(): StatsAdmin {
  return statsQuery.get() as StatsAdmin;
}
