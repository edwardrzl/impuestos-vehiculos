import type { Request, Response } from 'express';
import * as traspasoService from '../services/traspasoService.js';
import { responderConError } from './errorHttp.js';

/** POST /api/traspasos/solicitar */
export async function solicitar(req: Request, res: Response): Promise<void> {
  try {
    const placa = (req.body?.placa as string | undefined)?.trim();

    if (!placa) {
      res.status(400).json({ error: 'La placa del vehículo es obligatoria' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'La foto de la tarjeta de propiedad es obligatoria' });
      return;
    }

    const resultado = await traspasoService.solicitarTraspaso({
      ciudadanoId: req.ciudadanoAutenticado!.id, // garantizado por ciudadanoAuthMiddleware
      placa,
      archivo: req.file,
    });

    // Rechazo de la IA = flujo normal (200), no error; 201 solo al crear la solicitud.
    res.status(resultado.aprobada ? 201 : 200).json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error al crear solicitud de traspaso');
  }
}

/** GET /api/traspasos/mis-solicitudes */
export function misSolicitudes(req: Request, res: Response): void {
  try {
    res.json(traspasoService.listarMisSolicitudes(req.ciudadanoAutenticado!.id));
  } catch (error) {
    responderConError(res, error, 'Error al listar solicitudes de traspaso');
  }
}
