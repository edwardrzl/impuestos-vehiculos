// controllers/errorHttp.ts
// Helper de la capa de controllers: traduce los errores de NEGOCIO que lanzan
// los services en una respuesta HTTP con el código correcto.
//
// Vive en controllers porque es la única capa que puede tocar `res`. Los services
// no saben que "no encontrado" significa 404; eso se decide aquí.

import type { Response } from 'express';
import { RecursoNoEncontrado, DatosInvalidos, CredencialesInvalidas, ErrorDeNegocio } from '../errors.js';

// Arma el cuerpo JSON { error, message? } a partir del error de negocio.
// Si no hay detalle, se omite el campo "message" (algunas respuestas no lo llevan).
function construirCuerpo(error: ErrorDeNegocio) {
  return error.detalle
    ? { error: error.textoError, message: error.detalle }
    : { error: error.textoError };
}

/**
 * Responde según el tipo de error:
 *   - RecursoNoEncontrado  -> 404
 *   - DatosInvalidos       -> 400
 *   - CredencialesInvalidas -> 401
 *   - cualquier otra cosa  -> 500 (error inesperado, se loguea)
 */
export function responderConError(res: Response, error: unknown, contextoLog: string): void {
  if (error instanceof RecursoNoEncontrado) {
    res.status(404).json(construirCuerpo(error));
    return;
  }

  if (error instanceof DatosInvalidos) {
    res.status(400).json(construirCuerpo(error));
    return;
  }

  if (error instanceof CredencialesInvalidas) {
    res.status(401).json(construirCuerpo(error));
    return;
  }

  console.error(`${contextoLog}:`, error);
  res.status(500).json({ error: 'Error interno del servidor' });
}
