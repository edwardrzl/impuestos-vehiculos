import type { Response } from 'express';
import { RecursoNoEncontrado, DatosInvalidos, CredencialesInvalidas, ErrorDeNegocio } from '../errors.js';

function construirCuerpo(error: ErrorDeNegocio) {
  return error.detalle
    ? { error: error.textoError, message: error.detalle }
    : { error: error.textoError };
}

/**
 * Traduce errores de dominio a respuestas HTTP:
 *   RecursoNoEncontrado  → 404
 *   DatosInvalidos       → 400
 *   CredencialesInvalidas → 401
 *   cualquier otra cosa  → 500
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
