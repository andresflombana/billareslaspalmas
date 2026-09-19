import { ESTADOS_MESA, EstadoMesa, comoEnum } from '../../constants/enums';
import { MesaConSesion } from './tables.repository';

// Forma pública de una mesa en la API. Las fechas viajan como ISO-8601 (UTC).
export interface MesaDTO {
  id: number;
  nombre: string;
  zona: string;
  estado: EstadoMesa;
  tarifaPorMinuto: number;
  activa: boolean;
  /** Instante de apertura según el reloj del SERVIDOR. Fuente de verdad del cronómetro (Sprint 2). */
  startedAt: string | null;
  observaciones: string | null;
  /** Sesión en curso: solo existe mientras la mesa está OCUPADA. */
  sesion: {
    ventaId: number;
    /** Tarifa congelada al abrir (RN-02): cambiar la tarifa de la mesa no la altera. */
    tarifaAplicada: number;
    abiertaPor: { id: number; nombre: string };
  } | null;
  /** Motivo registrado la última vez que se puso fuera de servicio (solo si lo está). */
  motivoFueraServicio: string | null;
  updatedAt: string;
}

export function aMesaDTO(mesa: MesaConSesion, motivoFueraServicio: string | null = null): MesaDTO {
  const estado = comoEnum(ESTADOS_MESA, mesa.estado, 'EstadoMesa');
  const venta = estado === EstadoMesa.OCUPADA ? mesa.ventas[0] : undefined;
  return {
    id: mesa.id,
    nombre: mesa.nombre,
    zona: mesa.zona,
    estado,
    tarifaPorMinuto: mesa.tarifaPorMinuto,
    activa: mesa.activa,
    startedAt: mesa.startedAt ? mesa.startedAt.toISOString() : null,
    observaciones: mesa.observaciones,
    sesion: venta
      ? {
          ventaId: venta.id,
          tarifaAplicada: venta.tarifaPorMinutoAplicada ?? mesa.tarifaPorMinuto,
          abiertaPor: { id: venta.usuario.id, nombre: venta.usuario.nombre },
        }
      : null,
    motivoFueraServicio: estado === EstadoMesa.FUERA_SERVICIO ? motivoFueraServicio : null,
    updatedAt: mesa.updatedAt.toISOString(),
  };
}

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

/** Orden natural por zona y nombre: "Mesa 2" antes que "Mesa 10". */
export function ordenarMesas<T extends { zona: string; nombre: string }>(mesas: T[]): T[] {
  return [...mesas].sort((a, b) => collator.compare(a.zona, b.zona) || collator.compare(a.nombre, b.nombre));
}
