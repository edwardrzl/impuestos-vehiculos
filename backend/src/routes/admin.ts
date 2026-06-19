// routes/admin.ts - Rutas protegidas del panel de administración.
// Todas las rutas pasan primero por authMiddleware.
// Los handlers concretos viven en adminPanelController.

import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as adminPanelController from '../controllers/adminPanelController.js';
import * as csvController from '../controllers/csvController.js';
import * as vigenciaController from '../controllers/vigenciaController.js';

const router = Router();

// Aplica el middleware a TODAS las rutas de este router de una sola vez.
router.use(authMiddleware);

/** GET /api/admin/me — confirma que la sesión sigue activa. */
router.get('/me', (req: Request, res: Response) => {
  res.json({ usuario: req.adminAutenticado!.usuario });
});

/** GET /api/admin/stats — contadores globales del panel. */
router.get('/stats', adminPanelController.obtenerStats);

/** GET /api/admin/vehiculos?marca=&clase=&modelo=&tipo_servicio=&estado_pago=&pagina= */
router.get('/vehiculos', adminPanelController.listarVehiculos);

/** GET /api/admin/vehiculos/:placa — detalle completo: datos + vigencias + pagos. */
router.get('/vehiculos/:placa', adminPanelController.obtenerDetalleVehiculo);

/** POST /api/admin/csv/vehiculos — carga masiva de vehículos desde un archivo CSV. */
router.post('/csv/vehiculos', csvController.cargarCSV);

/** GET /api/admin/solicitudes-traspaso?estado= — lista solicitudes de traspaso. */
router.get('/solicitudes-traspaso', adminPanelController.listarSolicitudesTraspaso);

/** PUT /api/admin/solicitudes-traspaso/:id/resolver — aprueba o rechaza una solicitud. */
router.put('/solicitudes-traspaso/:id/resolver', adminPanelController.resolverSolicitudTraspaso);

// Las rutas de vigencias sin parámetro dinámico van PRIMERO para evitar
// que Express las confunda con rutas del tipo /vigencias/:id.
/** GET /api/admin/vigencias/anio-siguiente — año para el que se generarán las próximas vigencias. */
router.get('/vigencias/anio-siguiente', vigenciaController.obtenerAnioSiguiente);

/** POST /api/admin/vigencias/generar-anual — genera vigencias anuales para todos los vehículos. */
router.post('/vigencias/generar-anual', vigenciaController.generarVigenciasAnuales);

export default router;
