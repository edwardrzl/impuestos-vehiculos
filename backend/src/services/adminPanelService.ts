// services/adminPanelService.ts
// Lógica de negocio del panel de administración. No conoce req/res.
// Sanitiza los filtros, valida la página, y delega el SQL al repository.

import * as adminPanelRepository from '../repositories/adminPanelRepository.js';
import { RecursoNoEncontrado } from '../errors.js';
import type {
  FiltrosVehiculos,
  VehiculosAdminPaginados,
  VehiculoDetalleAdmin,
  StatsAdmin,
} from '../types.js';

/**
 * Devuelve la lista paginada de vehículos con los filtros aplicados.
 * Garantiza que la página nunca sea menor a 1.
 */
export function listarVehiculos(
  filtros: FiltrosVehiculos,
  pagina: number
): VehiculosAdminPaginados {
  return adminPanelRepository.listarVehiculosPaginados(filtros, Math.max(1, pagina));
}

/**
 * Devuelve el detalle completo de un vehículo (datos + vigencias + pagos).
 * Lanza RecursoNoEncontrado si la placa no existe.
 */
export function obtenerDetalleVehiculo(placa: string): VehiculoDetalleAdmin {
  const detalle = adminPanelRepository.obtenerDetalleVehiculo(
    placa.toUpperCase().trim()
  );
  if (!detalle) {
    throw new RecursoNoEncontrado('Vehículo no encontrado');
  }
  return detalle;
}

/** Devuelve los números de resumen del panel (sin lógica extra). */
export function obtenerStats(): StatsAdmin {
  return adminPanelRepository.obtenerStats();
}
