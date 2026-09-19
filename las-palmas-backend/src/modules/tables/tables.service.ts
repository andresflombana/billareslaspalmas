import { prisma, Db, OPCIONES_TRANSACCION } from '../../config/prisma';
import { EstadoMesa, ESTADOS_MESA_MANUALES } from '../../constants/enums';
import { AccionAuditoria, EntidadAuditoria } from '../../constants/auditoria';
import { conflicto, noEncontrado, solicitudInvalida, HttpError } from '../../utils/http';
import {
  Cuerpo,
  booleanoObligatorio,
  enteroObligatorio,
  enteroOpcional,
  normalizarParaComparar,
  textoObligatorio,
  textoOpcional,
  unoDe,
} from '../../utils/validation';
import { registrarAuditoria, ultimaAccionPorEntidad } from '../audit/audit.repository';
import { anularVentaSiAbierta, crearVentaDeMesa, ventaAbiertaDeMesa } from '../ventas/ventas.repository';
import {
  MesaConSesion,
  actualizarMesa,
  buscarMesa,
  cambiarActiva,
  cambiarEstadoSi,
  crearMesa,
  liberarSiOcupada,
  listarMesas,
  nombresDeMesas,
  ocuparSiLibre,
  tarifaPorDefecto,
} from './tables.repository';
import { MesaDTO, aMesaDTO, ordenarMesas } from './tables.dto';

// Límites de validación (también los usa el frontend en sus formularios).
const MAX_NOMBRE = 40;
const MAX_ZONA = 40;
const TARIFA = { min: 1, max: 100_000 };
const MOTIVO = { min: 3, max: 200 };

// ---------------------------------------------------------------- consultas

async function motivoFueraServicio(db: Db, mesa: MesaConSesion): Promise<string | null> {
  if (mesa.estado !== EstadoMesa.FUERA_SERVICIO) return null;
  const ultimo = await ultimaAccionPorEntidad(db, EntidadAuditoria.MESA, AccionAuditoria.MESA_FUERA_SERVICIO, [mesa.id]);
  return comoMotivo(ultimo.get(mesa.id)?.detalle);
}

function comoMotivo(detalle: Record<string, unknown> | null | undefined): string | null {
  return typeof detalle?.motivo === 'string' ? detalle.motivo : null;
}

async function dto(db: Db, id: number): Promise<MesaDTO> {
  const mesa = await buscarMesa(db, id);
  if (!mesa) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
  return aMesaDTO(mesa, await motivoFueraServicio(db, mesa));
}

/** HU-06: todas las mesas activas (o todas, para Configuración) con su sesión en curso. */
export async function listar({ incluirInactivas }: { incluirInactivas: boolean }): Promise<MesaDTO[]> {
  const mesas = await listarMesas(prisma, { incluirInactivas });
  const fueraDeServicio = mesas.filter((m) => m.estado === EstadoMesa.FUERA_SERVICIO).map((m) => m.id);
  const motivos = await ultimaAccionPorEntidad(
    prisma,
    EntidadAuditoria.MESA,
    AccionAuditoria.MESA_FUERA_SERVICIO,
    fueraDeServicio,
  );
  return ordenarMesas(mesas.map((m) => aMesaDTO(m, comoMotivo(motivos.get(m.id)?.detalle))));
}

export function obtener(id: number): Promise<MesaDTO> {
  return dto(prisma, id);
}

// ---------------------------------------------------------------- CRUD (Admin)

async function asegurarNombreDisponible(db: Db, nombre: string, excluirId?: number) {
  const buscado = normalizarParaComparar(nombre);
  const existentes = await nombresDeMesas(db);
  const choque = existentes.find((m) => m.id !== excluirId && normalizarParaComparar(m.nombre) === buscado);
  if (choque) throw conflicto(`Ya existe una mesa llamada "${choque.nombre}"`, 'NOMBRE_DUPLICADO');
}

export async function crear(usuarioId: number, cuerpo: Cuerpo): Promise<MesaDTO> {
  const nombre = textoObligatorio(cuerpo, 'nombre', 'El nombre de la mesa', { max: MAX_NOMBRE });
  const zona = textoObligatorio(cuerpo, 'zona', 'La zona', { max: MAX_ZONA });
  const tarifaIndicada = enteroOpcional(cuerpo, 'tarifaPorMinuto', 'La tarifa por minuto', TARIFA);

  return prisma.$transaction(async (tx) => {
    await asegurarNombreDisponible(tx, nombre);
    const tarifaPorMinuto = tarifaIndicada ?? (await tarifaPorDefecto(tx));
    if (tarifaPorMinuto === null) {
      throw solicitudInvalida('Indica la tarifa por minuto: el negocio no tiene una tarifa por defecto configurada', 'TARIFA_REQUERIDA');
    }
    const mesa = await crearMesa(tx, { nombre, zona, tarifaPorMinuto });
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.MESA,
      entidadId: mesa.id,
      accion: AccionAuditoria.MESA_CREADA,
      detalle: { nombre, zona, tarifaPorMinuto },
    });
    return dto(tx, mesa.id);
  }, OPCIONES_TRANSACCION);
}

