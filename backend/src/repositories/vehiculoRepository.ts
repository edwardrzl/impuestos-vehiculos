// repositories/vehiculoRepository.ts
// Única capa que habla con SQLite para vehículos y para LEER vigencias.
// (Las vigencias se agrupan aquí porque siempre se consultan junto al vehículo.)
//
// Reglas de esta capa:
//   - Recibe parámetros simples (strings, números, arrays).
//   - Devuelve datos ya tipados con las interfaces de types.ts.
//   - NO tiene lógica de negocio (ni validaciones, ni cálculos).
//   - Convierte las filas crudas (unknown) de better-sqlite3 al tipo correcto.

import db from '../db.js';
import type { Vehiculo, Vigencia } from '../types.js';

// Vehiculo con capacidad nullable: el CSV no trae este dato.
type VehiculoParaInsertar = Omit<Vehiculo, 'capacidad'> & { capacidad: string | null };

// Solo las columnas de una vigencia que necesita el flujo de pago.
export type VigenciaParaPago = Pick<Vigencia, 'id' | 'anio' | 'valor' | 'descuento' | 'estado'>;

// Sentencias preparadas una sola vez al cargar el módulo y reusadas en cada llamada.
const buscarVehiculo = db.prepare('SELECT * FROM vehiculos WHERE placa = ?');

const listarVigenciasPorPlaca = db.prepare(
  `SELECT id, placa, anio, valor, descuento, estado, fecha_pago, fecha_vencimiento
   FROM vigencias
   WHERE placa = ?
   ORDER BY anio DESC`
);

/** Busca un vehículo por su placa. Devuelve undefined si no existe. */
export function buscarPorPlaca(placa: string): Vehiculo | undefined {
  return buscarVehiculo.get(placa) as Vehiculo | undefined;
}

/** Devuelve todas las vigencias de un vehículo, de año más nuevo a más viejo. */
export function listarVigencias(placa: string): Vigencia[] {
  return listarVigenciasPorPlaca.all(placa) as Vigencia[];
}

/**
 * Inserta un lote de vehículos en una sola transacción usando INSERT OR IGNORE.
 * Si una placa ya existe en la BD, esa fila se salta (no se actualiza).
 * Devuelve el conteo de filas realmente insertadas y las omitidas.
 */
export function insertarVehiculosEnLote(
  vehiculos: VehiculoParaInsertar[]
): { insertados: number; omitidos: number; insertadasPorIndice: boolean[] } {
  // Sentencia preparada una sola vez fuera de la transacción para máxima eficiencia.
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO vehiculos
      (placa, clase, marca, linea, modelo, tipo_servicio, capacidad, avaluo, propietario, documento_propietario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let insertados = 0;
  let omitidos = 0;
  // Una entrada por fila: true si se insertó, false si fue ignorada por clave duplicada.
  // Se declara fuera del closure porque better-sqlite3 es síncrono y la muta antes de que transaccion() retorne.
  const insertadasPorIndice: boolean[] = [];

  // db.transaction garantiza que o se insertan todas las filas o ninguna (rollback automático si hay error inesperado).
  const transaccion = db.transaction((filas: VehiculoParaInsertar[]) => {
    for (const v of filas) {
      const info = stmt.run(
        v.placa, v.clase, v.marca, v.linea, v.modelo,
        v.tipo_servicio, v.capacidad, v.avaluo, v.propietario, v.documento_propietario
      );
      // info.changes === 1 → fila insertada; === 0 → ignorada por clave duplicada.
      const insertada = info.changes === 1;
      insertadasPorIndice.push(insertada);
      if (insertada) { insertados++; } else { omitidos++; }
    }
  });

  transaccion(vehiculos);
  return { insertados, omitidos, insertadasPorIndice };
}

/**
 * Busca varias vigencias por sus ids, pero solo las que pertenezcan a esta placa.
 * El número de placeholders depende de cuántos ids llegan, por eso se prepara aquí
 * (y no a nivel de módulo) la sentencia.
 */
export function buscarVigenciasPorIds(
  ids: number[],
  placa: string
): VigenciaParaPago[] {
  const placeholders = ids.map(() => '?').join(',');
  return db
    .prepare(
      `SELECT id, anio, valor, descuento, estado
       FROM vigencias
       WHERE id IN (${placeholders}) AND placa = ?`
    )
    .all(...ids, placa) as VigenciaParaPago[];
}
