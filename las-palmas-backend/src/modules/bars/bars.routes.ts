import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/http';
import * as c from './bars.controller';

// Módulo Billar — Barra (Sprint 1). HU-16 y HU-17 son historias del Operador:
// ambos roles pueden abrir/cerrar barras y abrir/cancelar cuentas.
export const barsRouter = Router();
barsRouter.use(requireAuth);
barsRouter.get('/', asyncHandler(c.listar));
barsRouter.post('/:id/open', asyncHandler(c.abrir)); //          HU-16
barsRouter.post('/:id/close', asyncHandler(c.cerrar)); //        HU-16
barsRouter.post('/:id/accounts', asyncHandler(c.abrirCuenta)); // HU-17

export const barAccountsRouter = Router();
barAccountsRouter.use(requireAuth);
barAccountsRouter.post('/:id/cancel', asyncHandler(c.cancelarCuenta));
