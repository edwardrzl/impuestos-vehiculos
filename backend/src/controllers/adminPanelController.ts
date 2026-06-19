import type { Request, Response } from 'express';
import * as adminPanelService from '../services/adminPanelService.js';
import * as traspasoService from '../services/traspasoService.js';
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

/** GET /api/admin/solicitudes-traspaso?estado= */
export function listarSolicitudesTraspaso(req: Request, res: Response): void {
  try {
    const { estado } = req.query as Record<string, string | undefined>;
    const ESTADOS_VALIDOS = ['pendiente', 'aprobado', 'rechazado'] as const;
    const filtro = ESTADOS_VALIDOS.includes(estado as typeof ESTADOS_VALIDOS[number])
      ? (estado as 'pendiente' | 'aprobado' | 'rechazado')
      : undefined;
    res.json(traspasoService.listarSolicitudes(filtro));
  } catch (error) {
    responderConError(res, error, 'Error listando solicitudes de traspaso');
  }
}

/** PUT /api/admin/solicitudes-traspaso/:id/resolver */
export function resolverSolicitudTraspaso(
  req: Request<{ id: string }>,
  res: Response
): void {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID de solicitud inválido.' });
      return;
    }

    const { estado, admin_notas } = req.body as { estado: string; admin_notas?: string };

    if (estado !== 'aprobado' && estado !== 'rechazado') {
      res.status(400).json({ error: 'El estado debe ser "aprobado" o "rechazado".' });
      return;
    }

    const actualizada = traspasoService.resolverSolicitud({
      id,
      estado: estado as 'aprobado' | 'rechazado',
      admin_notas: admin_notas ?? null,
      adminId: req.adminAutenticado!.id,
    });
    res.json(actualizada);
  } catch (error) {
    responderConError(res, error, 'Error resolviendo solicitud de traspaso');
  }
}
