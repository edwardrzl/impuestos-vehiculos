// routes/vehiculos.ts - Endpoints de vehículos.
// Solo definen la ruta y delegan en el controller. Sin lógica.

import { Router } from 'express';
import * as vehiculoController from '../controllers/vehiculoController.js';

const router = Router();

// GET /api/vehiculos/:placa -> vehículo + vigencias + resumen
router.get('/:placa', vehiculoController.obtenerVehiculo);

export default router;
