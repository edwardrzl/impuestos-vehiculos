// dotenv debe importarse primero; config.ts lee JWT_SECRET al evaluarse.
import 'dotenv/config';

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// undici (el cliente fetch interno de Node.js) no lee HTTPS_PROXY / HTTP_PROXY
// automáticamente. El dispatcher global hace que todas las peticiones outbound
// (p. ej. las del SDK de Gemini en el chat y la validación) pasen por el proxy.
const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import vehiculosRouter from './routes/vehiculos.js';
import pagosRouter from './routes/pagos.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import ciudadanosRouter from './routes/ciudadanos.js';
import traspasosRouter from './routes/traspasos.js';
import chatRouter from './routes/chat.js';
import db from './db.js';
import { runSeed } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Archivos estáticos antes de los routers: evita que alguna ruta /uploads/:param
// sea capturada por un router antes de que Express sirva el archivo real.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toLocaleTimeString('es-CO')}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/vehiculos', vehiculosRouter);
app.use('/api/pagos', pagosRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ciudadanos', ciudadanosRouter);
app.use('/api/traspasos', traspasosRouter);
app.use('/api/chat', chatRouter);

// En producción la BD arranca vacía; el seed corre una sola vez si no hay vehículos.
const { total } = db.prepare('SELECT COUNT(*) as total FROM vehiculos').get() as { total: number };
if (total === 0) {
  console.log('⚙️  Base de datos vacía, ejecutando seed inicial...');
  runSeed();
}

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
  console.log(`     POST /api/chat`);
  console.log('');
});
