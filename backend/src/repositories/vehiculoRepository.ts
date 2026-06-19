import db from '../db.js';
import type { Vehiculo, Vigencia } from '../types.js';

// capacidad es nullable: el CSV no incluye este dato.
type VehiculoParaInsertar = Omit<Vehiculo, 'capacidad'> & { capacidad: string | null };

export type VigenciaParaPago = Pick<Vigencia, 'id' | 'anio' | 'valor' | 'descuento' | 'estado'>;

const buscarVehiculo = db.prepare('SELECT * FROM vehiculos WHERE placa = ?');

const listarVigenciasPorPlaca = db.prepare(
  `SELECT id, placa, anio, valor, descuento, estado, fecha_pago, fecha_vencimiento
   FROM vigencias
   WHERE placa = ?
   ORDER BY anio DESC`
);

export function buscarPorPlaca(placa: string): Vehiculo | undefined {
  return buscarVehiculo.get(placa) as Vehiculo | undefined;
}

export function listarVigencias(placa: string): Vigencia[] {
  return listarVigenciasPorPlaca.all(placa) as Vigencia[];
}

export function insertarVehiculosEnLote(
  vehiculos: VehiculoParaInsertar[]
): { insertados: number; omitidos: number; insertadasPorIndice: boolean[] } {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO vehiculos
      (placa, clase, marca, linea, modelo, tipo_servicio, capacidad, avaluo, propietario, documento_propietario)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let insertados = 0;
  let omitidos = 0;
  // Declarado fuera del closure: better-sqlite3 es síncrono y la transacción lo muta antes de retornar.
  const insertadasPorIndice: boolean[] = [];

  const transaccion = db.transaction((filas: VehiculoParaInsertar[]) => {
    for (const v of filas) {
      const info = stmt.run(
        v.placa, v.clase, v.marca, v.linea, v.modelo,
        v.tipo_servicio, v.capacidad, v.avaluo, v.propietario, v.documento_propietario
      );
      const insertada = info.changes === 1; // 0 = ignorada por clave duplicada
      insertadasPorIndice.push(insertada);
      if (insertada) { insertados++; } else { omitidos++; }
    }
  });

  transaccion(vehiculos);
  return { insertados, omitidos, insertadasPorIndice };
}

// WHERE IN con placeholders dinámicos: no se puede preparar a nivel de módulo.
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
