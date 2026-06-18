// services/csvService.ts
// Lógica de negocio de la importación CSV: parseo, transformación, validación e inserción.
// No conoce req/res. Solo recibe un Buffer y devuelve un resumen del resultado.

import { parse } from 'csv-parse/sync';
import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import type { ResultadoCargaCSV } from '../types.js';

// Mapeo de los valores que puede traer el CSV a los valores normalizados que guarda la BD.
// Si el valor no está en esta tabla se guarda el original y se emite una advertencia.
const NORMALIZACION_CLASE: Record<string, string> = {
  MOTOCICLETA: 'MOTOCICLETA',
  AUTOMOVIL:   'AUTOMOVIL',
  CAMIONETA:   'CAMIONETA',
  CAMPERO:     'CAMPERO',
  CAMION:      'CAMION',
  VOLQUETA:    'VOLQUETA',
  'B U S':     'BUS',
};

/**
 * Parsea un buffer CSV, valida y transforma cada fila, e inserta los vehículos válidos
 * en la base de datos dentro de una sola transacción.
 * Devuelve un resumen con conteos y listado de errores/advertencias por fila.
 */
export function procesarCSV(buffer: Buffer): ResultadoCargaCSV {
  // Parsear: columns:true usa la primera fila como nombres de campo.
  const filas = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const errores: ResultadoCargaCSV['errores'] = [];

  // Tipo local que coincide con lo que acepta vehiculoRepository.insertarVehiculosEnLote.
  type FilaValida = {
    placa: string; clase: string; marca: string; linea: string; modelo: number;
    tipo_servicio: string; capacidad: null; avaluo: number;
    propietario: string; documento_propietario: string;
  };
  const filasValidas: FilaValida[] = [];

  // Por cada fila válida, guardamos la clase original si no estaba en el mapa de normalización.
  // Después de insertar, solo emitiremos la advertencia para las filas que realmente se insertaron.
  const claseNoReconocidaPorFila: (string | null)[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    // Fila 1 = encabezado, datos empiezan en fila 2.
    const numFila = i + 2;

    // Extraer y limpiar los campos que nos interesan del CSV.
    const placa        = (fila['NRO PLACA']       ?? '').trim().toUpperCase();
    const claseRaw     = (fila['CLASE']            ?? '').trim().toUpperCase();
    const marca        = (fila['MARCA']            ?? '').trim().toUpperCase();
    const modeloStr    = (fila['MODELO']           ?? '').replace(/,/g, ''); // "2,018" → "2018"
    const tipoServicio = (fila['TIPO DE SERVICIO'] ?? '').trim().toUpperCase();

    // Validaciones: placa y clase son obligatorias.
    if (!placa) {
      errores.push({ fila: numFila, placa: '', motivo: 'El campo NRO PLACA está vacío' });
      continue;
    }
    if (!claseRaw) {
      errores.push({ fila: numFila, placa, motivo: 'El campo CLASE está vacío' });
      continue;
    }

    // Convertir modelo a entero (ya sin comas).
    const modelo = parseInt(modeloStr, 10);
    if (isNaN(modelo)) {
      errores.push({ fila: numFila, placa, motivo: `MODELO no es un número válido: "${fila['MODELO']}"` });
      continue;
    }

    // Normalizar clase contra el mapa de valores conocidos.
    // Si no está en el mapa, se guarda el valor original y se marca para posible advertencia.
    // La advertencia se emite más abajo, SOLO si la fila efectivamente se insertó.
    let clase: string;
    let claseEraDesconocida: string | null = null;

    if (claseRaw in NORMALIZACION_CLASE) {
      clase = NORMALIZACION_CLASE[claseRaw];
    } else {
      clase = claseRaw;
      claseEraDesconocida = claseRaw;
    }

    filasValidas.push({
      placa,
      clase,
      marca,
      linea:                 'NO REGISTRADA',
      modelo,
      tipo_servicio:         tipoServicio || 'NO REGISTRADO',
      capacidad:             null,          // columna nullable; el CSV no trae este dato
      avaluo:                20000000,
      propietario:           'NO REGISTRADO',
      documento_propietario: 'NO REGISTRADO',
    });
    claseNoReconocidaPorFila.push(claseEraDesconocida);
  }

  if (filasValidas.length === 0) {
    return { insertados: 0, omitidos: 0, errores, advertencias: [] };
  }

  // Insertar todas las filas válidas en una sola transacción.
  // insertadasPorIndice[i] === true solo si la fila i fue realmente insertada (no ignorada por duplicado).
  const { insertados, omitidos, insertadasPorIndice } =
    vehiculoRepository.insertarVehiculosEnLote(filasValidas);

  // Emitir advertencias de clase no reconocida SOLO para las filas que se insertaron.
  // Si la placa ya existía (INSERT OR IGNORE la omitió), no tiene sentido advertir.
  const advertencias: string[] = [];
  for (let i = 0; i < filasValidas.length; i++) {
    if (insertadasPorIndice[i] && claseNoReconocidaPorFila[i] !== null) {
      const msg = `Clase no reconocida: "${claseNoReconocidaPorFila[i]}" (placa ${filasValidas[i].placa}) — se guardó tal cual`;
      if (!advertencias.includes(msg)) {
        advertencias.push(msg);
      }
    }
  }

  return { insertados, omitidos, errores, advertencias };
}
