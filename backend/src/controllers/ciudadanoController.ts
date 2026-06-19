import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as ciudadanoService from '../services/ciudadanoService.js';
import { responderConError } from './errorHttp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Raíz del backend: src/controllers → src → backend/
const backendRoot = path.join(__dirname, '../..');

/** POST /api/ciudadanos/registro */
export function registro(req: Request, res: Response): void {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'La foto del documento de identidad es obligatoria' });
      return;
    }

    const { nombre, documento, email, password } = req.body as {
      nombre: string;
      documento: string;
      email: string;
      password: string;
    };

    // Normalizar a forward slashes para que la ruta funcione en Windows y sea URL-friendly.
    const rutaRelativa = path.relative(backendRoot, req.file.path).replace(/\\/g, '/');

    const resultado = ciudadanoService.registrar({
      nombre,
      documento,
      email,
      password,
      foto_documento_path: rutaRelativa,
    });

    res.status(201).json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error en registro de ciudadano');
  }
}

/** POST /api/ciudadanos/login */
export function login(req: Request, res: Response): void {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const resultado = ciudadanoService.login({ email, password });
    res.json(resultado);
  } catch (error) {
    responderConError(res, error, 'Error en login de ciudadano');
  }
}
