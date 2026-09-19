import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';
import { Rol } from '../../constants/enums';
import { asyncHandler } from '../../utils/http';
import * as c from './tables.controller';

// Módulo Billar — Mesas (Sprint 1). Toda ruta exige sesión; las administrativas,
// además, rol ADMINISTRADOR (HU-03: el permiso se valida en el backend, no solo en la UI).
export const tablesRouter = Router();
const soloAdmin = requireRole(Rol.ADMINISTRADOR);

tablesRouter.use(requireAuth);

tablesRouter.get('/', asyncHandler(c.listar)); //                                   HU-06
tablesRouter.get('/:id', asyncHandler(c.obtener));
tablesRouter.post('/', soloAdmin, asyncHandler(c.crear)); //                         CRUD
tablesRouter.put('/:id', soloAdmin, asyncHandler(c.editar)); //                      CRUD
tablesRouter.post('/:id/open', asyncHandler(c.abrir)); //                            HU-07
tablesRouter.patch('/:id/status', soloAdmin, asyncHandler(c.cambiarEstado)); //      HU-08
tablesRouter.post('/:id/cancel-opening', soloAdmin, asyncHandler(c.anularApertura));
tablesRouter.patch('/:id/active', soloAdmin, asyncHandler(c.cambiarActivacion)); //  baja / alta lógica
