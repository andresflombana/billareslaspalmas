import { Request, Response, NextFunction } from 'express';
import { login, CredencialesInvalidasError, UsuarioInactivoError } from './auth.service';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const resultado = await login(email, password);
    res.json(resultado);
  } catch (error) {
    // Mensaje genérico a propósito: no revelar si el correo existe o no.
    if (error instanceof CredencialesInvalidasError) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
    if (error instanceof UsuarioInactivoError) {
      return res.status(403).json({ error: 'Este usuario está desactivado' });
    }
    next(error);
  }
}
