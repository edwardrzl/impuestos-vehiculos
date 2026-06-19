import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { ciudadanoAuthMiddleware } from '../middleware/ciudadanoAuthMiddleware.js';
import { uploadTarjeta } from '../middleware/upload.js';
import * as traspasoController from '../controllers/traspasoController.js';

const router = Router();

// Captura errores de multer (tipo rechazado, tamaño excedido) antes del controller.
function manejarSubidaTarjeta(req: Request, res: Response, next: NextFunction): void {
  uploadTarjeta.single('foto_tarjeta')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({
        error: err.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no puede superar los 5 MB'
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

router.post('/', ciudadanoAuthMiddleware, manejarSubidaTarjeta, traspasoController.crearSolicitud);
router.get('/mis-solicitudes', ciudadanoAuthMiddleware, traspasoController.listarMisSolicitudes);

export default router;
