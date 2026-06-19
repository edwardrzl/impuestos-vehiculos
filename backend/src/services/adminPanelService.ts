import * as adminPanelRepository from '../repositories/adminPanelRepository.js';
import { RecursoNoEncontrado } from '../errors.js';
import type {
  FiltrosVehiculos,
  VehiculosAdminPaginados,
  VehiculoDetalleAdmin,
  StatsAdmin,
} from '../types.js';

export function listarVehiculos(
  filtros: FiltrosVehiculos,
  pagina: number
): VehiculosAdminPaginados {
  return adminPanelRepository.listarVehiculosPaginados(filtros, Math.max(1, pagina));
}

export function obtenerDetalleVehiculo(placa: string): VehiculoDetalleAdmin {
  const detalle = adminPanelRepository.obtenerDetalleVehiculo(
    placa.toUpperCase().trim()
  );
  if (!detalle) {
    throw new RecursoNoEncontrado('Vehículo no encontrado');
  }
  return detalle;
}

export function obtenerStats(): StatsAdmin {
  return adminPanelRepository.obtenerStats();
}
