import { Prisma } from '@prisma/client';
import { Db } from '../../config/prisma';
import { EstadoMesa, EstadoVenta, OrigenVenta } from '../../constants/enums';

// Datos de la sesión en curso (la Venta ABIERTA de la mesa) que acompañan a cada mesa.
export const incluirSesion = {
  ventas: {
    where: { estado: EstadoVenta.ABIERTA, origen: OrigenVenta.MESA },
    orderBy: { fechaApertura: 'desc' },
    take: 1,
    select: {
      id: true,
      tarifaPorMinutoAplicada: true,
      usuario: { select: { id: true, nombre: true } },
    },
  },
} satisfies Prisma.MesaInclude;

export type MesaConSesion = Prisma.MesaGetPayload<{ include: typeof incluirSesion }>;

export function listarMesas(db: Db, { incluirInactivas }: { incluirInactivas: boolean }): Promise<MesaConSesion[]> {
  return db.mesa.findMany({
    where: incluirInactivas ? undefined : { activa: true },
    include: incluirSesion,
  });
}

export function buscarMesa(db: Db, id: number): Promise<MesaConSesion | null> {
  return db.mesa.findUnique({ where: { id }, include: incluirSesion });
}

export function nombresDeMesas(db: Db) {
  return db.mesa.findMany({ select: { id: true, nombre: true } });
}

export function crearMesa(db: Db, datos: { nombre: string; zona: string; tarifaPorMinuto: number }) {
  return db.mesa.create({ data: { ...datos, estado: EstadoMesa.LIBRE, activa: true } });
}

export function actualizarMesa(db: Db, id: number, datos: { nombre: string; zona: string; tarifaPorMinuto: number }) {
  return db.mesa.update({ where: { id }, data: datos });
}

/**
 * HU-07. Pasa a OCUPADA solo si en este instante está LIBRE y activa. Es una
 * única sentencia UPDATE ... WHERE estado = 'LIBRE': si dos equipos abren la
 * misma mesa a la vez, solo uno la cambia (count = 1) y el otro recibe count = 0.
 */
export async function ocuparSiLibre(db: Db, id: number, startedAt: Date): Promise<boolean> {
  const r = await db.mesa.updateMany({
    where: { id, estado: EstadoMesa.LIBRE, activa: true },
    data: { estado: EstadoMesa.OCUPADA, startedAt },
  });
  return r.count === 1;
}

/** Libera una mesa OCUPADA (anular apertura). Condicional por la misma razón que ocuparSiLibre. */
export async function liberarSiOcupada(db: Db, id: number): Promise<boolean> {
  const r = await db.mesa.updateMany({
    where: { id, estado: EstadoMesa.OCUPADA },
    data: { estado: EstadoMesa.LIBRE, startedAt: null },
  });
  return r.count === 1;
}

/** HU-08 y su inverso: cambio manual LIBRE ↔ FUERA_SERVICIO, solo desde el estado esperado. */
export async function cambiarEstadoSi(db: Db, id: number, desde: EstadoMesa, hacia: EstadoMesa): Promise<boolean> {
  const r = await db.mesa.updateMany({
    where: { id, estado: desde, activa: true },
    data: { estado: hacia },
  });
  return r.count === 1;
}

/** Baja lógica: nunca sobre una mesa en juego. Alta: solo si estaba dada de baja. */
export async function cambiarActiva(db: Db, id: number, activa: boolean): Promise<boolean> {
  const r = await db.mesa.updateMany({
    where: activa ? { id, activa: false } : { id, activa: true, estado: { not: EstadoMesa.OCUPADA } },
    data: { activa },
  });
  return r.count === 1;
}

export async function tarifaPorDefecto(db: Db): Promise<number | null> {
  const config = await db.configuracionNegocio.findUnique({ where: { id: 1 }, select: { tarifaPorMinutoDefault: true } });
  return config?.tarifaPorMinutoDefault ?? null;
}
