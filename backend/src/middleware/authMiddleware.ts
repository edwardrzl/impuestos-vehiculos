// middleware/authMiddleware.ts
// Protege rutas que requieren sesión de admin.
//
// Cómo funciona:
//   1. Lee el header "Authorization: Bearer <token>"
//   2. Verifica la firma del JWT con el mismo secreto que se usó al firmarlo
//   3. Si es válido, adjunta el payload (id, usuario) en req.adminAutenticado
//   4. Si falta o es inválido, responde 401 y corta la cadena de middlewares

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import type { AdminPayload } from '../types.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // El header debe tener exactamente el formato "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado: falta el token' });
    return;
  }

  const token = authHeader.slice(7); // elimina "Bearer " (7 caracteres)

  try {
    // jwt.verify lanza una excepción si el token expiró, la firma no coincide,
    // o el formato es inválido. Por eso lo envolvemos en try/catch.
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.adminAutenticado = payload;
    next(); // todo OK, continúa con el handler de la ruta
  } catch {
    res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}
