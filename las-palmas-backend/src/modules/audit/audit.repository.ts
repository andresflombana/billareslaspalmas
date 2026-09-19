import { Db } from '../../config/prisma';
import { AccionAuditoria, EntidadAuditoria } from '../../constants/auditoria';

export interface RegistroAuditoria {
  usuarioId: number;
  entidad: EntidadAuditoria;
  entidadId: number;
  accion: AccionAuditoria;
  /** Se guarda como JSON serializado a mano: SQLite no soporta el tipo Json de Prisma. */
  detalle?: Record<string, unknown>;
}

// Siempre se llama con el cliente de la transacción (`tx`) de la operación que
// audita: si la operación hace ROLLBACK, el registro de auditoría también.
export function registrarAuditoria(db: Db, registro: RegistroAuditoria) {
  return db.auditLog.create({
    data: {
      usuarioId: registro.usuarioId,
      entidad: registro.entidad,
      entidadId: registro.entidadId,
      accion: registro.accion,
      detalle: registro.detalle ? JSON.stringify(registro.detalle) : null,
    },
  });
}

/** Último registro de una acción para varias entidades (p. ej. motivo del último "fuera de servicio"). */
export async function ultimaAccionPorEntidad(
  db: Db,
  entidad: EntidadAuditoria,
  accion: AccionAuditoria,
  entidadIds: number[],
): Promise<Map<number, { detalle: Record<string, unknown> | null; fecha: Date }>> {
  const resultado = new Map<number, { detalle: Record<string, unknown> | null; fecha: Date }>();
  if (entidadIds.length === 0) return resultado;
  const registros = await db.auditLog.findMany({
    where: { entidad, accion, entidadId: { in: entidadIds } },
    orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    select: { entidadId: true, detalle: true, fecha: true },
  });
  for (const r of registros) {
    if (resultado.has(r.entidadId)) continue; // ya tenemos el más reciente
    resultado.set(r.entidadId, { detalle: parsearDetalle(r.detalle), fecha: r.fecha });
  }
  return resultado;
}

function parsearDetalle(detalle: string | null): Record<string, unknown> | null {
  if (!detalle) return null;
  try {
    const valor: unknown = JSON.parse(detalle);
    return valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
