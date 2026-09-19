import { prisma } from '../../config/prisma';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { ROLES, Rol, comoEnum } from '../../constants/enums';

export class CredencialesInvalidasError extends Error {}
export class UsuarioInactivoError extends Error {}

// El campo `rol` es un String plano en SQLite: se valida al leerlo.
function asRol(valor: string): Rol {
  return comoEnum(ROLES, valor, 'Rol');
}

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// HU-01 — Como Operador, quiero iniciar sesión con correo y contraseña
// para acceder solo a las funciones de mi rol.
export async function login(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!usuario) throw new CredencialesInvalidasError();

  const passwordValido = await comparePassword(password, usuario.passwordHash);
  if (!passwordValido) throw new CredencialesInvalidasError();

  if (!usuario.activo) throw new UsuarioInactivoError();

  const rol = asRol(usuario.rol);
  const token = signToken({ sub: usuario.id, rol });

  const datos: UsuarioSesion = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol };
  return { token, usuario: datos };
}

// HU-01 ("la sesión persiste al refrescar"): el frontend guarda el token y, al
// recargar, pregunta quién es. Se consulta la base de datos (no solo el token)
// para que un usuario desactivado no pueda seguir entrando con un token viejo.
export async function me(usuarioId: number): Promise<UsuarioSesion | null> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.activo) return null;
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: asRol(usuario.rol) };
}
