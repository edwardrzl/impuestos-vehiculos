import type { Request, Response } from 'express';
import * as chatService from '../services/chatService.js';
import type { SolicitudChat } from '../services/chatService.js';
import { responderConError } from './errorHttp.js';

/** POST /api/chat */
export async function conversar(req: Request, res: Response): Promise<void> {
  try {
    const respuesta = await chatService.conversar(req.body as SolicitudChat);
    res.json(respuesta);
  } catch (error) {
    responderConError(res, error, 'Error en el chat del asistente');
  }
}
