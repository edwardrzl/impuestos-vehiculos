// services/vigenciaService.ts
// Lógica de negocio de la generación masiva de vigencias anuales.
// No conoce req/res. Solo recibe parámetros simples y devuelve un resultado.

import * as vigenciaRepository from '../repositories/vigenciaRepository.js';
import { DatosInvalidos } from '../errors.js';

/** Parámetros que llegan del body del request (ya parseados por el controller). */
export interface ParamsGenerarVigencias {
  anio: number;
  tasa_pct: number;       // porcentaje del avalúo → p.ej. 1 significa 1%
  descuento_pct: number;  // porcentaje del valor → p.ej. 15 significa 15%
  fecha_vencimiento: string; // formato ISO "YYYY-MM-DD"
}

/** Lo que devuelve el endpoint al frontend. */
export interface ResultadoGenerarVigencias {
  anio: number;
  total_vehiculos: number;
  creadas: number;
  omitidas: number;
  errores: number;
}

const ANIO_MINIMO = 2027;

/** Devuelve el año para el que se deben crear las próximas vigencias. */
export function obtenerAnioSiguiente(): number {
  return vigenciaRepository.obtenerAnioSiguiente();
}

/**
 * Genera vigencias anuales para todos los vehículos registrados.
 *
 * Validaciones:
 *   1. anio >= ANIO_MINIMO
 *   2. Si anio > ANIO_MINIMO, debe existir al menos una vigencia del año anterior.
 *
 * Cálculo por vehículo:
 *   - valor     = ROUND(avaluo * tasa_pct / 100)
 *   - descuento = ROUND(valor  * descuento_pct / 100)
 */
export function generarVigenciasAnuales(
  params: ParamsGenerarVigencias
): ResultadoGenerarVigencias {
  const { anio, tasa_pct, descuento_pct, fecha_vencimiento } = params;

  // Validación 1: año mínimo
  if (anio < ANIO_MINIMO) {
    throw new DatosInvalidos(`El año mínimo permitido es ${ANIO_MINIMO}`);
  }

  // Validación 2: secuencialidad — no se puede saltar un año
  if (anio > ANIO_MINIMO) {
    const anioAnterior = anio - 1;
    if (!vigenciaRepository.existeVigenciaParaAnio(anioAnterior)) {
      throw new DatosInvalidos(
        `No se pueden crear vigencias de ${anio} porque aún no existen las de ${anioAnterior}.`
      );
    }
  }

  const vehiculos = vigenciaRepository.obtenerTodosParaVigencia();

  // Calcular el monto de cada vigencia. Math.round evita centavos flotantes.
  const vigenciasAInsertar = vehiculos.map((v) => {
    const valor     = Math.round((v.avaluo * tasa_pct) / 100);
    const descuento = Math.round((valor    * descuento_pct) / 100);
    return {
      placa:             v.placa,
      anio,
      valor,
      descuento,
      fecha_vencimiento,
    };
  });

  const { creadas, omitidas } = vigenciaRepository.insertarVigenciasEnLote(vigenciasAInsertar);

  return {
    anio,
    total_vehiculos: vehiculos.length,
    creadas,
    omitidas,
    errores: 0, // la transacción lanza si algo falla; si llegamos aquí es 0
  };
}
