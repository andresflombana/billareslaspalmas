import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { ROLES, Rol } from '../constants/enums';

export interface JwtPayload {
  sub: number;
  rol: Rol;
}

export function signToken(payload: JwtPayload): string {
  // JWT_EXPIRES_IN viene de .env como texto ("12h", "30m"...). Los tipos de
  // jsonwebtoken ≥ 9.0.7 exigen el tipo `StringValue` de la librería `ms`; el
  // valor es el mismo, solo se ajusta el tipo.
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] });
}

/** Verifica firma y expiración, y además que el contenido tenga la forma esperada. */
export function verifyToken(token: string): JwtPayload {
  const decodificado = jwt.verify(token, env.jwtSecret);
  if (typeof decodificado === 'string') throw new Error('Token con formato inválido');
  const { sub, rol } = decodificado as { sub?: unknown; rol?: unknown };
  if (typeof sub !== 'number' || !Number.isSafeInteger(sub)) throw new Error('Token sin usuario válido');
  if (typeof rol !== 'string' || !(ROLES as readonly string[]).includes(rol)) throw new Error('Token sin rol válido');
  return { sub, rol: rol as Rol };
}
