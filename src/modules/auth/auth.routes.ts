import { Router } from 'express';
import { loginController } from './auth.controller';

export const authRouter = Router();

// HU-01
authRouter.post('/login', loginController);
