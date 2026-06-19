import type { Request, Response } from 'express';
import * as adminPanelService from '../services/adminPanelService.js';
import { responderConError } from './errorHttp.js';
import type { FiltrosVehiculos } from '../types.js';

/** GET /api/admin/vehiculos?marca=&clase=&modelo=&tipo_servicio=&estado_pago=&pagina= */
export function listarVehiculos(req: Request, res: Response): void {
  try {
    const {
      placa,
      marca,
      clase,
      modelo,
      tipo_servicio,
      estado_pago,
      pagina,
    } = req.query as Record<string, string | undefined>;

    const filtros: FiltrosVehiculos = {};
    if (placa) filtros.placa = placa;
    if (marca) filtros.marca = marca;
    if (clase) filtros.clase = clase;
    if (modelo) filtros.modelo = Number(modelo);
    if (tipo_servicio) filtros.tipo_servicio = tipo_servicio;
    if (estado_pago === 'pendiente' || estado_pago === 'al_dia') {
      filtros.estado_pago = estado_pago;
    }

    const paginaNum = pagina ? Math.max(1, parseInt(pagina, 10)) : 1;
    const resultado = adminPanelService.listarVehiculos(filtros, paginaNum);
    res.json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error listando vehículos admin');
  }
}

/** GET /api/admin/vehiculos/:placa */
export function obtenerDetalleVehiculo(
  req: Request<{ placa: string }>,
  res: Response
): void {
  try {
    const detalle = adminPanelService.obtenerDetalleVehiculo(req.params.placa);
    res.json(detalle);
  } catch (error) {
    responderConError(res, error, 'Error obteniendo detalle del vehículo');
  }
}

/** GET /api/admin/stats */
export function obtenerStats(_req: Request, res: Response): void {
  try {
    res.json(adminPanelService.obtenerStats());
  } catch (error) {
    responderConError(res, error, 'Error obteniendo estadísticas');
  }
}