export async function editar(usuarioId: number, id: number, cuerpo: Cuerpo): Promise<MesaDTO> {
  const nombre = textoObligatorio(cuerpo, 'nombre', 'El nombre de la mesa', { max: MAX_NOMBRE });
  const zona = textoObligatorio(cuerpo, 'zona', 'La zona', { max: MAX_ZONA });
  const tarifaPorMinuto = enteroObligatorio(cuerpo, 'tarifaPorMinuto', 'La tarifa por minuto', TARIFA);

  return prisma.$transaction(async (tx) => {
    const antes = await buscarMesa(tx, id);
    if (!antes) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
    await asegurarNombreDisponible(tx, nombre, id);
    const cambio = antes.nombre !== nombre || antes.zona !== zona || antes.tarifaPorMinuto !== tarifaPorMinuto;
    if (cambio) {
      // Si la mesa está en juego, su sesión conserva la tarifa congelada al abrir (RN-02):
      // la tarifa nueva aplica desde la próxima apertura.
      await actualizarMesa(tx, id, { nombre, zona, tarifaPorMinuto });
      await registrarAuditoria(tx, {
        usuarioId,
        entidad: EntidadAuditoria.MESA,
        entidadId: id,
        accion: AccionAuditoria.MESA_EDITADA,
        detalle: {
          antes: { nombre: antes.nombre, zona: antes.zona, tarifaPorMinuto: antes.tarifaPorMinuto },
          despues: { nombre, zona, tarifaPorMinuto },
        },
      });
    }
    return dto(tx, id);
  }, OPCIONES_TRANSACCION);
}

// ---------------------------------------------------------------- HU-07: abrir mesa

/** Explica por qué una mesa no se pudo abrir (se llama cuando el UPDATE condicional no afectó filas). */
async function errorAlAbrir(db: Db, id: number): Promise<HttpError> {
  const mesa = await buscarMesa(db, id);
  if (!mesa) return noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
  if (!mesa.activa) return conflicto(`${mesa.nombre} está dada de baja`, 'MESA_INACTIVA');
  if (mesa.estado === EstadoMesa.OCUPADA) {
    const quien = mesa.ventas[0]?.usuario.nombre;
    return conflicto(
      `${mesa.nombre} ya está en juego${quien ? ` (la abrió ${quien})` : ''}. Pudo haberse abierto desde otro equipo.`,
      'MESA_OCUPADA',
    );
  }
  if (mesa.estado === EstadoMesa.FUERA_SERVICIO) return conflicto(`${mesa.nombre} está fuera de servicio`, 'MESA_FUERA_SERVICIO');
  return conflicto(`${mesa.nombre} no está disponible`, 'MESA_NO_DISPONIBLE');
}

/**
 * HU-07 — una sola transacción:
 *   1. Mesa LIBRE → OCUPADA con startedAt = reloj del SERVIDOR (nunca el del PC cliente).
 *   2. Venta ABIERTA con la tarifa congelada (RN-02) y el usuario que abrió (RF-30).
 *   3. AuditLog MESA_ABIERTA.
 * Si algo falla, ROLLBACK de todo: nunca queda una mesa ocupada sin su venta.
 */
export async function abrir(usuarioId: number, id: number): Promise<MesaDTO> {
  return prisma.$transaction(async (tx) => {
    const startedAt = new Date();
    const ocupada = await ocuparSiLibre(tx, id, startedAt);
    if (!ocupada) throw await errorAlAbrir(tx, id);

    const mesa = await buscarMesa(tx, id);
    if (!mesa) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
    const venta = await crearVentaDeMesa(tx, {
      mesaId: id,
      usuarioId,
      tarifaPorMinutoAplicada: mesa.tarifaPorMinuto,
      fechaApertura: startedAt,
    });
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.MESA,
      entidadId: id,
      accion: AccionAuditoria.MESA_ABIERTA,
      detalle: { ventaId: venta.id, startedAt: startedAt.toISOString(), tarifaAplicada: mesa.tarifaPorMinuto },
    });
    return dto(tx, id);
  }, OPCIONES_TRANSACCION);
}

// ---------------------------------------------------------------- Anular apertura (Admin)

/**
 * Única forma de liberar una mesa ocupada en Sprint 1 (el cobro llega en Sprints 3/5).
 * Solo Administrador, con motivo obligatorio y auditada: si el Operador pudiera
 * anular, podría abrir una mesa, cobrar en efectivo y borrar el rastro.
 */
