import * as vigenciaRepository from '../repositories/vigenciaRepository.js';
import { DatosInvalidos } from '../errors.js';

export interface ParamsGenerarVigencias {
  anio: number;
  tasa_pct: number;       // porcentaje del avalúo (ej. 1 = 1%)
  descuento_pct: number;  // porcentaje del valor (ej. 15 = 15%)
  fecha_vencimiento: string; // formato YYYY-MM-DD
}

export interface ResultadoGenerarVigencias {
  anio: number;
  total_vehiculos: number;
  creadas: number;
  omitidas: number;
  errores: number;
}

const ANIO_MINIMO = 2026;

export function obtenerAnioSiguiente(): number {
  return vigenciaRepository.obtenerAnioSiguiente();
}

export function generarVigenciasAnuales(
  params: ParamsGenerarVigencias
): ResultadoGenerarVigencias {
  const { anio, tasa_pct, descuento_pct, fecha_vencimiento } = params;

  if (anio < ANIO_MINIMO) {
    throw new DatosInvalidos(`El año mínimo permitido es ${ANIO_MINIMO}`);
  }

  // No se puede saltar un año: exige que las del año anterior existan primero.
  if (anio > ANIO_MINIMO) {
    const anioAnterior = anio - 1;
    if (!vigenciaRepository.existeVigenciaParaAnio(anioAnterior)) {
      throw new DatosInvalidos(
        `No se pueden crear vigencias de ${anio} porque aún no existen las de ${anioAnterior}.`
      );
    }
  }

  const vehiculos = vigenciaRepository.obtenerTodosParaVigencia();

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
