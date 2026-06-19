import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { responderConError } from './errorHttp.js';

interface LoginBody {
  usuario: string;
  password: string;
}

/** POST /api/auth/login */
export function login(req: Request, res: Response): void {
  try {
    const { usuario, password } = req.body as LoginBody;
    const token = authService.login(usuario, password);
    res.json({ token });
  } catch (error) {
    responderConError(res, error, 'Error en login');
  }
}
