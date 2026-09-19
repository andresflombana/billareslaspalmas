import { prisma, Db, OPCIONES_TRANSACCION } from '../../config/prisma';
import { EstadoBarra } from '../../constants/enums';
import { AccionAuditoria, EntidadAuditoria } from '../../constants/auditoria';
import { conflicto, noEncontrado } from '../../utils/http';
import { Cuerpo, normalizarParaComparar, textoOpcional } from '../../utils/validation';
import { registrarAuditoria } from '../audit/audit.repository';
import { anularVentaSiAbierta, crearVentaDeCuentaBarra, ventaAbiertaDeCuentaBarra } from '../ventas/ventas.repository';
import {
  buscarBarra,
  buscarCuenta,
  cambiarEstadoBarraSi,
  cerrarCuentaSiAbierta,
  contarCuentasAbiertas,
  crearCuenta,
  listarBarras,
} from './bars.repository';
import { BarraDTO, CuentaBarraDTO, aBarraDTO, aCuentaDTO } from './bars.dto';

const MAX_ETIQUETA = 40;

async function barraDTO(db: Db, id: number): Promise<BarraDTO> {
  const barra = await buscarBarra(db, id);
  if (!barra) throw noEncontrado('La barra no existe', 'BARRA_NO_ENCONTRADA');
  return aBarraDTO(barra);
}

async function cuentaDTO(db: Db, id: number): Promise<CuentaBarraDTO> {
  const cuenta = await buscarCuenta(db, id);
  if (!cuenta) throw noEncontrado('La cuenta no existe', 'CUENTA_NO_ENCONTRADA');
  return aCuentaDTO(cuenta);
}

export async function listar(): Promise<BarraDTO[]> {
  return (await listarBarras(prisma)).map(aBarraDTO);
}

// ---------------------------------------------------------------- HU-16: abrir / cerrar cada barra

export async function abrir(usuarioId: number, id: number): Promise<BarraDTO> {
  return prisma.$transaction(async (tx) => {
    const abierta = await cambiarEstadoBarraSi(tx, id, EstadoBarra.CERRADA, EstadoBarra.ABIERTA);
    if (!abierta) {
      const barra = await buscarBarra(tx, id);
      if (!barra) throw noEncontrado('La barra no existe', 'BARRA_NO_ENCONTRADA');
      throw conflicto(`${barra.nombre} ya está abierta`, 'BARRA_YA_ABIERTA');
    }
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.BARRA,
      entidadId: id,
      accion: AccionAuditoria.BARRA_ABIERTA,
    });
    return barraDTO(tx, id);
  }, OPCIONES_TRANSACCION);
}

export async function cerrar(usuarioId: number, id: number): Promise<BarraDTO> {
  return prisma.$transaction(async (tx) => {
    const barra = await buscarBarra(tx, id);
    if (!barra) throw noEncontrado('La barra no existe', 'BARRA_NO_ENCONTRADA');
    if (barra.estado === EstadoBarra.CERRADA) throw conflicto(`${barra.nombre} ya está cerrada`, 'BARRA_YA_CERRADA');
    const abiertas = await contarCuentasAbiertas(tx, id);
    if (abiertas > 0) {
      throw conflicto(
        `${barra.nombre} tiene ${abiertas} ${abiertas === 1 ? 'cuenta abierta' : 'cuentas abiertas'}: ciérralas antes de cerrar la barra`,
        'BARRA_CON_CUENTAS_ABIERTAS',
      );
    }
    const cerrada = await cambiarEstadoBarraSi(tx, id, EstadoBarra.ABIERTA, EstadoBarra.CERRADA);
    if (!cerrada) throw conflicto(`${barra.nombre} ya está cerrada`, 'BARRA_YA_CERRADA');
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.BARRA,
      entidadId: id,
      accion: AccionAuditoria.BARRA_CERRADA,
    });
    return barraDTO(tx, id);
  }, OPCIONES_TRANSACCION);
}

// ---------------------------------------------------------------- HU-17: varias cuentas por barra

