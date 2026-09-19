import { Request, Response, NextFunction } from 'express';
import { login, me, CredencialesInvalidasError, UsuarioInactivoError } from './auth.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { usuarioDe } from '../../utils/request';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios', code: 'CAMPO_OBLIGATORIO' });
    }

    const resultado = await login(email, password);
    res.json(resultado);
  } catch (error) {
    // Mensaje genérico a propósito: no revelar si el correo existe o no.
    if (error instanceof CredencialesInvalidasError) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos', code: 'CREDENCIALES_INVALIDAS' });
    }
    if (error instanceof UsuarioInactivoError) {
      return res.status(403).json({ error: 'Este usuario está desactivado', code: 'USUARIO_INACTIVO' });
    }
    next(error);
  }
}

export async function meController(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuario = await me(usuarioDe(req).sub);
    if (!usuario) {
      return res.status(401).json({ error: 'La sesión ya no es válida', code: 'SESION_INVALIDA' });
    }
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
}
