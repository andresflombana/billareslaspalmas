import { Router } from 'express';
import { loginController, meController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

export const authRouter = Router();

// HU-01
authRouter.post('/login', loginController);
// HU-01: restaurar la sesión al refrescar la página
authRouter.get('/me', requireAuth, meController);
