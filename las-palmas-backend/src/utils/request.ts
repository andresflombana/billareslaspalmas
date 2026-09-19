import { AuthRequest } from '../middlewares/auth.middleware';
import { JwtPayload } from './jwt';
import { noAutenticado } from './http';

/** Usuario autenticado de la petición. Solo se usa en rutas protegidas con requireAuth. */
export function usuarioDe(req: AuthRequest): JwtPayload {
  if (!req.usuario) throw noAutenticado();
  return req.usuario;
}
