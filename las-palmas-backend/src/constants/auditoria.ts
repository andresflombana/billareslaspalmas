// Entidades y acciones que se registran en AuditLog (HU-42, RF-30, RNF-08).
// Igual que enums.ts: nunca escribir estos strings sueltos en un servicio.

export const EntidadAuditoria = {
  MESA: 'Mesa',
  BARRA: 'Barra',
  CUENTA_BARRA: 'CuentaBarra',
} as const;
export type EntidadAuditoria = (typeof EntidadAuditoria)[keyof typeof EntidadAuditoria];

export const AccionAuditoria = {
  // Mesas — Sprint 1
  MESA_CREADA: 'MESA_CREADA',
  MESA_EDITADA: 'MESA_EDITADA',
  MESA_ABIERTA: 'MESA_ABIERTA', // HU-07
  MESA_APERTURA_ANULADA: 'MESA_APERTURA_ANULADA',
  MESA_FUERA_SERVICIO: 'MESA_FUERA_SERVICIO',
  MESA_REACTIVADA: 'MESA_REACTIVADA', // HU-08
  MESA_DADA_DE_BAJA: 'MESA_DADA_DE_BAJA',
  MESA_DADA_DE_ALTA: 'MESA_DADA_DE_ALTA',
  // Barra — Sprint 1
  BARRA_ABIERTA: 'BARRA_ABIERTA', // HU-16
  BARRA_CERRADA: 'BARRA_CERRADA', // HU-16
  CUENTA_BARRA_ABIERTA: 'CUENTA_BARRA_ABIERTA', // HU-17
  CUENTA_BARRA_CANCELADA: 'CUENTA_BARRA_CANCELADA',
} as const;
export type AccionAuditoria = (typeof AccionAuditoria)[keyof typeof AccionAuditoria];
