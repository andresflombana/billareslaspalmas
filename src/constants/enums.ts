// Fuente única de verdad para los valores que en un motor como MySQL/PostgreSQL
// serían `enum` a nivel de base de datos. SQLite no soporta enums nativos, así
// que en prisma/schema.prisma esos campos son `String` y se validan aquí, en
// la capa de aplicación. Cualquier validación de entrada (Sprint 1 en adelante)
// debe importar estas listas en vez de escribir los strings sueltos.

export const ROLES = ['ADMINISTRADOR', 'OPERADOR'] as const;
export type Rol = (typeof ROLES)[number];

export const ESTADOS_MESA = ['LIBRE', 'OCUPADA', 'FUERA_SERVICIO', 'RESERVADA'] as const;
export type EstadoMesa = (typeof ESTADOS_MESA)[number];

export const ESTADOS_BARRA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoBarra = (typeof ESTADOS_BARRA)[number];

export const ESTADOS_CUENTA_BARRA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoCuentaBarra = (typeof ESTADOS_CUENTA_BARRA)[number];

// Los tres puntos de caja reales del negocio (HU-36, HU-37).
// Barra liquida dentro de BILLAR: no es un cuarto punto de venta.
export const PUNTOS_VENTA = ['BILLAR', 'VENTA_DIRECTA', 'LICORERA'] as const;
export type PuntoVenta = (typeof PUNTOS_VENTA)[number];

// Dónde se originó la venta, más específico que PuntoVenta.
export const ORIGENES_VENTA = ['MESA', 'BARRA', 'VENTA_DIRECTA', 'LICORERA'] as const;
export type OrigenVenta = (typeof ORIGENES_VENTA)[number];

export const ESTADOS_VENTA = ['ABIERTA', 'CERRADA', 'ANULADA'] as const;
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

export const FORMAS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'FIADO'] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number];

export const TIPOS_MOVIMIENTO_INVENTARIO = ['VENTA', 'OBSEQUIO', 'ENTRADA', 'AJUSTE'] as const;
export type TipoMovimientoInventario = (typeof TIPOS_MOVIMIENTO_INVENTARIO)[number];

export const ESTADOS_CAJA = ['ABIERTA', 'CERRADA'] as const;
export type EstadoCaja = (typeof ESTADOS_CAJA)[number];

export const TIPOS_MOVIMIENTO_CAJA = ['INGRESO', 'EGRESO'] as const;
export type TipoMovimientoCaja = (typeof TIPOS_MOVIMIENTO_CAJA)[number];
