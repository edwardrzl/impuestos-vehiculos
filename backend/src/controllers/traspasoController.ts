import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as traspasoService from '../services/traspasoService.js';
import { responderConError } from './errorHttp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raíz del backend: src/controllers → src → backend/
const backendRoot = path.join(__dirname, '../..');

/** POST /api/traspasos */
export async function crearSolicitud(req: Request, res: Response): Promise<void> {
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

    // Ruta relativa con forward slashes para que funcione en Windows y sea URL-friendly.
    const rutaRelativa = path.relative(backendRoot, req.file.path).replace(/\\/g, '/');

    const resultado = await traspasoService.crearSolicitud({
      placa: placa.toUpperCase(),
      ciudadano_id: req.ciudadanoAutenticado!.id, // garantizado por ciudadanoAuthMiddleware
      foto_tarjeta_path: rutaRelativa,
    });

    res.status(201).json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error al crear solicitud de traspaso');
  }
}

/** GET /api/traspasos/mis-solicitudes */
export function listarMisSolicitudes(req: Request, res: Response): void {
  try {
    const ciudadanoId = req.ciudadanoAutenticado!.id;
    const solicitudes = traspasoService.listarSolicitudesCiudadano(ciudadanoId);
    res.json(solicitudes);
  } catch (error) {
    responderConError(res, error, 'Error al listar solicitudes de traspaso');
  }
}
