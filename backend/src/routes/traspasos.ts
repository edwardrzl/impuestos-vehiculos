// routes/traspasos.ts - Endpoints de solicitudes de traspaso.
// Solo definen la ruta y delegan en el controller. Sin lógica.

import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { ciudadanoAuthMiddleware } from '../middleware/ciudadanoAuthMiddleware.js';
import { uploadTarjetaTraspaso } from '../middleware/upload.js';
import * as traspasoController from '../controllers/traspasoController.js';

const router = Router();

// Captura errores de multer (tipo rechazado, tamaño excedido) antes del controller.
function manejarSubidaFoto(req: Request, res: Response, next: NextFunction): void {
  uploadTarjetaTraspaso.single('foto')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        error: err.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no puede superar los 8 MB'
          : err.message,
      });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}

router.post('/solicitar', ciudadanoAuthMiddleware, manejarSubidaFoto, traspasoController.solicitar);
router.get('/mis-solicitudes', ciudadanoAuthMiddleware, traspasoController.misSolicitudes);

export default router;