export async function anularApertura(usuarioId: number, id: number, cuerpo: Cuerpo): Promise<MesaDTO> {
  const motivo = textoObligatorio(cuerpo, 'motivo', 'El motivo', MOTIVO);

  return prisma.$transaction(async (tx) => {
    const mesa = await buscarMesa(tx, id);
    if (!mesa) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
    const venta = await ventaAbiertaDeMesa(tx, id);

    const liberada = await liberarSiOcupada(tx, id);
    if (!liberada) throw conflicto(`${mesa.nombre} no está en juego: no hay apertura que anular`, 'MESA_NO_OCUPADA');
    // Preparado para Sprint 3: una sesión con consumos no se anula, se cobra.
    if (venta && venta._count.items > 0) {
      throw conflicto(`${mesa.nombre} ya tiene consumos registrados: no se puede anular, debe cobrarse`, 'MESA_CON_CONSUMOS');
    }

    const ahora = new Date();
    if (venta) await anularVentaSiAbierta(tx, venta.id, ahora);
    const minutosAbierta = mesa.startedAt ? Math.floor((ahora.getTime() - mesa.startedAt.getTime()) / 60_000) : null;
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.MESA,
      entidadId: id,
      accion: AccionAuditoria.MESA_APERTURA_ANULADA,
      detalle: {
        motivo,
        ventaId: venta?.id ?? null,
        startedAt: mesa.startedAt?.toISOString() ?? null,
        minutosAbierta,
      },
    });
    return dto(tx, id);
  }, OPCIONES_TRANSACCION);
}

// ---------------------------------------------------------------- HU-08: estado manual (Admin)

export async function cambiarEstado(usuarioId: number, id: number, cuerpo: Cuerpo): Promise<MesaDTO> {
  const estado = unoDe(cuerpo, 'estado', 'El estado', ESTADOS_MESA_MANUALES);
  const motivo =
    estado === EstadoMesa.FUERA_SERVICIO
      ? textoObligatorio(cuerpo, 'motivo', 'El motivo', MOTIVO)
      : textoOpcional(cuerpo, 'motivo', 'El motivo', { max: MOTIVO.max });
  const desde = estado === EstadoMesa.FUERA_SERVICIO ? EstadoMesa.LIBRE : EstadoMesa.FUERA_SERVICIO;

  return prisma.$transaction(async (tx) => {
    const cambiado = await cambiarEstadoSi(tx, id, desde, estado);
    if (!cambiado) {
      const mesa = await buscarMesa(tx, id);
      if (!mesa) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
      if (!mesa.activa) throw conflicto(`${mesa.nombre} está dada de baja`, 'MESA_INACTIVA');
      if (mesa.estado === estado) {
        throw estado === EstadoMesa.FUERA_SERVICIO
          ? conflicto(`${mesa.nombre} ya está fuera de servicio`, 'MESA_YA_FUERA_SERVICIO')
          : conflicto(`${mesa.nombre} ya está disponible`, 'MESA_YA_DISPONIBLE');
      }
      if (mesa.estado === EstadoMesa.OCUPADA) {
        throw conflicto(`${mesa.nombre} está en juego: no se puede poner fuera de servicio`, 'MESA_OCUPADA');
      }
      throw conflicto(`${mesa.nombre} no admite ese cambio de estado`, 'TRANSICION_NO_PERMITIDA');
    }
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.MESA,
      entidadId: id,
      accion: estado === EstadoMesa.FUERA_SERVICIO ? AccionAuditoria.MESA_FUERA_SERVICIO : AccionAuditoria.MESA_REACTIVADA,
      detalle: { estadoAnterior: desde, estadoNuevo: estado, motivo },
    });
    return dto(tx, id);
  }, OPCIONES_TRANSACCION);
}

// ---------------------------------------------------------------- Baja / alta lógica (Admin)

export async function cambiarActivacion(usuarioId: number, id: number, cuerpo: Cuerpo): Promise<MesaDTO> {
  const activa = booleanoObligatorio(cuerpo, 'activa', 'El campo activa');
  const motivo = textoOpcional(cuerpo, 'motivo', 'El motivo', { max: MOTIVO.max });

  return prisma.$transaction(async (tx) => {
    const cambiado = await cambiarActiva(tx, id, activa);
    if (!cambiado) {
      const mesa = await buscarMesa(tx, id);
      if (!mesa) throw noEncontrado('La mesa no existe', 'MESA_NO_ENCONTRADA');
      if (activa) throw conflicto(`${mesa.nombre} ya está activa`, 'MESA_YA_ACTIVA');
      if (!mesa.activa) throw conflicto(`${mesa.nombre} ya está dada de baja`, 'MESA_YA_INACTIVA');
      throw conflicto(`${mesa.nombre} está en juego: no se puede dar de baja`, 'MESA_OCUPADA');
    }
    await registrarAuditoria(tx, {
      usuarioId,
      entidad: EntidadAuditoria.MESA,
      entidadId: id,
      accion: activa ? AccionAuditoria.MESA_DADA_DE_ALTA : AccionAuditoria.MESA_DADA_DE_BAJA,
      detalle: { motivo },
    });
    return dto(tx, id);
  }, OPCIONES_TRANSACCION);
}
