// services/pagoService.ts
// Lógica de negocio de pagos. NO conoce req/res.
// Aquí viven: las validaciones, la verificación de las vigencias, el cálculo del
// total, la generación de la referencia y el armado del comprobante. Cuando algo
// no cuadra, lanza un error de negocio que el controller traduce a 400/404.

import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import * as pagoRepository from '../repositories/pagoRepository.js';
import { RecursoNoEncontrado, DatosInvalidos } from '../errors.js';
import type { ComprobantePago } from '../types.js';

// Datos que llegan en el body del POST /api/pagos. Vienen "en crudo" (el cliente
// pudo mandar cualquier cosa), por eso este service los valida antes de usarlos.
export interface DatosPago {
  placa: string;
  vigencias_ids: number[];
  metodo_pago: string;
}

// Forma de la respuesta del GET /api/pagos/:referencia (un comprobante consultado).
export interface ComprobanteConsultado {
  id: number;
  referencia: string;
  placa: string;
  propietario: string;
  anios_pagados: number[];
  monto_total: number;
  metodo_pago: string;
  fecha_pago: string;
}

/**
 * Procesa el pago de una o varias vigencias y devuelve el comprobante.
 * El orden de los pasos importa: primero valida la forma de los datos, luego que
 * el vehículo y las vigencias existan, y por último que no estén ya pagadas.
 */
export function procesarPago(datos: DatosPago): ComprobantePago {
  const { placa, vigencias_ids, metodo_pago } = datos;

  // === VALIDACIONES BÁSICAS DE FORMA ===
  if (!placa || !vigencias_ids || !Array.isArray(vigencias_ids) || vigencias_ids.length === 0) {
    throw new DatosInvalidos('Datos inválidos', 'Se requiere placa y al menos una vigencia');
  }

  if (!metodo_pago) {
    throw new DatosInvalidos('Datos inválidos', 'Se requiere especificar el método de pago');
  }

  const placaNormalizada = placa.toUpperCase();

  // === EL VEHÍCULO DEBE EXISTIR ===
  const vehiculo = vehiculoRepository.buscarPorPlaca(placaNormalizada);
  if (!vehiculo) {
    throw new RecursoNoEncontrado('Vehículo no encontrado');
  }

  // === LAS VIGENCIAS DEBEN EXISTIR Y SER DE ESTE VEHÍCULO ===
  const vigencias = vehiculoRepository.buscarVigenciasPorIds(vigencias_ids, placaNormalizada);

  // Si volvieron menos filas de las que se pidieron, alguna no existe o es de otro vehículo.
  if (vigencias.length !== vigencias_ids.length) {
    throw new DatosInvalidos('Algunas vigencias no existen o no pertenecen a este vehículo');
  }

  // === NINGUNA PUEDE ESTAR YA PAGADA ===
  const yaPagadas = vigencias.filter((v) => v.estado === 'pagado');
  if (yaPagadas.length > 0) {
    throw new DatosInvalidos(
      'Vigencias ya pagadas',
      `Las vigencias de los años ${yaPagadas.map((v) => v.anio).join(', ')} ya están pagadas`
    );
  }

  // === DATOS DEL PAGO ===
  const referencia = `PAG-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
  const montoTotal = vigencias.reduce((sum, v) => sum + v.valor - v.descuento, 0);
  const fechaPago = new Date().toISOString();

  // El repositorio inserta el pago y marca las vigencias como pagadas (en una transacción).
  const pagoId = pagoRepository.registrarPago({
    referencia,
    placa: placaNormalizada,
    aniosPagados: vigencias.map((v) => v.anio),
    vigenciasIds: vigencias_ids,
    montoTotal,
    metodoPago: metodo_pago,
    fechaPago,
  });

  // === COMPROBANTE ===
  return {
    id: pagoId,
    referencia,
    placa: placaNormalizada,
    propietario: vehiculo.propietario,
    vigencias: vigencias.map((v) => ({ anio: v.anio, valor: v.valor })),
    monto_total: montoTotal,
    metodo_pago,
    fecha_pago: fechaPago,
  };
}

/**
 * Consulta un pago por su referencia y arma el comprobante para mostrarlo.
 * Los años pagados se guardan como JSON en la base, así que aquí se parsean
 * de vuelta a un array de números.
 */
export function consultarPago(referencia: string): ComprobanteConsultado {
  const pago = pagoRepository.buscarPorReferencia(referencia);
  if (!pago) {
    throw new RecursoNoEncontrado('Pago no encontrado');
  }

  const vehiculo = vehiculoRepository.buscarPorPlaca(pago.placa);
  const aniosPagados = JSON.parse(pago.vigencias_pagadas) as number[];

  return {
    id: pago.id,
    referencia: pago.referencia,
    placa: pago.placa,
    propietario: vehiculo?.propietario ?? '',
    anios_pagados: aniosPagados,
    monto_total: pago.monto_total,
    metodo_pago: pago.metodo_pago,
    fecha_pago: pago.fecha_pago,
  };
}
