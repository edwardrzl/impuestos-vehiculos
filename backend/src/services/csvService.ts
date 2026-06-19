import { parse } from 'csv-parse/sync';
import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import type { ResultadoCargaCSV } from '../types.js';

// Mapeo de valores del CSV a los normalizados en BD.
// Valores no presentes se guardan tal cual y generan una advertencia.
const NORMALIZACION_CLASE: Record<string, string> = {
  MOTOCICLETA: 'MOTOCICLETA',
  AUTOMOVIL:   'AUTOMOVIL',
  CAMIONETA:   'CAMIONETA',
  CAMPERO:     'CAMPERO',
  CAMION:      'CAMION',
  VOLQUETA:    'VOLQUETA',
  'B U S':     'BUS',
};

export function procesarCSV(buffer: Buffer): ResultadoCargaCSV {
  const filas = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const errores: ResultadoCargaCSV['errores'] = [];

  type FilaValida = {
    placa: string; clase: string; marca: string; linea: string; modelo: number;
    tipo_servicio: string; capacidad: null; avaluo: number;
    propietario: string; documento_propietario: string;
  };
  const filasValidas: FilaValida[] = [];

  // Solo advertir sobre clases desconocidas en filas que efectivamente se insertaron.
  const claseNoReconocidaPorFila: (string | null)[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numFila = i + 2; // filas de datos empiezan en 2 (fila 1 = encabezado)

    const placa        = (fila['NRO PLACA']       ?? '').trim().toUpperCase();
    const claseRaw     = (fila['CLASE']            ?? '').trim().toUpperCase();
    const marca        = (fila['MARCA']            ?? '').trim().toUpperCase();
    const modeloStr    = (fila['MODELO']           ?? '').replace(/,/g, ''); // "2,018" → "2018"
    const tipoServicio = (fila['TIPO DE SERVICIO'] ?? '').trim().toUpperCase();

    if (!placa) {
      errores.push({ fila: numFila, placa: '', motivo: 'El campo NRO PLACA está vacío' });
      continue;
    }
    if (!claseRaw) {
      errores.push({ fila: numFila, placa, motivo: 'El campo CLASE está vacío' });
      continue;
    }

    const modelo = parseInt(modeloStr, 10);
    if (isNaN(modelo)) {
      errores.push({ fila: numFila, placa, motivo: `MODELO no es un número válido: "${fila['MODELO']}"` });
      continue;
    }

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
      capacidad:             null,
      avaluo:                20000000,
      propietario:           'NO REGISTRADO',
      documento_propietario: 'NO REGISTRADO',
    });
    claseNoReconocidaPorFila.push(claseEraDesconocida);
  }

  if (filasValidas.length === 0) {
    return { insertados: 0, omitidos: 0, errores, advertencias: [] };
  }

  const { insertados, omitidos, insertadasPorIndice } =
    vehiculoRepository.insertarVehiculosEnLote(filasValidas);

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
