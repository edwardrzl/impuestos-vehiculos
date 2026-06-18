// routes/pagos.ts - Endpoints de pagos.
// Solo definen la ruta y delegan en el controller. Sin lógica.

import { Router } from 'express';
import * as pagoController from '../controllers/pagoController.js';

const router = Router();

// POST /api/pagos             -> procesa el pago de una o varias vigencias
router.post('/', pagoController.crearPago);

// GET  /api/pagos/:referencia -> consulta un pago por su referencia
router.get('/:referencia', pagoController.consultarPago);

export default router;
