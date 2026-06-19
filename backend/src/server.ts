// server.ts - Punto de entrada del backend.
// Su única responsabilidad es:
//   1. Cargar variables de entorno (dotenv, PRIMERO que todo lo demás).
//   2. Configurar Express y los middlewares globales (CORS, JSON, logger).
//   3. Montar los routers de cada dominio en sus rutas correspondientes.
//   4. Levantar el servidor en el puerto configurado.

// IMPORTANTE: este import debe ser el primero. dotenv carga el archivo .env
// en process.env antes de que cualquier otro módulo lo lea.
// En particular, config.ts (importado transitivamente por authService y
// authMiddleware) necesita JWT_SECRET ya disponible cuando se evalúa.
import 'dotenv/config';

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import vehiculosRouter from './routes/vehiculos.js';
import pagosRouter from './routes/pagos.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import db from './db.js';
import { runSeed } from './seed.js';

const app = express();
//const PORT = 3001;
const PORT = process.env.PORT || 3001;

// === MIDDLEWARES GLOBALES ===

// CORS: permite que el frontend (en otro puerto) llame a esta API.
app.use(cors());

// Parsea bodies JSON automáticamente.
app.use(express.json());

// Logger: imprime cada petición que llega. Muy útil para debug.
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toLocaleTimeString('es-CO')}] ${req.method} ${req.path}`);
  next();
});

// === HEALTHCHECK ===
// Útil para verificar que el servidor responde y como prueba de vida.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === MONTAR ROUTERS ===
app.use('/api/vehiculos', vehiculosRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// === AUTO-SEED EN PRODUCCIÓN ===
// Si la base de datos arranca vacía (ej. Render con volumen nuevo), corre el
// seed automáticamente. En desarrollo no hace nada porque ya hay datos.
const { total } = db.prepare('SELECT COUNT(*) as total FROM vehiculos').get() as { total: number };
if (total === 0) {
  console.log('⚙️  Base de datos vacía, ejecutando seed inicial...');
  runSeed();
}

// === ARRANCAR SERVIDOR ===
app.listen(PORT, () => {
  console.log('');
  console.log(`🚀 Servidor de impuestos vehiculares`);
  console.log(`   Corriendo en: http://localhost:${PORT}`);
  console.log('');
  console.log('   Endpoints disponibles:');
  console.log(`     GET  /api/health`);
  console.log(`     GET  /api/vehiculos/:placa`);
  console.log(`     POST /api/pagos`);
  console.log(`     GET  /api/pagos/:referencia`);
  console.log(`     POST /api/auth/login`);
  console.log(`     GET  /api/admin/me   (requiere JWT)`);
  console.log('');
});
