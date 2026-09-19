// Contrato de la API (espejo de los DTO del backend: src/modules/*/*.dto.ts).
// Los valores de los "enum" son los mismos strings que valida el backend en
// src/constants/enums.ts. Si cambian allá, se cambian aquí.

export type RolApi = 'ADMINISTRADOR' | 'OPERADOR';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: RolApi;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

export type EstadoMesa = 'LIBRE' | 'OCUPADA' | 'FUERA_SERVICIO' | 'RESERVADA';

export interface Mesa {
  id: number;
  nombre: string;
  zona: string;
  estado: EstadoMesa;
  tarifaPorMinuto: number;
  activa: boolean;
  /** ISO-8601 según el reloj del servidor. Fuente de verdad del cronómetro (Sprint 2). */
  startedAt: string | null;
  observaciones: string | null;
  sesion: {
    ventaId: number;
    /** Tarifa congelada al abrir (RN-02). */
    tarifaAplicada: number;
    abiertaPor: { id: number; nombre: string };
  } | null;
  motivoFueraServicio: string | null;
  updatedAt: string;
}

export type EstadoBarra = 'ABIERTA' | 'CERRADA';
export type EstadoCuentaBarra = 'ABIERTA' | 'CERRADA';

export interface CuentaBarra {
  id: number;
  barraId: number;
  etiqueta: string;
  estado: EstadoCuentaBarra;
  abiertaEn: string;
  cerradaEn: string | null;
  ventaId: number | null;
  abiertaPor: { id: number; nombre: string } | null;
  cantidadItems: number;
}

export interface Barra {
  id: number;
  nombre: string;
  estado: EstadoBarra;
  cuentas: CuentaBarra[];
}

/** Límites de validación: los mismos que aplica el backend. */
export const LIMITES = {
  nombreMesa: 40,
  zona: 40,
  tarifa: { min: 1, max: 100_000 },
  motivo: { min: 3, max: 200 },
  etiquetaCuenta: 40,
} as const;
