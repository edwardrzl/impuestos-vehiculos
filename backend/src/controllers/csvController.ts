// controllers/csvController.ts
// Recibe el archivo CSV vía multipart/form-data (multer en memoria),
// delega el procesamiento al csvService y responde con el resumen.

import type { Request, Response } from 'express';
import multer from 'multer';
import * as csvService from '../services/csvService.js';
import { responderConError } from './errorHttp.js';
import { DatosInvalidos } from '../errors.js';

// Multer en memoria: el archivo nunca toca el disco, llega como Buffer en req.file.buffer.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (_req, file, cb) => {
    const esCSV =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' || // Excel a veces manda esto para .csv
      file.originalname.toLowerCase().endsWith('.csv');
    if (esCSV) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos .csv'));
    }
  },
});

/**
 * POST /api/admin/csv/vehiculos
 * Internamente corre el middleware de multer para leer el archivo,
 * luego llama al service y responde con el resumen de la importación.
 */
export function cargarCSV(req: Request, res: Response): void {
  // Ejecutar multer como función (no como middleware de Express) para poder capturar
  // sus errores dentro del mismo handler y responder con el formato del proyecto.
  upload.single('archivo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Errores propios de multer (tamaño excedido, campo incorrecto, etc.)
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      // fileFilter rechazó el archivo (no es CSV)
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
