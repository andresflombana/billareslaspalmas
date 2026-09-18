import { prisma } from '../../config/prisma';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';

export class CredencialesInvalidasError extends Error {}
export class UsuarioInactivoError extends Error {}

// HU-01 — Como Operador, quiero iniciar sesión con correo y contraseña
// para acceder solo a las funciones de mi rol.
export async function login(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) throw new CredencialesInvalidasError();

  const passwordValido = await comparePassword(password, usuario.passwordHash);
  if (!passwordValido) throw new CredencialesInvalidasError();

  if (!usuario.activo) throw new UsuarioInactivoError();

  const token = signToken({ sub: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}
