import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedir } from './cliente';
import { claves, INTERVALO_SINCRONIZACION_MS } from './consultas';
import type { Barra, CuentaBarra } from './tipos';

/** HU-16 / HU-17: las dos barras con sus cuentas abiertas, sincronizadas cada 15 s. */
export function useBarras() {
  return useQuery({
    queryKey: claves.barras,
    queryFn: () => pedir<Barra[]>('GET', '/bars'),
    refetchInterval: INTERVALO_SINCRONIZACION_MS,
  });
}

function useAccionBarra<V, R>(fn: (variables: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (resultado) => {
      // Las acciones de abrir/cerrar devuelven la barra completa: se pinta de inmediato.
      if (resultado && typeof resultado === 'object' && 'cuentas' in resultado) {
        const barra = resultado as unknown as Barra;
        qc.setQueryData<Barra[]>(claves.barras, (lista) => lista?.map((b) => (b.id === barra.id ? barra : b)));
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: claves.barras }),
  });
}

export function useAbrirBarra() {
  return useAccionBarra((id: number) => pedir<Barra>('POST', `/bars/${id}/open`));
}

export function useCerrarBarra() {
  return useAccionBarra((id: number) => pedir<Barra>('POST', `/bars/${id}/close`));
}

export function useAbrirCuenta() {
  return useAccionBarra((v: { barraId: number; etiqueta: string | null }) =>
    pedir<CuentaBarra>('POST', `/bars/${v.barraId}/accounts`, { etiqueta: v.etiqueta }),
  );
}

export function useCancelarCuenta() {
  return useAccionBarra((cuentaId: number) => pedir<CuentaBarra>('POST', `/bar-accounts/${cuentaId}/cancel`));
}
