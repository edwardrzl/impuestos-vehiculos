// controllers/vehiculoController.ts
// Única capa (junto con los demás controllers) que toca `req` y `res`.
// Lee los datos de la petición, llama al service y arma la respuesta.
// El try/catch delega la traducción de errores a códigos HTTP en responderConError.

import type { Request, Response } from 'express';
import * as vehiculoService from '../services/vehiculoService.js';
import { responderConError } from './errorHttp.js';

/** GET /api/vehiculos/:placa */
export function obtenerVehiculo(req: Request<{ placa: string }>, res: Response): void {
  try {
    const respuesta = vehiculoService.obtenerVehiculoConVigencias(req.params.placa);
    res.json(respuesta);
  } catch (error) {
    responderConError(res, error, 'Error consultando vehículo');
  }
}
