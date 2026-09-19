import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from './cliente';
import { claves, INTERVALO_SINCRONIZACION_MS } from './consultas';
import type { Mesa } from './tipos';

// ---------------------------------------------------------------- consultas

/** HU-06: mesas activas para /billar, sincronizadas cada 15 s. */
export function useMesas() {
  return useQuery({
    queryKey: claves.mesas,
    queryFn: () => pedir<Mesa[]>('GET', '/tables'),
    refetchInterval: INTERVALO_SINCRONIZACION_MS,
  });
}

/** Todas las mesas, incluidas las dadas de baja (Configuración → Mesas, solo Administrador). */
export function useMesasConfiguracion() {
  return useQuery({
    queryKey: claves.mesasConfiguracion,
    queryFn: () => pedir<Mesa[]>('GET', '/tables?incluirInactivas=true'),
  });
}

export function useMesa(id: number) {
  return useQuery({
    queryKey: claves.mesa(id),
    queryFn: () => pedir<Mesa>('GET', `/tables/${id}`),
    refetchInterval: INTERVALO_SINCRONIZACION_MS,
    enabled: Number.isInteger(id) && id > 0,
  });
}

// ---------------------------------------------------------------- acciones

/**
 * Tras cualquier acción sobre una mesa: se pinta de inmediato la respuesta del
 * servidor y se refrescan todas las vistas de mesas (cuadrícula, detalle,
 * configuración). Si la acción falló (p. ej. 409 porque otro PC ya la abrió),
 * también se refresca, para mostrar el estado real.
 */
function useAccionMesa<V>(fn: (variables: V) => Promise<Mesa>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (mesa) => {
      qc.setQueryData<Mesa[]>(claves.mesas, (lista) =>
        lista ? (mesa.activa ? lista.map((m) => (m.id === mesa.id ? mesa : m)) : lista.filter((m) => m.id !== mesa.id)) : lista,
      );
      qc.setQueryData(claves.mesa(mesa.id), mesa);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: claves.mesas }),
  });
}

/** HU-07 — abrir mesa con un clic. */
export function useAbrirMesa() {
  return useAccionMesa((id: number) => pedir<Mesa>('POST', `/tables/${id}/open`));
}

/** HU-08 (reactivar) y su inverso (poner fuera de servicio). Solo Administrador. */
export function useCambiarEstadoMesa() {
  return useAccionMesa((v: { id: number; estado: 'LIBRE' | 'FUERA_SERVICIO'; motivo?: string }) =>
    pedir<Mesa>('PATCH', `/tables/${v.id}/status`, { estado: v.estado, motivo: v.motivo }),
  );
}

/** Anular apertura: solo Administrador, con motivo obligatorio. */
export function useAnularApertura() {
  return useAccionMesa((v: { id: number; motivo: string }) =>
    pedir<Mesa>('POST', `/tables/${v.id}/cancel-opening`, { motivo: v.motivo }),
  );
}

export interface DatosMesa {
  nombre: string;
  zona: string;
  /** null al crear = usar la tarifa por defecto del negocio. */
  tarifaPorMinuto: number | null;
}

export function useCrearMesa() {
  return useAccionMesa((datos: DatosMesa) => pedir<Mesa>('POST', '/tables', datos));
}

export function useEditarMesa() {
  return useAccionMesa((v: { id: number; datos: DatosMesa & { tarifaPorMinuto: number } }) =>
    pedir<Mesa>('PUT', `/tables/${v.id}`, v.datos),
  );
}

/** Baja / alta lógica. */
export function useCambiarActivaMesa() {
  return useAccionMesa((v: { id: number; activa: boolean; motivo?: string }) =>
    pedir<Mesa>('PATCH', `/tables/${v.id}/active`, { activa: v.activa, motivo: v.motivo }),
  );
}
