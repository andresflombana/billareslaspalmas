import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { Rol } from '../constants/enums';

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

// HU-01: toda ruta protegida exige un token válido en el header Authorization.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado', code: 'NO_AUTENTICADO' });
  }
  try {
    req.usuario = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada', code: 'SESION_INVALIDA' });
  }
}

// HU-03: guarda de rol — el Operador nunca debe poder llegar a rutas administrativas.
// Uso: router.post('/x', requireRole(Rol.ADMINISTRADOR), handler) (después de requireAuth)
export function requireRole(...rolesPermitidos: Rol[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción', code: 'SIN_PERMISO' });
    }
    next();
  };
}
