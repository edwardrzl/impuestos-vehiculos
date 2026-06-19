import type { Request, Response } from 'express';
import * as pagoService from '../services/pagoService.js';
import type { DatosPago } from '../services/pagoService.js';
import { responderConError } from './errorHttp.js';

/** POST /api/pagos */
export function crearPago(req: Request, res: Response): void {
  try {
    const comprobante = pagoService.procesarPago(req.body as DatosPago);
    res.status(201).json(comprobante);
  } catch (error) {
    responderConError(res, error, 'Error procesando pago');
  }
}

/** GET /api/pagos/:referencia */
export function consultarPago(req: Request<{ referencia: string }>, res: Response): void {
  try {
    const comprobante = pagoService.consultarPago(req.params.referencia);
    res.json(comprobante);
  } catch (error) {
    responderConError(res, error, 'Error consultando pago');
  }
}
