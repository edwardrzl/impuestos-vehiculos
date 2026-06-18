// tipos/express.d.ts - Extiende el tipo Request de Express.
//
// TypeScript "fusiona" esta declaración con la interfaz Request original de Express
// (es el mecanismo llamado "declaration merging" o fusión de declaraciones).
// Gracias a esto, en cualquier archivo podemos usar req.adminAutenticado
// con tipado completo, sin castear ni usar 'any'.
//
// Este archivo es reconocido automáticamente por TypeScript porque está dentro
// de src/, que el tsconfig incluye con "src/**/*".

import type { AdminPayload } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      // Presente solo si el authMiddleware verificó el JWT correctamente.
      // Es undefined en rutas públicas (sin middleware de auth).
      adminAutenticado?: AdminPayload;
    }
  }
}

// El export {} convierte este archivo en un "módulo" de TypeScript.
// Sin él, sería un "script" global y la sintaxis declare global no funcionaría.
export {};
