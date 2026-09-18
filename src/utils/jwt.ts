import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Rol } from '../constants/enums';

export interface JwtPayload {
  sub: number;
  rol: Rol;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
