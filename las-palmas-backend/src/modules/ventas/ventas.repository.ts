import { Db } from '../../config/prisma';
import { EstadoVenta, OrigenVenta, PuntoVenta } from '../../constants/enums';

// Acceso a Venta compartido por Mesas y Barra. En Sprint 1 solo se crean y
// anulan ventas vacías: agregar productos (Sprint 3) y cobrar (Sprint 5) vienen después.

interface NuevaVentaMesa {
  mesaId: number;
  usuarioId: number;
  tarifaPorMinutoAplicada: number;
  fechaApertura: Date;
}

/** Venta de una sesión de mesa. Congela la tarifa vigente al abrir (RN-02). */
export function crearVentaDeMesa(db: Db, datos: NuevaVentaMesa) {
  return db.venta.create({
    data: {
      origen: OrigenVenta.MESA,
      puntoVenta: PuntoVenta.BILLAR,
      mesaId: datos.mesaId,
      usuarioId: datos.usuarioId,
      estado: EstadoVenta.ABIERTA,
      tarifaPorMinutoAplicada: datos.tarifaPorMinutoAplicada,
      fechaApertura: datos.fechaApertura,
    },
  });
}

interface NuevaVentaCuentaBarra {
  cuentaBarraId: number;
  usuarioId: number;
  fechaApertura: Date;
}

/** Venta de una cuenta de barra. La Barra liquida dentro de la caja de BILLAR. */
export function crearVentaDeCuentaBarra(db: Db, datos: NuevaVentaCuentaBarra) {
  return db.venta.create({
    data: {
      origen: OrigenVenta.BARRA,
      puntoVenta: PuntoVenta.BILLAR,
      cuentaBarraId: datos.cuentaBarraId,
      usuarioId: datos.usuarioId,
      estado: EstadoVenta.ABIERTA,
      fechaApertura: datos.fechaApertura,
    },
  });
}

export function ventaAbiertaDeMesa(db: Db, mesaId: number) {
  return db.venta.findFirst({
    where: { mesaId, origen: OrigenVenta.MESA, estado: EstadoVenta.ABIERTA },
    orderBy: { fechaApertura: 'desc' },
    select: { id: true, fechaApertura: true, _count: { select: { items: true } } },
  });
}

export function ventaAbiertaDeCuentaBarra(db: Db, cuentaBarraId: number) {
  return db.venta.findFirst({
    where: { cuentaBarraId, origen: OrigenVenta.BARRA, estado: EstadoVenta.ABIERTA },
    orderBy: { fechaApertura: 'desc' },
    select: { id: true, fechaApertura: true, _count: { select: { items: true } } },
  });
}

/** Anula una venta solo si sigue ABIERTA. Devuelve cuántas filas cambió (0 o 1). */
export async function anularVentaSiAbierta(db: Db, ventaId: number, fecha: Date): Promise<number> {
  const r = await db.venta.updateMany({
    where: { id: ventaId, estado: EstadoVenta.ABIERTA },
    data: { estado: EstadoVenta.ANULADA, fechaCierre: fecha },
  });
  return r.count;
}
