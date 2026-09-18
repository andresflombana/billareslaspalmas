import { prisma } from '../../config/prisma';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { ROLES, Rol } from '../../constants/enums';

export class CredencialesInvalidasError extends Error {}
export class UsuarioInactivoError extends Error {}

// Antes esto lo garantizaba el enum de la base de datos. Con SQLite el campo
// `rol` es un String plano, así que la validación se hace aquí al leerlo.
function asRol(valor: string): Rol {
  if (!(ROLES as readonly string[]).includes(valor)) {
    throw new Error(`Rol inválido en base de datos: "${valor}"`);
  }
  return valor as Rol;
}

// HU-01 — Como Operador, quiero iniciar sesión con correo y contraseña
// para acceder solo a las funciones de mi rol.
export async function login(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) throw new CredencialesInvalidasError();

  const passwordValido = await comparePassword(password, usuario.passwordHash);
  if (!passwordValido) throw new CredencialesInvalidasError();

  if (!usuario.activo) throw new UsuarioInactivoError();

  const rol = asRol(usuario.rol);
  const token = signToken({ sub: usuario.id, rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol,
    },
  };
}
