import db from '../db.js';

export interface VehiculoParaVigencia {
  placa: string;
  avaluo: number;
}

export interface VigenciaParaInsertar {
  placa: string;
  anio: number;
  valor: number;
  descuento: number;
  fecha_vencimiento: string;
}

export function obtenerTodosParaVigencia(): VehiculoParaVigencia[] {
  return db
    .prepare('SELECT placa, avaluo FROM vehiculos')
    .all() as VehiculoParaVigencia[];
}

// COALESCE garantiza mínimo 2027 cuando la tabla de vigencias está vacía.
export function obtenerAnioSiguiente(): number {
  const fila = db
    .prepare('SELECT COALESCE(MAX(anio), 2026) + 1 AS anio_siguiente FROM vigencias')
    .get() as { anio_siguiente: number };
  return fila.anio_siguiente;
}

export function existeVigenciaParaAnio(anio: number): boolean {
  const fila = db
    .prepare('SELECT 1 FROM vigencias WHERE anio = ? LIMIT 1')
    .get(anio) as { 1: number } | undefined;
  return fila !== undefined;
}

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
