// repositories/pagoRepository.ts
// Única capa que habla con SQLite para la tabla de pagos.
//
// Aquí también vive la ESCRITURA de vigencias (marcarlas como pagadas), porque
// ocurre dentro de la misma transacción que inserta el pago: insertar el pago y
// marcar sus vigencias como pagadas deben pasar juntos o no pasar. better-sqlite3
// es síncrono, así que la transacción también lo es (sin promesas).

import db from '../db.js';
import type { Pago } from '../types.js';

// Datos que el service entrega para registrar un pago. Son valores simples y ya
// validados; este repositorio solo los persiste.
export interface NuevoPago {
  referencia: string;
  placa: string;
  aniosPagados: number[];
  vigenciasIds: number[];
  montoTotal: number;
  metodoPago: string;
  fechaPago: string;
}

// Sentencias preparadas una sola vez.
const insertarPago = db.prepare(
  `INSERT INTO pagos (referencia, placa, vigencias_pagadas, monto_total, metodo_pago, fecha_pago)
   VALUES (?, ?, ?, ?, ?, ?)`
);

const marcarVigenciaPagada = db.prepare(
  'UPDATE vigencias SET estado = ?, fecha_pago = ? WHERE id = ?'
);

const buscarPagoPorReferencia = db.prepare('SELECT * FROM pagos WHERE referencia = ?');

/**
 * Registra un pago de forma atómica: inserta la fila en `pagos` y marca todas
 * sus vigencias como 'pagado'. Devuelve el id del pago recién creado.
 *
 * El array de años se guarda como JSON (la columna vigencias_pagadas es TEXT),
 * que es un detalle de almacenamiento y por eso se resuelve aquí.
 */
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

/** Busca un pago por su referencia. Devuelve undefined si no existe. */
export function buscarPorReferencia(referencia: string): Pago | undefined {
  return buscarPagoPorReferencia.get(referencia) as Pago | undefined;
}
