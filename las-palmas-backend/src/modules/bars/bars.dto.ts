import {
  ESTADOS_BARRA,
  ESTADOS_CUENTA_BARRA,
  EstadoBarra,
  EstadoCuentaBarra,
  comoEnum,
} from '../../constants/enums';
import { BarraConCuentas, CuentaConVenta } from './bars.repository';

export interface CuentaBarraDTO {
  id: number;
  barraId: number;
  etiqueta: string;
  estado: EstadoCuentaBarra;
  abiertaEn: string;
  cerradaEn: string | null;
  /** Venta ABIERTA que acumula los consumos de la cuenta (Sprint 3). */
  ventaId: number | null;
  abiertaPor: { id: number; nombre: string } | null;
  cantidadItems: number;
}

export interface BarraDTO {
  id: number;
  nombre: string;
  estado: EstadoBarra;
  /** Solo las cuentas ABIERTAS, de la más antigua a la más reciente (HU-17). */
  cuentas: CuentaBarraDTO[];
}

export function aCuentaDTO(cuenta: CuentaConVenta): CuentaBarraDTO {
  const venta = cuenta.ventas[0];
  return {
    id: cuenta.id,
    barraId: cuenta.barraId,
    etiqueta: cuenta.etiqueta ?? `Cuenta ${cuenta.id}`,
    estado: comoEnum(ESTADOS_CUENTA_BARRA, cuenta.estado, 'EstadoCuentaBarra'),
    abiertaEn: cuenta.abiertaEn.toISOString(),
    cerradaEn: cuenta.cerradaEn ? cuenta.cerradaEn.toISOString() : null,
    ventaId: venta?.id ?? null,
    abiertaPor: venta ? { id: venta.usuario.id, nombre: venta.usuario.nombre } : null,
    cantidadItems: venta?._count.items ?? 0,
  };
}

export function aBarraDTO(barra: BarraConCuentas): BarraDTO {
  return {
    id: barra.id,
    nombre: barra.nombre,
    estado: comoEnum(ESTADOS_BARRA, barra.estado, 'EstadoBarra'),
    cuentas: barra.cuentas.map(aCuentaDTO),
  };
}
