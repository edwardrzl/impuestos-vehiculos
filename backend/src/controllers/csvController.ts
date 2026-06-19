import type { Request, Response } from 'express';
import multer from 'multer';
import * as csvService from '../services/csvService.js';
import { responderConError } from './errorHttp.js';
import { DatosInvalidos } from '../errors.js';

// Multer en memoria: el archivo llega como Buffer en req.file.buffer, nunca toca el disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (_req, file, cb) => {
    const esCSV =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' || // Excel a veces manda este MIME para .csv
      file.originalname.toLowerCase().endsWith('.csv');
    if (esCSV) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos .csv'));
    }
  },
});

/** POST /api/admin/csv/vehiculos */
export function cargarCSV(req: Request, res: Response): void {
  // Multer se invoca como función (no middleware) para capturar sus errores
  // dentro del handler y responder con el mismo formato de error del proyecto.
  upload.single('archivo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    try {
      if (!req.file) {
        throw new DatosInvalidos('Archivo requerido', 'No se recibió ningún archivo en el campo "archivo"');
      }
      const resultado = csvService.procesarCSV(req.file.buffer);
      res.json(resultado);
    } catch (error) {
      responderConError(res, error, 'Error procesando CSV');
    }
  });
}
