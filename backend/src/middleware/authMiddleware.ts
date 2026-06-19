import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import type { AdminPayload } from '../types.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado: falta el token' });
    return;
  }

  const token = authHeader.slice(7); // "Bearer " = 7 chars

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminPayload;
    req.adminAutenticado = payload;
    next();
  } catch {
    res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}
