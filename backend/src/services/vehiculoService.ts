// services/vehiculoService.ts
// Lógica de negocio de vehículos. NO conoce req/res: recibe datos planos y
// devuelve datos planos. Si algo va mal a nivel de dominio, lanza un error de
// negocio (RecursoNoEncontrado) que el controller traducirá a un código HTTP.

import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import { RecursoNoEncontrado } from '../errors.js';
import type { VehiculoConVigencias } from '../types.js';

/**
 * Devuelve un vehículo con sus vigencias y un resumen calculado (cuánto debe,
 * cuántas vigencias están pendientes, si está al día o no).
 *
 * La placa se normaliza a MAYÚSCULAS porque así se guardan en la base.
 */
export function obtenerVehiculoConVigencias(placaRecibida: string): VehiculoConVigencias {
  const placa = placaRecibida.toUpperCase().trim();

  const vehiculo = vehiculoRepository.buscarPorPlaca(placa);
  if (!vehiculo) {
    throw new RecursoNoEncontrado(
      'Vehículo no encontrado',
      `No se encontró ningún vehículo con la placa ${placa}`
    );
  }

  const vigencias = vehiculoRepository.listarVigencias(placa);

  // El resumen se calcula en el backend (no en el frontend) para que cualquier
  // cliente —web, móvil, etc.— reciba la misma lógica.
  const pendientes = vigencias.filter((v) => v.estado === 'pendiente');
  const total_deuda = pendientes.reduce((sum, v) => sum + v.valor - v.descuento, 0);
  
  vigencias.forEach(vigencia => {
    if(vigencia.fecha_vencimiento && (new Date(vigencia.fecha_vencimiento) < new Date())){
      vigencia.descuento = 0
    }
  });

  return {
    vehiculo,
    vigencias,
    resumen: {
      total_vigencias: vigencias.length,
      vigencias_pendientes: pendientes.length,
      total_deuda,
      estado_general: pendientes.length === 0 ? 'al_dia' : 'con_deuda',
    },
  };
}
