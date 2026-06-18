// repositories/vigenciaRepository.ts
// SQL exclusivo de operaciones sobre vigencias anuales.
// No contiene lógica de negocio: solo ejecuta consultas y devuelve datos tipados.

import db from '../db.js';

/** Par mínimo de un vehículo para calcular el valor de su vigencia. */
export interface VehiculoParaVigencia {
  placa: string;
  avaluo: number;
}

/** Datos listos para insertar en la tabla vigencias. */
export interface VigenciaParaInsertar {
  placa: string;
  anio: number;
  valor: number;
  descuento: number;
  fecha_vencimiento: string;
}

/** Devuelve placa y avalúo de todos los vehículos registrados. */
export function obtenerTodosParaVigencia(): VehiculoParaVigencia[] {
  return db
    .prepare('SELECT placa, avaluo FROM vehiculos')
    .all() as VehiculoParaVigencia[];
}

/**
 * Devuelve el año siguiente al máximo registrado en vigencias.
 * COALESCE garantiza que si la tabla está vacía devuelva 2026,
 * de modo que el resultado siempre sea al menos 2027.
 */
export function obtenerAnioSiguiente(): number {
  const fila = db
    .prepare('SELECT COALESCE(MAX(anio), 2026) + 1 AS anio_siguiente FROM vigencias')
    .get() as { anio_siguiente: number };
  return fila.anio_siguiente;
}

/** Comprueba si existe al menos una vigencia para el año indicado. */
export function existeVigenciaParaAnio(anio: number): boolean {
  const fila = db
    .prepare('SELECT 1 FROM vigencias WHERE anio = ? LIMIT 1')
    .get(anio) as { 1: number } | undefined;
  return fila !== undefined;
}

/**
 * Inserta un lote de vigencias en una sola transacción con INSERT OR IGNORE.
 * Si la combinación (placa, anio) ya existe, la fila se salta sin abortar.
 * Devuelve cuántas filas se crearon realmente y cuántas se omitieron.
 */
export function insertarVigenciasEnLote(
  vigencias: VigenciaParaInsertar[]
): { creadas: number; omitidas: number } {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO vigencias
      (placa, anio, valor, descuento, estado, fecha_pago, fecha_vencimiento)
    VALUES (?, ?, ?, ?, 'pendiente', null, ?)
  `);

  let creadas = 0;
  let omitidas = 0;

  const transaccion = db.transaction((filas: VigenciaParaInsertar[]) => {
    for (const v of filas) {
      const info = stmt.run(v.placa, v.anio, v.valor, v.descuento, v.fecha_vencimiento);
      // changes === 1 → fila nueva; === 0 → ignorada por UNIQUE(placa, anio)
      if (info.changes === 1) { creadas++; } else { omitidas++; }
    }
  });

  transaccion(vigencias);
  return { creadas, omitidas };
}
