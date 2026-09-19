import { QueryClient } from '@tanstack/react-query';
import { esApiError } from './cliente';

// Sincronización entre los tres PCs sin websockets (PROMPT INTERFAZ BILLAR §10):
// cada equipo vuelve a pedir el estado cada 15 s, y además al volver a la
// ventana y justo después de cada acción propia. Criterio: un cambio se ve en
// los tres equipos en menos de 30 s.
export const INTERVALO_SINCRONIZACION_MS = 15_000;

export const claves = {
  mesas: ['mesas'] as const,
  mesasConfiguracion: ['mesas', 'configuracion'] as const,
  mesa: (id: number) => ['mesas', 'detalle', id] as const,
  barras: ['barras'] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
      // No se reintentan errores 4xx (no van a cambiar); sí los de red/servidor.
      retry: (intentos, error) => !(esApiError(error) && error.status >= 400 && error.status < 500) && intentos < 2,
    },
    mutations: {
      retry: false,
    },
  },
});
