// Escribir vigencias vive aquí (no en vigenciaRepository) porque debe ser
// atómica con el insert del pago: ambas operaciones van en la misma transacción.
import db from '../db.js';
import type { Pago } from '../types.js';

export interface NuevoPago {
  referencia: string;
  placa: string;
  aniosPagados: number[];
  vigenciasIds: number[];
  montoTotal: number;
  metodoPago: string;
  fechaPago: string;
}

const insertarPago = db.prepare(
  `INSERT INTO pagos (referencia, placa, vigencias_pagadas, monto_total, metodo_pago, fecha_pago)
   VALUES (?, ?, ?, ?, ?, ?)`
);

const marcarVigenciaPagada = db.prepare(
  'UPDATE vigencias SET estado = ?, fecha_pago = ? WHERE id = ?'
);

const buscarPagoPorReferencia = db.prepare('SELECT * FROM pagos WHERE referencia = ?');

// vigencias_pagadas se serializa como JSON porque SQLite no tiene tipo array.
export function registrarPago(datos: NuevoPago): number {
  const transaccion = db.transaction((p: NuevoPago) => {
    const resultPago = insertarPago.run(
      p.referencia,
      p.placa,
      JSON.stringify(p.aniosPagados),
      p.montoTotal,
      p.metodoPago,
      p.fechaPago
    );

    for (const id of p.vigenciasIds) {
      marcarVigenciaPagada.run('pagado', p.fechaPago, id);
    }

    return Number(resultPago.lastInsertRowid);
  });

  return transaccion(datos);
}

export function buscarPorReferencia(referencia: string): Pago | undefined {
  return buscarPagoPorReferencia.get(referencia) as Pago | undefined;
}
