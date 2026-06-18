// routes/auth.ts - Endpoints de autenticación. Solo cablean a controllers.

import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

// POST /api/auth/login -> devuelve { token } si las credenciales son válidas
router.post('/login', authController.login);

export default router;
