// controllers/vigenciaController.ts
// Lee y valida el body del request, llama al service y arma la respuesta HTTP.
// Única capa que toca req/res en el flujo de vigencias.

import type { Request, Response } from 'express';
import * as vigenciaService from '../services/vigenciaService.js';
import { responderConError } from './errorHttp.js';
import { DatosInvalidos } from '../errors.js';

/** GET /api/admin/vigencias/anio-siguiente */
export function obtenerAnioSiguiente(_req: Request, res: Response): void {
  try {
    const anio_siguiente = vigenciaService.obtenerAnioSiguiente();
    res.json({ anio_siguiente });
  } catch (error) {
    responderConError(res, error, 'Error obteniendo año siguiente');
  }
}

/**
 * POST /api/admin/vigencias/generar-anual
 *
 * Body esperado:
 *   { anio, tasa_pct, descuento_pct, fecha_vencimiento }
 */
export function generarVigenciasAnuales(req: Request, res: Response): void {
  try {
    const { anio, tasa_pct, descuento_pct, fecha_vencimiento } = req.body as Record<string, unknown>;

    // Validar presencia y tipos básicos antes de pasarlos al service.
    if (typeof anio !== 'number' || !Number.isInteger(anio)) {
      throw new DatosInvalidos('El campo "anio" debe ser un entero');
    }
    if (typeof tasa_pct !== 'number' || tasa_pct <= 0) {
      throw new DatosInvalidos('El campo "tasa_pct" debe ser un número positivo');
    }
    if (typeof descuento_pct !== 'number' || descuento_pct < 0 || descuento_pct > 100) {
      throw new DatosInvalidos('El campo "descuento_pct" debe estar entre 0 y 100');
    }
    if (typeof fecha_vencimiento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_vencimiento)) {
      throw new DatosInvalidos('El campo "fecha_vencimiento" debe tener el formato YYYY-MM-DD');
    }

    const resultado = vigenciaService.generarVigenciasAnuales({
      anio,
      tasa_pct,
      descuento_pct,
      fecha_vencimiento,
    });

    res.json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error generando vigencias anuales');
  }
}
