import { Prisma } from '@prisma/client';
import { Db } from '../../config/prisma';
import { EstadoBarra, EstadoCuentaBarra, EstadoVenta, OrigenVenta } from '../../constants/enums';

// La venta ABIERTA de una cuenta: quién la abrió y cuántos consumos tiene (Sprint 3 los agrega).
const incluirVentaAbierta = {
  ventas: {
    where: { estado: EstadoVenta.ABIERTA, origen: OrigenVenta.BARRA },
    orderBy: { fechaApertura: 'desc' },
    take: 1,
    select: {
      id: true,
      usuario: { select: { id: true, nombre: true } },
      _count: { select: { items: true } },
    },
  },
} satisfies Prisma.CuentaBarraInclude;

export type CuentaConVenta = Prisma.CuentaBarraGetPayload<{ include: typeof incluirVentaAbierta }>;

const incluirCuentasAbiertas = {
  cuentas: {
    where: { estado: EstadoCuentaBarra.ABIERTA },
    orderBy: [{ abiertaEn: 'asc' }, { id: 'asc' }],
    include: incluirVentaAbierta,
  },
} satisfies Prisma.BarraInclude;

export type BarraConCuentas = Prisma.BarraGetPayload<{ include: typeof incluirCuentasAbiertas }>;

export function listarBarras(db: Db): Promise<BarraConCuentas[]> {
  return db.barra.findMany({ orderBy: { id: 'asc' }, include: incluirCuentasAbiertas });
}

export function buscarBarra(db: Db, id: number): Promise<BarraConCuentas | null> {
  return db.barra.findUnique({ where: { id }, include: incluirCuentasAbiertas });
}

/** HU-16. Cambia el estado de UNA barra, solo desde el estado esperado. Nunca toca la otra. */
export async function cambiarEstadoBarraSi(db: Db, id: number, desde: EstadoBarra, hacia: EstadoBarra): Promise<boolean> {
  const r = await db.barra.updateMany({ where: { id, estado: desde }, data: { estado: hacia } });
  return r.count === 1;
}

export function contarCuentasAbiertas(db: Db, barraId: number): Promise<number> {
  return db.cuentaBarra.count({ where: { barraId, estado: EstadoCuentaBarra.ABIERTA } });
}

export function crearCuenta(db: Db, datos: { barraId: number; etiqueta: string; abiertaEn: Date }) {
  return db.cuentaBarra.create({
    data: { barraId: datos.barraId, etiqueta: datos.etiqueta, estado: EstadoCuentaBarra.ABIERTA, abiertaEn: datos.abiertaEn },
  });
}

export function buscarCuenta(db: Db, id: number): Promise<CuentaConVenta | null> {
  return db.cuentaBarra.findUnique({ where: { id }, include: incluirVentaAbierta });
}

/** Cierra la cuenta solo si sigue ABIERTA (evita doble cierre desde dos equipos). */
export async function cerrarCuentaSiAbierta(db: Db, id: number, cerradaEn: Date): Promise<boolean> {
  const r = await db.cuentaBarra.updateMany({
    where: { id, estado: EstadoCuentaBarra.ABIERTA },
    data: { estado: EstadoCuentaBarra.CERRADA, cerradaEn },
  });
  return r.count === 1;
}
