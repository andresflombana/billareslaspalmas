import http from 'node:http';
import { AddressInfo } from 'node:net';
import { app } from '../src/app';
import { prisma, walListo } from '../src/config/prisma';
import { hashPassword } from '../src/utils/hash';

// Utilidades de las pruebas: levantan la API real (Express + Prisma + SQLite de
// prueba) en un puerto libre y la llaman por HTTP, igual que lo hará el frontend.

export interface Respuesta<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

let servidor: http.Server | null = null;
let base = '';

export const tokens = { admin: '', operador: '', inactivoLuego: '' };

export async function api<T = any>(
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  ruta: string,
  opciones: { token?: string; cuerpo?: unknown; cuerpoCrudo?: string } = {},
): Promise<Respuesta<T>> {
  const headers: Record<string, string> = {};
  if (opciones.token) headers.Authorization = `Bearer ${opciones.token}`;
  let body: string | undefined;
  if (opciones.cuerpoCrudo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = opciones.cuerpoCrudo;
  } else if (opciones.cuerpo !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opciones.cuerpo);
  }
  const r = await fetch(`${base}${ruta}`, { method: metodo, headers, body });
  const texto = await r.text();
  let json: unknown = null;
  try {
    json = texto ? JSON.parse(texto) : null;
  } catch {
    json = texto;
  }
  return { status: r.status, body: json as T, headers: r.headers };
}

async function login(email: string, password: string): Promise<string> {
  const r = await api('POST', '/auth/login', { cuerpo: { email, password } });
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión como ${email}: ${JSON.stringify(r.body)}`);
  return r.body.token as string;
}

/** Datos base mínimos, creados directamente en la base de prueba (vacía, recién migrada). */
export async function prepararEntorno() {
  await walListo;
  const [hAdmin, hOperador] = await Promise.all([hashPassword('admin-prueba'), hashPassword('operador-prueba')]);
  await prisma.usuario.create({
    data: { nombre: 'Admin Prueba', email: 'admin@prueba.com', passwordHash: hAdmin, rol: 'ADMINISTRADOR' },
  });
  await prisma.usuario.create({
    data: { nombre: 'Operador Prueba', email: 'operador@prueba.com', passwordHash: hOperador, rol: 'OPERADOR' },
  });
  await prisma.usuario.create({
    data: { nombre: 'Inactivo', email: 'inactivo@prueba.com', passwordHash: hOperador, rol: 'OPERADOR', activo: false },
  });
  await prisma.usuario.create({
    data: { nombre: 'Se desactiva', email: 'luego@prueba.com', passwordHash: hOperador, rol: 'OPERADOR' },
  });
  await prisma.configuracionNegocio.create({
    data: { id: 1, nombreNegocio: 'Las Palmas (prueba)', tarifaPorMinutoDefault: 134 },
  });
  await prisma.barra.create({ data: { nombre: 'Barra 1' } });
  await prisma.barra.create({ data: { nombre: 'Barra 2' } });
  for (let n = 1; n <= 6; n += 1) {
    await prisma.mesa.create({ data: { nombre: `Mesa ${n}`, zona: 'Salón principal', tarifaPorMinuto: 134 } });
  }

  servidor = http.createServer(app);
  await new Promise<void>((resolve) => servidor!.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;

  tokens.admin = await login('admin@prueba.com', 'admin-prueba');
  tokens.operador = await login('operador@prueba.com', 'operador-prueba');
  tokens.inactivoLuego = await login('luego@prueba.com', 'operador-prueba');
}

export async function cerrarEntorno() {
  if (servidor) {
    servidor.closeAllConnections();
    await new Promise<void>((resolve) => servidor!.close(() => resolve()));
  }
  await prisma.$disconnect();
}

export async function idMesa(nombre: string): Promise<number> {
  const mesa = await prisma.mesa.findUniqueOrThrow({ where: { nombre } });
  return mesa.id;
}

export async function idBarra(nombre: string): Promise<number> {
  const barra = await prisma.barra.findUniqueOrThrow({ where: { nombre } });
  return barra.id;
}

/** Simula un consumo (lo que hará Sprint 3) para probar las guardas "con consumos". */
export async function agregarConsumoDirecto(ventaId: number) {
  const producto = await prisma.producto.upsert({
    where: { sku: 'PRUEBA-001' },
    update: {},
    create: { nombre: 'Producto de prueba', sku: 'PRUEBA-001', categoria: 'Prueba', precioInterno: 5000, precioExterno: 6000 },
  });
  await prisma.itemVenta.create({ data: { ventaId, productoId: producto.id, cantidad: 1, precioUnitario: 5000 } });
}

export { prisma };
