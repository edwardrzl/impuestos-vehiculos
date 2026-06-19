import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { uploadDocumento } from '../middleware/upload.js';
import * as ciudadanoController from '../controllers/ciudadanoController.js';

const router = Router();

// Captura errores de multer (tipo rechazado, tamaño excedido) antes de llegar al controller.
function manejarSubidaDocumento(req: Request, res: Response, next: NextFunction): void {
  uploadDocumento.single('foto_documento')(req, res, (err: unknown) => {
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

router.post('/registro', manejarSubidaDocumento, ciudadanoController.registro);
router.post('/login', ciudadanoController.login);

export default router;
