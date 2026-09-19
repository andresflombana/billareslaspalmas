// Fuente única de verdad para los valores que en un motor como MySQL/PostgreSQL
// serían `enum` a nivel de base de datos. SQLite no soporta enums nativos, así
// que en prisma/schema.prisma esos campos son `String` y se validan aquí, en
// la capa de aplicación. Cualquier validación de entrada debe importar estas
// listas en vez de escribir los strings sueltos.
//
// Patrón (desde Sprint 1): cada enum tiene
//   - la lista      → ESTADOS_MESA         (para validar entradas)
//   - el tipo       → EstadoMesa           (para tipar)
//   - las constantes → EstadoMesa.LIBRE    (para usar en código sin strings sueltos)
// El `satisfies` obliga a que el objeto de constantes tenga exactamente los
// valores de la lista: si se agrega un valor a la lista y no al objeto, no compila.

export const ROLES = ['ADMINISTRADOR', 'OPERADOR'] as const;
export type Rol = (typeof ROLES)[number];
export const Rol = { ADMINISTRADOR: 'ADMINISTRADOR', OPERADOR: 'OPERADOR' } as const satisfies { [K in Rol]: K };

export const ESTADOS_MESA = ['LIBRE', 'OCUPADA', 'FUERA_SERVICIO', 'RESERVADA'] as const;
export type EstadoMesa = (typeof ESTADOS_MESA)[number];
export const EstadoMesa = {
  LIBRE: 'LIBRE',
  OCUPADA: 'OCUPADA',
  FUERA_SERVICIO: 'FUERA_SERVICIO',
  RESERVADA: 'RESERVADA', // reservado en el modelo; ningún sprint planificado lo usa todavía
} as const satisfies { [K in EstadoMesa]: K };

// Estados que el Administrador puede fijar a mano con PATCH /tables/:id/status
// (HU-08). OCUPADA solo se alcanza abriendo la mesa (HU-07), nunca a mano.
export const ESTADOS_MESA_MANUALES = [EstadoMesa.LIBRE, EstadoMesa.FUERA_SERVICIO] as const;
export type EstadoMesaManual = (typeof ESTADOS_MESA_MANUALES)[number];

export const ESTADOS_BARRA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoBarra = (typeof ESTADOS_BARRA)[number];
export const EstadoBarra = { ABIERTA: 'ABIERTA', CERRADA: 'CERRADA' } as const satisfies { [K in EstadoBarra]: K };

export const ESTADOS_CUENTA_BARRA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoCuentaBarra = (typeof ESTADOS_CUENTA_BARRA)[number];
export const EstadoCuentaBarra = { ABIERTA: 'ABIERTA', CERRADA: 'CERRADA' } as const satisfies {
  [K in EstadoCuentaBarra]: K;
};

// Los tres puntos de caja reales del negocio (HU-36, HU-37).
// Barra liquida dentro de BILLAR: no es un cuarto punto de venta.
export const PUNTOS_VENTA = ['BILLAR', 'VENTA_DIRECTA', 'LICORERA'] as const;
export type PuntoVenta = (typeof PUNTOS_VENTA)[number];
export const PuntoVenta = {
  BILLAR: 'BILLAR',
  VENTA_DIRECTA: 'VENTA_DIRECTA',
  LICORERA: 'LICORERA',
} as const satisfies { [K in PuntoVenta]: K };

// Dónde se originó la venta, más específico que PuntoVenta.
export const ORIGENES_VENTA = ['MESA', 'BARRA', 'VENTA_DIRECTA', 'LICORERA'] as const;
export type OrigenVenta = (typeof ORIGENES_VENTA)[number];
export const OrigenVenta = {
  MESA: 'MESA',
  BARRA: 'BARRA',
  VENTA_DIRECTA: 'VENTA_DIRECTA',
  LICORERA: 'LICORERA',
} as const satisfies { [K in OrigenVenta]: K };

// ABIERTA cumple el papel del "BORRADOR" descrito en PERSISTENCIA Y RECUPERACIÓN:
// la venta existe y se persiste desde que se abre la mesa o la cuenta de barra.
export const ESTADOS_VENTA = ['ABIERTA', 'CERRADA', 'ANULADA'] as const;
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];
export const EstadoVenta = { ABIERTA: 'ABIERTA', CERRADA: 'CERRADA', ANULADA: 'ANULADA' } as const satisfies {
  [K in EstadoVenta]: K;
};

export const FORMAS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'FIADO'] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const TIPOS_MOVIMIENTO_INVENTARIO = ['VENTA', 'OBSEQUIO', 'ENTRADA', 'AJUSTE'] as const;
export type TipoMovimientoInventario = (typeof TIPOS_MOVIMIENTO_INVENTARIO)[number];

export const ESTADOS_CAJA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoCaja = (typeof ESTADOS_CAJA)[number];

export const TIPOS_MOVIMIENTO_CAJA = ['INGRESO', 'EGRESO'] as const;
export type TipoMovimientoCaja = (typeof TIPOS_MOVIMIENTO_CAJA)[number];

/** Convierte un string leído de la base de datos al tipo del enum, o falla ruidosamente. */
export function comoEnum<T extends string>(lista: readonly T[], valor: string, nombreEnum: string): T {
  if (!(lista as readonly string[]).includes(valor)) {
    throw new Error(`Valor inválido para ${nombreEnum} en base de datos: "${valor}"`);
  }
  return valor as T;
}