/** "Cuenta N" con el menor N libre entre las cuentas abiertas de esa barra. */
export function siguienteEtiquetaAutomatica(etiquetasAbiertas: string[]): string {
  const usados = new Set<number>();
  for (const etiqueta of etiquetasAbiertas) {
    const m = /^cuenta (\d+)$/.exec(normalizarParaComparar(etiqueta));
    if (m) usados.add(Number(m[1]));
  }
  let n = 1;
  while (usados.has(n)) n += 1;
  return `Cuenta ${n}`;
}

/**
 * Abre una cuenta nueva dentro de una barra ABIERTA. Cada cuenta nace con su
 * propia Venta ABIERTA (origen BARRA, caja BILLAR), igual que una mesa: en
 * Sprint 3 los consumos se agregan a esa venta.
 */
export async function abrirCuenta(usuarioId: number, barraId: number, cuerpo: Cuerpo): Promise<CuentaBarraDTO> {
  const etiquetaIndicada = textoOpcional(cuerpo, 'etiqueta', 'El nombre de la cuenta', { max: MAX_ETIQUETA });

  return prisma.$transaction(async (tx) => {
    const barra = await buscarBarra(tx, barraId);
    if (!barra) throw noEncontrado('La barra no existe', 'BARRA_NO_ENCONTRADA');
    if (barra.estado !== EstadoBarra.ABIERTA) {
      throw conflicto(`${barra.nombre} está cerrada: ábrela antes de crear cuentas`, 'BARRA_CERRADA');
    }
    const etiquetasAbiertas = barra.cuentas.map((c) => c.etiqueta ?? `Cuenta ${c.id}`);
    let etiqueta: string;
    if (etiquetaIndicada) {
      const buscada = normalizarParaComparar(etiquetaIndicada);
      if (etiquetasAbiertas.some((e) => normalizarParaComparar(e) === buscada)) {
        throw conflicto(`Ya hay una cuenta abierta llamada "${etiquetaIndicada}" en ${barra.nombre}`, 'CUENTA_DUPLICADA');
      }
      etiqueta = etiquetaIndicada;
    } else {
      etiqueta = siguienteEtiquetaAutomatica(etiquetasAbiertas);
    }

    const abiertaEn = new Date();
    const cuenta = await crearCuenta(tx, { barraId, etiqueta, abiertaEn });
    const venta = await crearVentaDeCuentaBarra(tx, { cuentaBarraId: cuenta.id, usuarioId, fechaApertura: abiertaEn });
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.CUENTA_BARRA,
      entidadId: cuenta.id,
      accion: AccionAuditoria.CUENTA_BARRA_ABIERTA,
      detalle: { barraId, etiqueta, ventaId: venta.id },
    });
    return cuentaDTO(tx, cuenta.id);
  }, OPCIONES_TRANSACCION);
}

/**
 * Cancela una cuenta abierta por error. Solo si está vacía: una cuenta con
 * consumos (Sprint 3) se cierra cobrándola (Sprint 5), nunca se cancela.
 */
export async function cancelarCuenta(usuarioId: number, cuentaId: number): Promise<CuentaBarraDTO> {
  return prisma.$transaction(async (tx) => {
    const cuenta = await buscarCuenta(tx, cuentaId);
    if (!cuenta) throw noEncontrado('La cuenta no existe', 'CUENTA_NO_ENCONTRADA');
    const venta = await ventaAbiertaDeCuentaBarra(tx, cuentaId);
    const nombre = cuenta.etiqueta ?? `Cuenta ${cuenta.id}`;

    const ahora = new Date();
    const cerrada = await cerrarCuentaSiAbierta(tx, cuentaId, ahora);
    if (!cerrada) throw conflicto(`${nombre} ya estaba cerrada`, 'CUENTA_YA_CERRADA');
    if (venta && venta._count.items > 0) {
      throw conflicto(`${nombre} tiene consumos registrados: debe cobrarse, no cancelarse`, 'CUENTA_CON_CONSUMOS');
    }
    if (venta) await anularVentaSiAbierta(tx, venta.id, ahora);
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.CUENTA_BARRA,
      entidadId: cuentaId,
      accion: AccionAuditoria.CUENTA_BARRA_CANCELADA,
      detalle: { barraId: cuenta.barraId, etiqueta: nombre, ventaId: venta?.id ?? null },
    });
    return cuentaDTO(tx, cuentaId);
  }, OPCIONES_TRANSACCION);
}
