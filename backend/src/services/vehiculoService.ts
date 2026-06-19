import * as vehiculoRepository from '../repositories/vehiculoRepository.js';
import { RecursoNoEncontrado } from '../errors.js';
import type { VehiculoConVigencias } from '../types.js';

/** La placa se normaliza a mayúsculas para coincidir con la BD. */
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

  // Resumen calculado en el backend para consistencia entre clientes.
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
