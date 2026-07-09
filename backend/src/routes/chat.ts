// routes/chat.ts - Endpoint del asistente IA.
// Solo define la ruta y delega en el controller. Sin lógica.

import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';

const router = Router();

// POST /api/chat -> conversación con el asistente (historial completo en el body)
router.post('/', chatController.conversar);

export default router;
